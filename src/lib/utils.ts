import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Os eventos guardam a data com o fuso de Brasília explícito (ex.: -03:00).
 * `new Date(...)` converteria esse instante para o fuso de quem está lendo
 * (ou do servidor no build), mostrando "11:00" para um evento das "08:00".
 * Aqui devolvemos a hora exatamente como foi escrita no markdown.
 */
export function parseEventDate(date: string): Date {
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!match) return new Date(date);

  const [, year, month, day, hours = "0", minutes = "0"] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes)
  );
}
