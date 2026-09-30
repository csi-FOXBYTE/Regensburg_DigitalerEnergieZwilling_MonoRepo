import { adaptBuildingFeature } from '@/config/adapters/buildingFeature';
import { mapConfig } from '@/config/map';
import {
  findExactBuildingFeature,
  hasExactBuildingId,
} from '@/lib/building-target';
import { useStore } from '@nanostores/react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { AnimatePresence, motion } from 'motion/react';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Cesium3DTileset, ImageryLayer, Viewer } from 'resium';
import { toast } from 'sonner';
import { CameraController } from '../../lib/camera';
import { getMapResources } from '../../lib/api/public';
import {
  type FocusCameraIntent,
  registerCameraOwner,
  requestCamera,
} from '../../lib/camera-state';
import {
  $building,
  setBuilding,
  unselectBuilding,
} from '../../lib/state/building';
import { $step, Step } from '../../lib/state/ui/progress';
import InvalidBuildingConfirmDialog from './InvalidBuildingConfirmDialog';

const baseImageryProvider = new Cesium.UrlTemplateImageryProvider({
  url: mapConfig.baseLayer.urlTemplate,
  credit: mapConfig.baseLayer.credit,
  maximumLevel: 19,
});

const baseTilesetStyle = new Cesium.Cesium3DTileStyle({
  color: "color('white')",
});
const selectedFeatureColor = Cesium.Color.fromCssColorString(
  mapConfig.featureColors.selected,
);
const nonTargetFeatureColor = Cesium.Color.fromCssColorString(
  mapConfig.featureColors.nonTarget,
);

function colorBuildingFeatures(
  content: Cesium.Cesium3DTileContent,
  selectedBuildingId: string | null,
) {
  for (let i = 0; i < content.featuresLength; i++) {
    const feature = content.getFeature(i);
    const building = adaptBuildingFeature(feature);
    feature.color =
      building.id === selectedBuildingId
        ? selectedFeatureColor
        : building.isValidBuilding
          ? Cesium.Color.WHITE
          : nonTargetFeatureColor;
  }

  for (const innerContent of content.innerContents ?? []) {
    colorBuildingFeatures(
      innerContent as Cesium.Cesium3DTileContent,
      selectedBuildingId,
    );
  }
}

type Map3DProps = {
  children?: ReactNode;
};

const LOAD_TIMEOUT_MS = 20000;
const ADDRESS_SELECTION_BOX_HALF_SIZE_METERS = 100;
const ADDRESS_SELECTION_TIMEOUT_MS = 5000;

function formatAddress(address: {
  street?: string;
  housenumber?: string;
}): string {
  return `${address.street ?? ''} ${address.housenumber ?? ''}`.trim();
}

type BuildingTargetFocusIntent = FocusCameraIntent & {
  reason:
    | Extract<FocusCameraIntent['reason'], { type: 'address' }>
    | Extract<FocusCameraIntent['reason'], { type: 'externalBuilding' }>;
};

function isBuildingTargetFocusIntent(
  intent: FocusCameraIntent,
): intent is BuildingTargetFocusIntent {
  return (
    intent.reason.type === 'address' ||
    intent.reason.type === 'externalBuilding'
  );
}

function getRequestedBuildingId(intent: BuildingTargetFocusIntent): string {
  return intent.reason.type === 'address'
    ? intent.reason.address.buildingId
    : intent.reason.buildingId;
}

function allowsInvalidBuilding(intent: BuildingTargetFocusIntent): boolean {
  return (
    intent.reason.type === 'address' &&
    intent.reason.address.allowInvalidBuilding === true
  );
}

function selectFeatureForTarget(
  feature: Cesium.Cesium3DTileFeature,
  intent: BuildingTargetFocusIntent,
  allowInvalidBuilding = allowsInvalidBuilding(intent),
) {
  const address =
    intent.reason.type === 'address' ? intent.reason.address : null;
  setBuilding(
    feature,
    {
      lon: intent.target.longitudeDegrees,
      lat: intent.target.latitudeDegrees,
    },
    {
      // Keep exactly the searched address when a building carries several.
      streetOverride: address ? formatAddress(address) || undefined : undefined,
      allowInvalidBuilding,
    },
  );
}

