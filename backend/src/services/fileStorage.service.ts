import fs from 'fs';
import path from 'path';
import { config } from '../config';

export function getUploadPath(filename: string): string {
  return path.join(config.uploadDir, filename);
}

export function deleteFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function getFileUrl(filePath: string): string {
  const filename = path.basename(filePath);
  return `/uploads/${filename}`;
}
