export const BOOK_TITLE = 'An Afterlife for Atheists';
export const RATING_QUESTION = 'How convincing did you find this chapter’s case for the existence of an afterlife?';
export interface Chapter { id: number; title: string }
export interface Rating { score: number; version: number }
export interface Results { count: number; average: number | null; distribution: number[] }
export interface Comment {
  id: string; chapter_id: number; author: string | null; body: string;
  created_at: string; updated_at: string; version: number; owned: boolean;
}
export class Problem extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function integer(value: unknown, min: number, max: number, message: string): number {
  if (typeof value === 'string' && /^\d+$/.test(value)) value = Number(value);
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) throw new Problem(400, message);
  return value;
}
export function text(value: unknown, max: number, required = true): string {
  if (typeof value !== 'string') throw new Problem(400, 'Please enter text.');
  const result = value.trim();
  if ((required && !result) || [...result].length > max) throw new Problem(400, `Enter ${required ? '1–' : 'no more than '}${max} characters.`);
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(result)) throw new Problem(400, 'Please remove control characters from your text.');
  return result;
}
export function requestId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(value)) throw new Problem(400, 'This form has expired. Reload the page and try again.');
  return value;
}
export function csvCell(value: unknown): string {
  let result = value == null ? '' : String(value);
  if (/^[\s\u0000-\u001f]*[=+\-@]/u.test(result) || /^[\t\r\n]/u.test(result)) result = "'" + result;
  return '"' + result.replaceAll('"', '""') + '"';
}
export function escapeHTML(value: string): string {
  return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
}
