import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // layout & sizing
        'rounded-control field-sizing-content min-h-24 w-full min-w-0 px-3 py-2',
        // colors & border
        'border-input-border bg-input border',
        // typography
        'text-(length:--text-body) leading-(--leading-body)',
        // misc
        'resize-none transition-colors outline-none',
        // placeholder
        'placeholder:text-muted-foreground',
        // focus
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3',
        // disabled
        'disabled:bg-input/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        // invalid
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-3',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
