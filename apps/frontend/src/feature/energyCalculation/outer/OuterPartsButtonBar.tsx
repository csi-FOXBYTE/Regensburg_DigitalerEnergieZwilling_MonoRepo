import { $canProgressOuterPartsStep } from '@/lib/state/inputs/outer-parts';
import ButtonBar, { type ButtonBarProps } from '../ButtonBar';

export default function OuterPartsButtonBar(props: ButtonBarProps) {
  return <ButtonBar {...props} canProgress={$canProgressOuterPartsStep} />;
}
