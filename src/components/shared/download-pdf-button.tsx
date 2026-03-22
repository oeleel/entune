'use client';

import { useState, type ReactElement } from 'react';
import { Button } from '@/components/ui/button';

interface DownloadPdfButtonProps {
  document: ReactElement;
  fileName: string;
  label?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function DownloadPdfButton({
  document,
  fileName,
  label = 'Download PDF',
  variant = 'outline',
  size = 'sm',
  className,
}: DownloadPdfButtonProps) {
  const [generating, setGenerating] = useState(false);

  async function handleDownload() {
    setGenerating(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdf(document as any).toBlob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = fileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={generating}
      className={className}
    >
      {generating ? 'Generating...' : label}
    </Button>
  );
}