function findTargetFeatureByDrillPick(
  viewer: Cesium.Viewer,
  intent: BuildingTargetFocusIntent,
): Cesium.Cesium3DTileFeature | undefined {
  const cartographic = Cesium.Cartographic.fromDegrees(
    intent.target.longitudeDegrees,
    intent.target.latitudeDegrees,
  );
  const groundHeight = viewer.scene.globe.getHeight(cartographic) ?? 350;
  const position = Cesium.Cartesian3.fromDegrees(
    intent.target.longitudeDegrees,
    intent.target.latitudeDegrees,
    groundHeight,
  );

  viewer.scene.requestRender();
  const screenPosition = viewer.scene.cartesianToCanvasCoordinates(position);
  if (!screenPosition) return undefined;

  const drilled = viewer.scene
    .drillPick(screenPosition)
    .filter(
      (picked): picked is Cesium.Cesium3DTileFeature =>
        picked instanceof Cesium.Cesium3DTileFeature,
    );
  return findExactBuildingFeature(drilled, getRequestedBuildingId(intent));
}

function createAddressSelectionBox(
  viewer: Cesium.Viewer,
  intent: BuildingTargetFocusIntent,
): Cesium.OrientedBoundingBox {
  const cartographic = Cesium.Cartographic.fromDegrees(
    intent.target.longitudeDegrees,
    intent.target.latitudeDegrees,
  );
  const groundHeight = viewer.scene.globe.getHeight(cartographic) ?? 350;
  const center = Cesium.Cartesian3.fromDegrees(
    intent.target.longitudeDegrees,
    intent.target.latitudeDegrees,
    groundHeight,
  );
  const transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);
  const rotation = Cesium.Matrix4.getMatrix3(transform, new Cesium.Matrix3());
  const halfAxes = Cesium.Matrix3.multiplyByScale(
    rotation,
    new Cesium.Cartesian3(
      ADDRESS_SELECTION_BOX_HALF_SIZE_METERS,
      ADDRESS_SELECTION_BOX_HALF_SIZE_METERS,
      ADDRESS_SELECTION_BOX_HALF_SIZE_METERS,
    ),
    new Cesium.Matrix3(),
  );
  return new Cesium.OrientedBoundingBox(center, halfAxes);
}

function tileIntersectsAddressSelectionBox(
  tile: Cesium.Cesium3DTile,
  box: Cesium.OrientedBoundingBox,
): boolean {
  return (
    Cesium.OrientedBoundingBox.distanceSquaredTo(
      box,
      tile.boundingSphere.center,
    ) <=
    tile.boundingSphere.radius * tile.boundingSphere.radius
  );
}

function findFeatureById(
  content: Cesium.Cesium3DTileContent,
  buildingId: string,
): Cesium.Cesium3DTileFeature | undefined {
  for (let i = 0; i < content.featuresLength; i++) {
    const feature = content.getFeature(i);
    if (hasExactBuildingId(feature, buildingId)) return feature;
  }

  for (const innerContent of content.innerContents ?? []) {
    const feature = findFeatureById(
      innerContent as Cesium.Cesium3DTileContent,
      buildingId,
    );
    if (feature) return feature;
  }
}

type PendingAddressSelection = {
  viewer: Cesium.Viewer;
  intent: BuildingTargetFocusIntent;
  searchBox: Cesium.OrientedBoundingBox;
  scannedTiles: Set<Cesium.Cesium3DTile>;
  timeoutId: number;
  onComplete: (
    feature: Cesium.Cesium3DTileFeature | undefined,
    intent: BuildingTargetFocusIntent,
  ) => void;
};

class AddressFeatureSelector {
  private pending: PendingAddressSelection | undefined;

  start(
    viewer: Cesium.Viewer,
    intent: FocusCameraIntent,
    onComplete: PendingAddressSelection['onComplete'],
  ) {
    if (!isBuildingTargetFocusIntent(intent)) return;
    this.cancel();
    const timeoutId = window.setTimeout(
      () => this.finishWithDrillPick(),
      ADDRESS_SELECTION_TIMEOUT_MS,
    );
    this.pending = {
      viewer,
      intent,
      searchBox: createAddressSelectionBox(viewer, intent),
      scannedTiles: new Set(),
      timeoutId,
      onComplete,
    };
    viewer.scene.requestRender();
  }

  inspectVisibleTile(tile: Cesium.Cesium3DTile) {
    const pending = this.pending;
    if (!pending || pending.scannedTiles.has(tile)) return;
    pending.scannedTiles.add(tile);
    if (!tileIntersectsAddressSelectionBox(tile, pending.searchBox)) return;

    const feature = findFeatureById(
      tile.content,
      getRequestedBuildingId(pending.intent),
    );
    if (!feature) return;

    const { intent, onComplete } = pending;
    this.cancel();
    onComplete(feature, intent);
  }

