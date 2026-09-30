import { Callout } from '@/components/ui/callout';
import { Typography } from '@/components/ui/typography';
import type { ComponentPropsWithoutRef } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

const DATA_SOURCE_CATALOG_URL =
  'https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_Backend/blob/main/docs/architecture/16-data-sources-dcat-piveau.md';

type PrivacyLinkProps = ComponentPropsWithoutRef<'a'> & { node?: unknown };

function PrivacyLink({ href = '', node: _node, ...props }: PrivacyLinkProps) {
  const resolvedHref = href.startsWith('../architecture/')
    ? DATA_SOURCE_CATALOG_URL
    : href;
  const isExternal = /^https?:\/\//.test(resolvedHref);

  return (
    <a
      {...props}
      href={resolvedHref}
      className="text-primary hover:text-primary-hover break-words underline transition-colors"
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
    />
  );
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <Typography as="h1" variant="h1">
      {children}
    </Typography>
  ),
  h2: ({ children }) => (
    <Typography as="h2" variant="h3" className="pt-4">
      {children}
    </Typography>
  ),
  h3: ({ children }) => (
    <Typography as="h3" variant="h4" className="pt-2">
      {children}
    </Typography>
  ),
  p: ({ children }) => <Typography>{children}</Typography>,
  ul: ({ children }) => (
    <Typography as="ul" className="list-disc space-y-1 pl-5">
      {children}
    </Typography>
  ),
  ol: ({ children }) => (
    <Typography as="ol" className="list-decimal space-y-1 pl-5">
      {children}
    </Typography>
  ),
  a: PrivacyLink,
  blockquote: ({ children }) => (
    <blockquote>
      <Callout variant="warning" size="large">
        <div className="flex flex-col gap-2">{children}</div>
      </Callout>
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-190 table-fixed border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-neutral-450 border-b-2">{children}</thead>
  ),
  tr: ({ children }) => (
    <tr className="border-b border-neutral-200">{children}</tr>
  ),
  th: ({ children }) => (
    <th
      scope="col"
      className="px-2 py-2 align-top font-bold last:[overflow-wrap:anywhere]"
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-2 py-2 align-top last:[overflow-wrap:anywhere]">
      {children}
    </td>
  ),
  code: ({ children }) => (
    <code className="bg-muted rounded px-1 py-0.5 font-mono text-[0.9em] break-words">
      {children}
    </code>
  ),
};

interface Props {
  content: string;
}

export function PrivacyPageContent({ content }: Props) {
  return (
    <article className="flex flex-col gap-6">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
