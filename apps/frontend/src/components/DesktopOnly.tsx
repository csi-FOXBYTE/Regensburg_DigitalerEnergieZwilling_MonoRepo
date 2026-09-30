import type { ReactNode } from 'react';

export type DesktopOnlyProps = {
  children: ReactNode;
};

export default function DesktopOnly({ children }: DesktopOnlyProps) {
  return <div className="hidden md:block">{children}</div>;
}
