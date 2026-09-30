import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const typographyVariants = cva('text-foreground', {
  variants: {
    variant: {
      h1: 'text-(length:--text-h1) leading-(--leading-h1) font-bold',
      h2: 'text-(length:--text-h2) leading-(--leading-h2) font-bold',
      h3: 'text-(length:--text-h3) leading-(--leading-h3) font-normal',
      h4: 'text-(length:--text-h4) leading-(--leading-h4) font-bold',
      h5: 'text-(length:--text-h4) leading-(--leading-h4) font-normal',
      lead: 'text-(length:--text-lead) leading-(--leading-lead) font-normal',
      body: 'text-(length:--text-body) leading-(--leading-body) font-normal',
      small:
        'text-(length:--text-body-sm) leading-(--leading-body-sm) font-normal',
      muted:
        'text-(length:--text-body-sm) leading-(--leading-body-sm) font-normal text-neutral-450',
      verySmall:
        'text-(length:--text-body-xs) leading-(--leading-body-xs) font-normal text-neutral-450',
    },
  },
  defaultVariants: {
    variant: 'body',
  },
});

type TypographyProps<T extends React.ElementType> = {
  as?: T;
  className?: string;
} & VariantProps<typeof typographyVariants> &
  Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className'>;

function Typography<T extends React.ElementType = 'p'>({
  as,
  variant,
  className,
  ...props
}: TypographyProps<T>) {
  const Comp = as || 'p';

  return (
    <Comp
      className={cn(typographyVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Typography, typographyVariants };
