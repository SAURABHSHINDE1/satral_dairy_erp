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
