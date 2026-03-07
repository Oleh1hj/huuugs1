import { differenceInYears, parseISO } from 'date-fns';

export function calcAge(birth: string): number {
  return differenceInYears(new Date(), parseISO(birth));
}

export function timeStr(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function clsx(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}
