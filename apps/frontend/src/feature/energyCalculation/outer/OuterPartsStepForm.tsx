import { FieldGroup } from '@/components/ui/field';
import { TooltipProvider } from '@/components/ui/tooltip';
import BottomFloorPaper from './BottomFloorPaper';
import OuterWallPaper from './OuterWallPaper';
import RoofPaper from './RoofPaper';
import RoofWindowsPaper from './RoofWindowsPaper';
import TopFloorPaper from './TopFloorPaper';
import WindowsPaper from './WindowsPaper';

export default function OuterPartsStepForm() {
  return (
    <TooltipProvider>
      <FieldGroup>
        <RoofPaper />
        <RoofWindowsPaper />
        <TopFloorPaper />
        <OuterWallPaper />
        <WindowsPaper />
        <BottomFloorPaper />
      </FieldGroup>
    </TooltipProvider>
  );
}
