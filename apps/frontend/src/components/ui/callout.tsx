import { cva, type VariantProps } from 'class-variance-authority';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { Typography } from './typography';

const calloutVariants = cva('flex items-start border-2 text-foreground', {
  variants: {
    variant: {
      info: 'border-info bg-info-background',
      warning: 'border-warning bg-warning-background',
      danger: 'border-danger bg-danger-background',
      positive: 'border-positive bg-positive-background',
    },
    size: {
      small: 'gap-2 p-2.5 text-sm',
      large: 'gap-3 p-4 text-sm',
    },
  },
  defaultVariants: {
    variant: 'info',
    size: 'small',
  },
});

const calloutIconVariants = cva(
  'mt-0.5 flex shrink-0 items-center justify-center',
  {
    variants: {
      variant: {
        info: 'text-info-icon',
        warning: 'text-warning-icon',
        danger: 'text-danger-icon',
        positive: 'text-positive-icon',
      },
      size: {
        small: 'size-4 [&>svg]:size-4',
        large: 'size-6 [&>svg]:size-6',
      },
    },
    defaultVariants: {
      variant: 'info',
      size: 'small',
    },
  },
);

const defaultIcons = {
  info: Info,
  warning: TriangleAlert,
  danger: CircleAlert,
  positive: CircleCheck,
};

type CalloutProps = Omit<React.ComponentProps<'div'>, 'title'> &
  VariantProps<typeof calloutVariants> & {
    title?: React.ReactNode;
    titleId?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
  };

function Callout({
  className,
  variant = 'info',
  size = 'small',
  title,
  titleId,
  icon,
  action,
  children,
  ...props
}: CalloutProps) {
  const resolvedVariant = variant ?? 'info';
  const resolvedSize = size ?? 'small';
  const DefaultIcon = defaultIcons[resolvedVariant];

  return (
    <div
      data-slot="callout"
      className={cn(
        calloutVariants({
          variant: resolvedVariant,
          size: resolvedSize,
          className,
        }),
      )}
      {...props}
    >
      <div
        className={calloutIconVariants({
          variant: resolvedVariant,
          size: resolvedSize,
        })}
      >
        {icon === undefined ? <DefaultIcon aria-hidden="true" /> : icon}
      </div>
      <div className="min-w-0 flex-1">
        {title != null && (
          <Typography
            id={titleId}
            as="div"
            variant={resolvedSize === 'large' ? 'h4' : 'small'}
            className={cn(resolvedSize === 'small' && 'font-bold')}
          >
            {title}
          </Typography>
        )}
        <div className={cn(title != null && 'mt-1')}>{children}</div>
      </div>
      {action != null && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export { Callout, calloutVariants, type CalloutProps };
