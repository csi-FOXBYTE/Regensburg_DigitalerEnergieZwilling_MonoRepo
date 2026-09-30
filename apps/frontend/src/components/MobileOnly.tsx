import type { ReactNode } from 'react';

export type MobileOnlyProps = {
  children: ReactNode;
};

export default function MobileOnly({ children }: MobileOnlyProps) {
  return <div className="block md:hidden">{children}</div>;
}
