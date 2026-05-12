import { ASSET_CATEGORIES } from '../../constants/categories';

export function formatEUR(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getGreeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 6) return 'Bonsoir';
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export function formatFullDate(date: Date = new Date()): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  });
}

export function getCountdown(
  dueDateIso: string,
  now: Date = new Date(),
): { text: string; isOverdue: boolean } {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateIso);
  due.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { text: `En retard de ${Math.abs(days)} j`, isOverdue: true };
  if (days === 0) return { text: "Aujourd'hui", isOverdue: false };
  if (days === 1) return { text: 'Demain', isOverdue: false };
  return { text: `Dans ${days} jours`, isOverdue: false };
}

export function getCategoryLabel(id: string): string {
  return ASSET_CATEGORIES.find((c) => c.id === id)?.label ?? 'Autre';
}

export function formatLongDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