  finishWithDrillPick() {
    const pending = this.pending;
    if (!pending) return;
    this.cancel();
    pending.onComplete(
      findTargetFeatureByDrillPick(pending.viewer, pending.intent),
      pending.intent,
    );
  }

  cancel() {
    if (!this.pending) return;
    window.clearTimeout(this.pending.timeoutId);
    this.pending = undefined;
  }
}

export function Map3D({ children }: Map3DProps) {
  const { t } = useTranslation('map');
  const currentStep = useStore($step);
  const building = useStore($building);
  const [viewerRef, setViewerRef] = useState<Cesium.Viewer | null>(null);
  const [tilesetRef, setTilesetRef] = useState<Cesium.Cesium3DTileset | null>(
    null,
  );
  const addressFeatureSelectorRef = useRef(new AddressFeatureSelector());
  const [pendingInvalidSelection, setPendingInvalidSelection] = useState<{
    feature: Cesium.Cesium3DTileFeature;
    intent: BuildingTargetFocusIntent;
  } | null>(null);
  const [terrainProvider, setTerrainProvider] =
    useState<Cesium.TerrainProvider | null>(null);
  const [tilesetUrl, setTilesetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const handleTargetSelection = useCallback(
    (
      feature: Cesium.Cesium3DTileFeature | undefined,
      intent: BuildingTargetFocusIntent,
    ) => {
      if (!feature) {
        toast.warning(t('externalBuildingLink.notFoundWarning'));
        return;
      }

      if (
        !adaptBuildingFeature(feature).isValidBuilding &&
        !allowsInvalidBuilding(intent)
      ) {
        setPendingInvalidSelection({ feature, intent });
        return;
      }

      selectFeatureForTarget(feature, intent);
    },
    [t],
  );

  useEffect(() => {
    let cancelled = false;

    void getMapResources()
      .then(async (resources) => {
        if (cancelled) return;
        setTilesetUrl(
          new URL('tileset.json', resources.tilesBaseUrl).toString(),
        );

        try {
          const provider = await Cesium.CesiumTerrainProvider.fromUrl(
            resources.terrainBaseUrl,
          );
          if (!cancelled) setTerrainProvider(provider);
        } catch (error) {
          console.error('Terrain konnte nicht geladen werden:', error);
          if (!cancelled) {
            setTerrainProvider(new Cesium.EllipsoidTerrainProvider());
          }
        }
      })
      .catch((error) => {
        console.error('Kartenressourcen konnten nicht geladen werden:', error);
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoadFailed(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => () => addressFeatureSelectorRef.current.cancel(), []);

  const selectedBuildingId = building?.id ?? null;

  useEffect(() => {
    if (!tilesetRef) return;
    viewerRef?.scene.requestRender();
  }, [selectedBuildingId, tilesetRef, viewerRef]);

  useEffect(() => {
    if (!viewerRef || building) return;
    requestCamera({ type: 'resetTransform' });
  }, [building, viewerRef]);

  useEffect(() => {
    if (!viewerRef) return;
    const handler = new Cesium.ScreenSpaceEventHandler(viewerRef.scene.canvas);
    handler.setInputAction(
      (click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const picked = viewerRef.scene.pick(click.position);
        if (!picked) unselectBuilding();
      },
      Cesium.ScreenSpaceEventType.LEFT_CLICK,
    );
    return () => handler.destroy();
  }, [viewerRef]);

  useLayoutEffect(() => {
    if (!viewerRef) return;

    viewerRef.scene.globe.depthTestAgainstTerrain = true;

    const ambientOcclusion = viewerRef.scene.postProcessStages.ambientOcclusion;
    ambientOcclusion.enabled = true;
    ambientOcclusion.uniforms.intensity = 3.0;
    ambientOcclusion.uniforms.bias = 0.1;
    ambientOcclusion.uniforms.lengthCap = 0.26;
    ambientOcclusion.uniforms.stepCount = 8;
    ambientOcclusion.uniforms.directionCount = 16;

    viewerRef.scene.globe.baseColor = Cesium.Color.WHITE;
    viewerRef.scene.globe.showGroundAtmosphere = false;

    const cameraController = new CameraController(viewerRef, {
      onFocusComplete: (intent) =>
        addressFeatureSelectorRef.current.start(
          viewerRef,
          intent,
          handleTargetSelection,
        ),
    });
    return registerCameraOwner(cameraController);
  }, [handleTargetSelection, viewerRef]);

  const isInteractiveStep = currentStep === Step.Building;
  return (
    <div
      role="region"
      aria-label={t('map.stepTitle')}
      aria-hidden={!isInteractiveStep}
      className={`absolute top-(--header-height) left-0 h-(--content-height) w-full ${isInteractiveStep ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      {isInteractiveStep && <h1 className="sr-only">{t('map.stepTitle')}</h1>}
      {terrainProvider && (
        <Viewer
          ref={(ref) => {
            if (!ref?.cesiumElement) return;
            setViewerRef(ref.cesiumElement);
          }}
          className="h-full"
          geocoder={false}
          baseLayer={false}
          animation={false}
          requestRenderMode={true}
          baseLayerPicker={false}
          projectionPicker={false}
          homeButton={false}
          infoBox={false}
          vrButton={false}
          timeline={false}
          navigationHelpButton={false}
          fullscreenButton={false}
          scene3DOnly={true}
          terrainProvider={terrainProvider}
        >
          {isInteractiveStep && children}
          <ImageryLayer imageryProvider={baseImageryProvider} />
          {tilesetUrl && (
            <Cesium3DTileset
              onAllTilesLoad={() => {
                setLoading(false);
                setLoadFailed(false);
                addressFeatureSelectorRef.current.finishWithDrillPick();
              }}
              onTileVisible={(tile) => {
                colorBuildingFeatures(tile.content, selectedBuildingId);
                addressFeatureSelectorRef.current.inspectVisibleTile(tile);
              }}
              onReady={(tileset) => {
                setTilesetRef(tileset);
                tileset.colorBlendMode =
                  Cesium.Cesium3DTileColorBlendMode.REPLACE;
                tileset.colorBlendAmount = 1.0;
                tileset.style = baseTilesetStyle;
                tileset.imageBasedLighting.imageBasedLightingFactor.x = 2;
                tileset.imageBasedLighting.imageBasedLightingFactor.y = 2;
              }}
              onClick={(movement, feature) => {
                if (!feature || !viewerRef || !movement.position) return;
                addressFeatureSelectorRef.current.cancel();
                const tileFeature = feature as Cesium.Cesium3DTileFeature;
                if (!adaptBuildingFeature(tileFeature).isValidBuilding) return;

                const picked = viewerRef.scene.pickPosition(movement.position);
                if (!Cesium.defined(picked)) return;

                const cartographic = Cesium.Cartographic.fromCartesian(picked);
                const target = {
                  longitudeDegrees: Cesium.Math.toDegrees(
                    cartographic.longitude,
                  ),
                  latitudeDegrees: Cesium.Math.toDegrees(cartographic.latitude),
                };
                const result = requestCamera({
                  type: 'focus',
                  target,
                  reason: { type: 'building' },
                  accommodateMobileOverlay: true,
                });
                if (result === 'ignored') return;

                setBuilding(tileFeature, {
                  lon: target.longitudeDegrees,
                  lat: target.latitudeDegrees,
                });
              }}
              url={tilesetUrl}
            />
          )}
        </Viewer>
      )}
      {currentStep === Step.Welcome && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              'linear-gradient(to bottom, transparent var(--landing-map-fade-start), var(--background) var(--landing-map-fade-end))',
          }}
        />
      )}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-white/95 backdrop-blur-md"
          >
            {loadFailed ? (
              <div
                className="flex max-w-sm flex-col items-center gap-3 px-6 text-center"
                role="alert"
              >
                <h2 className="text-lg font-semibold">
                  {t('map.loadErrorTitle')}
                </h2>
                <p className="text-sm text-gray-600">
                  {t('map.loadErrorMessage')}
                </p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="bg-primary text-primary-foreground hover:bg-primary-hover mt-1 px-4 py-2 text-sm font-semibold"
                >
                  {t('map.retry')}
                </button>
              </div>
            ) : (
              <div role="status" aria-live="polite">
                {t('map.loading')}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <InvalidBuildingConfirmDialog
        open={pendingInvalidSelection !== null}
        onOpenChange={(open) => {
          if (!open) setPendingInvalidSelection(null);
        }}
        onConfirm={() => {
          if (pendingInvalidSelection) {
            selectFeatureForTarget(
              pendingInvalidSelection.feature,
              pendingInvalidSelection.intent,
              true,
            );
          }
          setPendingInvalidSelection(null);
        }}
      />
    </div>
  );
}
