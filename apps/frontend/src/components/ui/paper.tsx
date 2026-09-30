import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

const paperVariants = cva('bg-background text-foreground transition-shadow', {
  variants: {
    variant: {
      elevation: 'border-transparent',
      outlined: 'border border-border border-neutral-200',
    },
    elevation: {
      0: 'shadow-none',
      1: 'shadow-paper-1',
      2: 'shadow-paper-2',
      3: 'shadow-paper-3',
      4: 'shadow-paper-4',
      5: 'shadow-paper-5',
    },
    square: {
      true: 'rounded-none',
      false: 'rounded-surface',
    },
  },
  defaultVariants: {
    variant: 'elevation',
    elevation: 1,
    square: false,
  },
});

function Paper({
  className,
  variant,
  elevation,
  square,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof paperVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'div';

  return (
    <Comp
      data-slot="paper"
      className={cn(paperVariants({ variant, elevation, square, className }))}
      {...props}
    />
  );
}

export { Paper, paperVariants };
