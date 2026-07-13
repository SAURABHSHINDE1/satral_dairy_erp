import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-secondary-100 text-secondary-700',
    pending_lab: 'bg-warning-100 text-warning-700',
    pending_admin: 'bg-primary-100 text-primary-700',
    approved: 'bg-success-100 text-success-700',
    rejected: 'bg-danger-100 text-danger-700',
  };
  return colors[status] || 'bg-secondary-100 text-secondary-700';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Draft',
    pending_lab: 'Pending Lab',
    pending_admin: 'Pending Admin',
    approved: 'Approved',
    rejected: 'Rejected',
  };
  return labels[status] || status;
}

export function downloadReportAsExcel({
  title,
  metadata,
  headers,
  rows,
  signatures
}: {
  title: string;
  metadata: { label: string; value: string }[];
  headers: string[];
  rows: any[][];
  signatures: { chemist: string; reviewer: string; reviewerTitle?: string };
}) {
  const metaHtml = metadata
    .map(m => `<tr><td style="font-weight:bold; font-size:11px; padding: 2px;">${m.label}:</td><td style="font-size:11px; padding: 2px;">${m.value}</td></tr>`)
    .join('');

  const headersHtml = headers
    .map(h => `<th style="border: 1px solid #000000; background-color: #f2f2f2; font-weight: bold; font-size: 11px; padding: 6px 10px; text-align: center;">${h}</th>`)
    .join('');

  const rowsHtml = rows
    .map(r => {
      const cells = r
        .map(cell => `<td style="border: 1px solid #000000; font-size: 11px; padding: 6px 10px; text-align: center;">${cell ?? '—'}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const chemistName = signatures.chemist || '—';
  const reviewerName = signatures.reviewer || '—';
  const reviewerTitle = signatures.reviewerTitle || 'Quality Incharge';

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; }
      </style>
    </head>
    <body>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td colspan="${headers.length}" style="text-align: center; font-size: 16px; font-weight: bold; padding: 12px; border: 1px solid #000000; background-color: #e2e8f0; text-transform: uppercase;">
            ${title}
          </td>
        </tr>
      </table>

      <table style="border-collapse: collapse; margin-bottom: 15px;">
        ${metaHtml}
      </table>

      <table style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>${headersHtml}</tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <table style="width: 100%; border-collapse: collapse; margin-top: 40px;">
        <tr>
          <td colspan="2" style="width: 40%; text-align: center; font-size: 11px;">
            <div style="border-bottom: 1px solid #000000; font-weight: bold; padding-bottom: 5px;">${chemistName}</div>
            <div style="margin-top: 5px;">Chemist</div>
          </td>
          <td colspan="${headers.length - 4}">&nbsp;</td>
          <td colspan="2" style="width: 40%; text-align: center; font-size: 11px;">
            <div style="border-bottom: 1px solid #000000; font-weight: bold; padding-bottom: 5px;">${reviewerName}</div>
            <div style="margin-top: 5px;">${reviewerTitle}</div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_report.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

