import { pdfTheme } from '@/config/pdfTheme';
import { Path, Svg } from '@react-pdf/renderer';

type IconName = 'arrow-up' | 'arrow-down' | 'arrow-right';

// Path data sourced from lucide-react __iconNode exports (viewBox 0 0 24 24)
const ICONS: Record<IconName, string[]> = {
  'arrow-up': ['m5 12 7-7 7 7', 'M12 19V5'],
  'arrow-down': ['M12 5v14', 'm19 12-7 7-7-7'],
  'arrow-right': ['M5 12h14', 'm12 5 7 7-7 7'],
};

type Props = {
  name: IconName;
  size?: number;
  color?: string;
};

export function PdfIcon({
  name,
  size = 10,
  color = pdfTheme.colors.onSolid,
}: Props) {
  const paths = ICONS[name];
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      {paths.map((d, i) => (
        <Path
          key={i}
          d={d}
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ))}
    </Svg>
  );
}
