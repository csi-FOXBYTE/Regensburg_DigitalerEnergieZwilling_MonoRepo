import { useStore } from '@nanostores/react';
import { Info, MapPin, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { useTranslation } from 'react-i18next';
import ArrowIcon from '../../components/ArrowIcon';
import { Button } from '../../components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '../../components/ui/drawer';
import { Paper } from '../../components/ui/paper';
import { Typography } from '../../components/ui/typography';
import {
  $building,
  type BuildingState,
  unselectBuilding,
} from '../../lib/state/building';
import { getSession } from '../../lib/state/session/storage';
import { loadSession, startOverSession } from '../../lib/state/session';
import { $step, navigateToStep, Step } from '../../lib/state/ui/progress';
import useIsMobile from '../../lib/useIsMobile';
import { cn } from '../../lib/utils';
import CurrentStats from '../energyCalculation/CurrentStats';
import RenovationPotential from './RenovationPotential';
import StartOverConfirmDialog from './StartOverConfirmDialog';

function BuildingWindowContent({
  building,
  onContinue,
}: {
  building: BuildingState;
  onContinue: () => void;
}) {
  const { t } = useTranslation('map');
  const [confirmOpen, setConfirmOpen] = useState(false);
  useStore($step);
  const session = getSession(building.id);
  const showStats = session != null && session.step > Step.GeneralData;

  const handleStartOver = () => {
    startOverSession(building.id);
  };

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto border-b border-neutral-200 px-6 py-3">
        <div className="flex items-center gap-1 pt-1 pb-4">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          <Typography variant="body">
            {[
              building.properties.address?.street,
              building.properties.address
                ? [
                    building.properties.address.postcode,
                    building.properties.address.city,
                  ]
                    .filter(Boolean)
                    .join(' ')
                : undefined,
            ]
              .filter(Boolean)
              .join(', ')}
          </Typography>
        </div>
        {showStats ? (
          <CurrentStats embedded />
        ) : (
          <RenovationPotential
            constructionYear={
              building.properties.digitalEnergyTwin.constructionYear
            }
          />
        )}
      </div>
      <div className="shrink-0 px-6 py-3 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.08)]">
        {session ? (
          <>
            <Button
              onClick={() => loadSession(building.id)}
              className="flex w-full items-center gap-2"
            >
              {t('buildingWindow.sessionContinueButton')}
              <ArrowIcon />
            </Button>
            <Button
              variant="secondary"
              onClick={() => setConfirmOpen(true)}
              className="mt-2 flex w-full items-center gap-2"
            >
              {t('buildingWindow.startOverButton')}
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={onContinue}
              className="flex w-full items-center gap-2"
            >
              {t('buildingWindow.continueButton')}
              <ArrowIcon />
            </Button>
            <div className="mt-2 flex items-center gap-1">
              <Info
                className="text-muted-foreground size-3 shrink-0"
                aria-hidden="true"
              />
              <Typography variant="small">
                {t('buildingWindow.processingTime')}
              </Typography>
            </div>
          </>
        )}
      </div>
      <StartOverConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleStartOver}
      />
    </>
  );
}

export default function BuildingWindow() {
  const nodeRef = useRef<HTMLDivElement>(null);
  const selectedBuilding = useStore($building);
  const isMobile = useIsMobile();
  const { t } = useTranslation('map');
  const [snap, setSnap] = useState<number | string | null>(0.4);
  const snapPoints = [0.25, 0.4, 1];
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragBounds, setDragBounds] = useState<
    { left: number; top: number; right: number; bottom: number } | undefined
  >(undefined);

  const gotoGeneralDataStep = useCallback(() => {
    navigateToStep(Step.GeneralData);
  }, []);

  const isOpen = !!selectedBuilding;

  const recalculate = useCallback(() => {
    const node = nodeRef.current;
    if (!node?.parentElement || !node.offsetHeight) return;
    const parent = node.parentElement;
    const newBounds = {
      left: -node.offsetLeft,
      top: -node.offsetTop,
      right: parent.clientWidth - node.offsetWidth - node.offsetLeft,
      bottom: parent.clientHeight - node.offsetHeight - node.offsetTop,
    };
    setDragBounds(newBounds);
    setPosition((prev) => ({
      x: Math.max(newBounds.left, Math.min(prev.x, newBounds.right)),
      y: Math.max(newBounds.top, Math.min(prev.y, newBounds.bottom)),
    }));
  }, []);

  useEffect(() => {
    window.addEventListener('resize', recalculate);
    return () => window.removeEventListener('resize', recalculate);
  }, [recalculate]);

  useEffect(() => {
    if (isOpen) recalculate();
  }, [isOpen, recalculate]);

  useEffect(() => {
    if (isOpen) setSnap(0.4);
  }, [isOpen]);

  if (isMobile) {
    return (
      <Drawer
        snapPoints={snapPoints}
        activeSnapPoint={snap}
        setActiveSnapPoint={setSnap}
        fadeFromIndex={snapPoints.length - 1}
        modal={false}
        open={isOpen}
        onOpenChange={(open) => !open && unselectBuilding()}
      >
        <DrawerContent
          overlayClassName="supports-backdrop-filter:backdrop-blur-none"
          className="overflow-hidden data-[vaul-drawer-direction=bottom]:max-h-[96vh]"
        >
          <DrawerHeader className="flex-row items-start justify-between text-left!">
            <div>
              <DrawerTitle>{t('buildingWindow.title')}</DrawerTitle>
              <Typography variant="muted">
                {t('buildingWindow.subtitle')}
              </Typography>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={unselectBuilding}
              className="-mt-1 -mr-2 shrink-0"
              aria-label={t('buildingWindow.closeButton')}
            >
              <X aria-hidden="true" />
            </Button>
          </DrawerHeader>
          {selectedBuilding && (
            <BuildingWindowContent
              key={selectedBuilding.id}
              building={selectedBuilding}
              onContinue={gotoGeneralDataStep}
            />
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Draggable
      nodeRef={nodeRef}
      bounds={dragBounds ?? 'parent'}
      handle=".drag-handle"
      position={position}
      onDrag={(_, data) => setPosition({ x: data.x, y: data.y })}
    >
      <Paper
        ref={nodeRef}
        variant="outlined"
        className={cn(
          'absolute top-4 right-28 z-20 hidden max-h-[calc(100%-2rem)] w-[calc(100vw-7rem-1rem)] max-w-120 min-w-80 flex-col',
          isOpen ? 'flex' : null,
        )}
      >
        <div className="drag-handle flex shrink-0 cursor-move items-start border-b border-neutral-200 px-6 pt-6 pb-3 select-none">
          <div className="grow">
            <Typography as="h2" variant="h2">
              {t('buildingWindow.title')}
            </Typography>
            <Typography variant="muted" className="pt-3">
              {t('buildingWindow.subtitle')}
            </Typography>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={unselectBuilding}
            aria-label={t('buildingWindow.closeButton')}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
        {selectedBuilding && (
          <BuildingWindowContent
            key={selectedBuilding.id}
            building={selectedBuilding}
            onContinue={gotoGeneralDataStep}
          />
        )}
      </Paper>
    </Draggable>
  );
}
