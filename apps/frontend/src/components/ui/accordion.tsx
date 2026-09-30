import { Accordion as AccordionPrimitive } from 'radix-ui';
import * as React from 'react';

import { Paper } from '@/components/ui/paper';
import { typographyVariants } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

function Accordion({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn('flex w-full flex-col gap-3', className)}
      {...props}
    />
  );
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <Paper asChild variant="outlined" elevation={0}>
      <AccordionPrimitive.Item
        data-slot="accordion-item"
        className={cn('overflow-hidden', className)}
        {...props}
      />
    </Paper>
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          // layout
          'group/accordion-trigger relative flex flex-1 items-start justify-between px-4 py-3 text-left',
          // typography
          typographyVariants({ variant: 'h5' }),
          // misc
          'transition-all outline-none',
          // hover
          'hover:underline',
          // focus
          'focus-visible:ring-ring/50 focus-visible:ring-3',
          // disabled
          'disabled:pointer-events-none disabled:opacity-50',
          // icon
          '**:data-[slot=accordion-trigger-icon]:text-muted-foreground **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4',
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon
          data-slot="accordion-trigger-icon"
          className="pointer-events-none shrink-0 self-center group-aria-expanded/accordion-trigger:hidden"
        />
        <ChevronUpIcon
          data-slot="accordion-trigger-icon"
          className="pointer-events-none hidden shrink-0 self-center group-aria-expanded/accordion-trigger:inline"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className={cn(
        // layout
        'overflow-hidden',
        // divider
        'data-open:border-t data-open:border-neutral-200',
        // animation
        'data-open:animate-accordion-down data-closed:animate-accordion-up',
      )}
      {...props}
    >
      <div
        className={cn(
          // layout
          'h-(--radix-accordion-content-height) px-4 pt-3 pb-4',
          // typography
          'text-sm',
          // links
          '[&_a]:hover:text-foreground [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4',
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
