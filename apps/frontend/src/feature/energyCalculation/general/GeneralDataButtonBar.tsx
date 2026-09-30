import { $canProgressGeneralDataStep } from '@/lib/state/inputs/general';
import ButtonBar, { type ButtonBarProps } from '../ButtonBar';

export default function GeneralDataButtonBar(props: ButtonBarProps) {
  return <ButtonBar {...props} canProgress={$canProgressGeneralDataStep} />;
}
