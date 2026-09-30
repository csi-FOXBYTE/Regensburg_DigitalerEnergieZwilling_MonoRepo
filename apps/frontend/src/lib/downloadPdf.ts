import { pdf } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import type { JSXElementConstructor, ReactElement } from 'react';

export async function downloadPdf(component: ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>, fileName: string): Promise<void> {
  const blob = await pdf(component).toBlob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
