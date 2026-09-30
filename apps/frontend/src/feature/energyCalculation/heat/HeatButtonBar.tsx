import { $canProgressHeatStep } from '@/lib/state/inputs/heat';
import ButtonBar, { type ButtonBarProps } from '../ButtonBar';

export default function HeatButtonBar(props: ButtonBarProps) {
  return <ButtonBar {...props} canProgress={$canProgressHeatStep} />;
}
