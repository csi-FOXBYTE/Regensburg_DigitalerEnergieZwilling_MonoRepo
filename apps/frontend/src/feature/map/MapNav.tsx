import { Button } from '@/components/ui/button';
import {
  $cameraHeading,
  $cameraStatus,
  requestCamera,
} from '@/lib/camera-state';
import { useStore } from '@nanostores/react';
import {
  Box,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Map as MapIcon,
  Minus,
  Plus,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MapHelp } from './MapHelp';

export function MapNav() {
  const { t } = useTranslation('map');
  const cameraStatus = useStore($cameraStatus);
  const heading = useStore($cameraHeading);
  const disabled =
    !cameraStatus.initialized || cameraStatus.activity !== 'idle';
  const isPerspective = cameraStatus.mode === 'perspective';
  const nextMode = isPerspective ? 'topDown' : 'perspective';

  return (
    <nav
      aria-label={t('mapNav.navigationLabel')}
      className="absolute top-2 right-2 z-10 max-w-20 md:top-4 md:right-4"
    >
      <div className="rounded-toolbar flex flex-col overflow-hidden border border-neutral-200 bg-white shadow-lg">
        {/* Help */}
        <div className="flex flex-col items-center gap-1 md:px-3 md:pt-3 md:pb-2">
          <MapHelp />
          <span className="hidden text-xs font-medium md:block">
            {t('mapNav.help')}
          </span>
        </div>

        <hr className="border-neutral-200" />

        {/* View mode */}
        <div className="flex flex-col items-center gap-1 md:px-3 md:pt-2 md:pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-floating-control bg-white hover:bg-neutral-100"
            disabled={disabled}
            onClick={() => requestCamera({ type: 'setMode', mode: nextMode })}
            aria-label={t(
              isPerspective
                ? 'mapNav.ariaLabelSwitchToTopDown'
                : 'mapNav.ariaLabelSwitchToPerspective',
            )}
          >
            {isPerspective ? (
              <Box aria-hidden="true" />
            ) : (
              <MapIcon aria-hidden="true" />
            )}
          </Button>
          <span className="hidden text-center text-xs font-medium md:block">
            {t('mapNav.viewMode')}
          </span>
        </div>

        <hr className="border-neutral-200" />

        {/* Compass */}
        <div className="flex flex-col items-center gap-1 md:px-3 md:pt-2 md:pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-floating-control"
            disabled={disabled}
            onClick={() => requestCamera({ type: 'alignNorth' })}
            aria-label={t('mapNav.ariaLabelNorth')}
          >
            <svg
              className="size-8"
              viewBox="0 0 20 20"
              aria-hidden="true"
              style={{ transform: `rotate(${-heading}deg)` }}
            >
              <polygon
                points="10,1 13,10 10,8 7,10"
                className="fill-compass-north"
              />
              <polygon
                points="10,19 7,10 10,12 13,10"
                className="fill-neutral-300"
              />
            </svg>
          </Button>
          <span className="hidden text-center text-xs font-medium md:block">
            {t('mapNav.alighToNorth')}
          </span>
        </div>

        <hr className="hidden border-neutral-200 md:block" />

        {/* Pan */}
        <div className="hidden flex-col items-center gap-1 px-1 pt-2 pb-2 md:flex">
          <div
            className="grid"
            style={{
              gridTemplateColumns: 'repeat(2, 1.5rem)',
              gridTemplateRows: 'repeat(2, 1.5rem)',
            }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="rounded-floating-control col-start-2 row-start-1 h-8 w-8"
              disabled={disabled}
              onClick={() => requestCamera({ type: 'pan', direction: 'up' })}
              aria-label={t('mapNav.ariaLabelPanUp')}
            >
              <ChevronUp aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-floating-control col-start-1 row-start-2 h-8 w-8"
              disabled={disabled}
              onClick={() => requestCamera({ type: 'pan', direction: 'left' })}
              aria-label={t('mapNav.ariaLabelPanLeft')}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-floating-control col-start-3 row-start-2 h-8 w-8"
              disabled={disabled}
              onClick={() => requestCamera({ type: 'pan', direction: 'right' })}
              aria-label={t('mapNav.ariaLabelPanRight')}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-floating-control col-start-2 row-start-3 h-8 w-8"
              disabled={disabled}
              onClick={() => requestCamera({ type: 'pan', direction: 'down' })}
              aria-label={t('mapNav.ariaLabelPanDown')}
            >
              <ChevronDown aria-hidden="true" />
            </Button>
          </div>
          <span className="text-xs font-medium">{t('mapNav.navigation')}</span>
        </div>

        <hr className="border-neutral-200" />

        {/* Zoom */}
        <div className="flex flex-col items-center gap-1 md:px-3 md:pt-2 md:pb-3">
          <div className="flex flex-col">
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={() => requestCamera({ type: 'zoom', direction: 'in' })}
              aria-label={t('mapNav.ariaLabelZoomIn')}
            >
              <Plus aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={() => requestCamera({ type: 'zoom', direction: 'out' })}
              aria-label={t('mapNav.ariaLabelZoomOut')}
            >
              <Minus aria-hidden="true" />
            </Button>
          </div>
          <span className="hidden text-xs font-medium md:block">
            {t('mapNav.zoom')}
          </span>
        </div>
      </div>
    </nav>
  );
}
