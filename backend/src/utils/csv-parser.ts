import { parse } from 'csv-parse/sync';

export function parseCsv<T extends Record<string, string>>(buffer: Buffer): T[] {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });
  return records as T[];
}
