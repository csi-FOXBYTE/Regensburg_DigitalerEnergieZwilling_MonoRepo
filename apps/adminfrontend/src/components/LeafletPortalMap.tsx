import { municipalityDesign } from "@/config/theme";
import { alpha, useTheme } from "@mui/material/styles";
import L, {
  type FitBoundsOptions,
  type LatLngExpression,
  type Map as LeafletMap,
  type MapOptions,
  type TileLayerOptions,
} from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  useCallback,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type LeafletPortalMarkerDefinition = {
  id: string;
  position: LatLngExpression;
  content: ReactNode;
  iconSize?: readonly [width: number, height: number];
  iconAnchor?: readonly [x: number, y: number];
  zIndexOffset?: number;
};

type SafeTileLayerOptions = Omit<TileLayerOptions, "attribution">;

export type LeafletPortalMapProps = {
  markers: readonly LeafletPortalMarkerDefinition[];
  initialCenter: LatLngExpression;
  initialZoom: number;
  tileUrl: string;
  attribution: ReactNode;
  ariaLabel: string;
  fitMarkers?: boolean;
  fitBoundsOptions?: FitBoundsOptions;
  mapOptions?: Omit<
    MapOptions,
    "attributionControl" | "center" | "layers" | "zoom"
  >;
  tileLayerOptions?: SafeTileLayerOptions;
  className?: string;
  style?: CSSProperties;
};

type InitialMapConfiguration = Pick<
  LeafletPortalMapProps,
  | "initialCenter"
  | "initialZoom"
  | "mapOptions"
  | "tileLayerOptions"
  | "tileUrl"
>;

class LeafletMapController {
  readonly map: LeafletMap;
  readonly #resizeObserver?: ResizeObserver;

  constructor(container: HTMLDivElement, config: InitialMapConfiguration) {
    this.map = L.map(container, {
      ...config.mapOptions,
      attributionControl: false,
    }).setView(config.initialCenter, config.initialZoom);

    // Attribution is intentionally excluded and overwritten here. Leaflet's
    // attribution control accepts HTML strings; this component renders its
    // attribution as a React node instead.
    const safeTileOptions: TileLayerOptions = {
      ...config.tileLayerOptions,
      attribution: undefined,
    };
    L.tileLayer(config.tileUrl, safeTileOptions).addTo(this.map);

    if (typeof ResizeObserver !== "undefined") {
      this.#resizeObserver = new ResizeObserver(() => {
        this.map.invalidateSize({ pan: false });
      });
      this.#resizeObserver.observe(container);
    }
  }

  destroy() {
    this.#resizeObserver?.disconnect();
    this.map.remove();
  }
}

function LeafletPortalMarker({
  map,
  definition,
}: {
  map: LeafletMap;
  definition: LeafletPortalMarkerDefinition;
}) {
  const [host] = useState(() => {
    const element = document.createElement("div");
    element.dataset.leafletPortalMarker = definition.id;
    L.DomEvent.disableClickPropagation(element);
    L.DomEvent.disableScrollPropagation(element);
    return element;
  });
  const [marker] = useState(() => {
    const iconSize = definition.iconSize ?? [32, 32];
    const iconAnchor = definition.iconAnchor ?? [
      iconSize[0] / 2,
      iconSize[1] / 2,
    ];

    // An actual element is the only content passed to Leaflet. Display data
    // stays in the React portal and is escaped by React as normal.
    const icon = L.divIcon({
      // Leaflet disables pointer events on marker icons unless this static
      // class is present. We add only the CSS opt-in while leaving the marker's
      // Leaflet interaction disabled, so the portaled React tree owns events.
      className: "leaflet-interactive",
      html: host,
      iconSize: [...iconSize],
      iconAnchor: [...iconAnchor],
    });
    return L.marker(definition.position, {
      icon,
      interactive: false,
      keyboard: false,
      zIndexOffset: definition.zIndexOffset ?? 0,
    });
  });

  useLayoutEffect(() => {
    marker.addTo(map);
    return () => {
      marker.remove();
    };
  }, [map, marker]);

  useLayoutEffect(() => {
    marker.setLatLng(definition.position);
    marker.setZIndexOffset(definition.zIndexOffset ?? 0);
  }, [definition.position, definition.zIndexOffset, marker]);

  return createPortal(definition.content, host);
}

const mapCanvasStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
};

const attributionStyle: CSSProperties = {
  position: "absolute",
  right: 0,
  bottom: 0,
  zIndex: 1000,
  padding: "1px 5px",
  fontSize: 11,
  lineHeight: 1.5,
};

export function LeafletPortalMap({
  markers,
  initialCenter,
  initialZoom,
  tileUrl,
  attribution,
  ariaLabel,
  fitMarkers = false,
  fitBoundsOptions,
  mapOptions,
  tileLayerOptions,
  className,
  style,
}: LeafletPortalMapProps) {
  const theme = useTheme();
  const [initialConfig] = useState<InitialMapConfiguration>(() => ({
    initialCenter,
    initialZoom,
    mapOptions,
    tileLayerOptions,
    tileUrl,
  }));
  const [map, setMap] = useState<LeafletMap>();

  const ids = new Set<string>();
  for (const marker of markers) {
    if (ids.has(marker.id)) {
      throw new Error(`Duplicate Leaflet marker id: ${marker.id}`);
    }
    ids.add(marker.id);
  }

  const setContainerRef = useCallback(
    (container: HTMLDivElement | null) => {
      if (!container) return;

      const controller = new LeafletMapController(container, initialConfig);
      setMap(controller.map);

      return () => controller.destroy();
    },
    [initialConfig],
  );

  useLayoutEffect(() => {
    if (!map || !fitMarkers) return;

    if (markers.length === 0) {
      map.setView(initialConfig.initialCenter, initialConfig.initialZoom);
      return;
    }

    const bounds = L.latLngBounds(markers.map(({ position }) => position));
    map.fitBounds(bounds, {
      maxZoom: initialConfig.initialZoom,
      padding: [32, 32],
      ...fitBoundsOptions,
    });
  }, [fitBoundsOptions, fitMarkers, initialConfig, map, markers]);

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      <div
        ref={setContainerRef}
        role="region"
        aria-label={ariaLabel}
        style={mapCanvasStyle}
      />

      {map &&
        markers.map((definition) => (
          <LeafletPortalMarker
            key={definition.id}
            map={map}
            definition={definition}
          />
        ))}

      <div
        style={{
          ...attributionStyle,
          background: alpha(theme.palette.common.white, 0.8),
          color: municipalityDesign.colors.map.attributionText,
        }}
      >
        {attribution}
      </div>
    </div>
  );
}
