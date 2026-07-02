import { promises as fs } from 'fs';
import path from 'path';
import { SHARED_FILES } from './registry';
import type { OrbFile, OrbMeta } from './registry';
import type { FileWithCode } from './prompt';

const readFile = async (file: OrbFile): Promise<FileWithCode> => ({
  ...file,
  code: await fs.readFile(path.join(process.cwd(), file.path), 'utf8'),
});

export const readFiles = (files: OrbFile[]): Promise<FileWithCode[]> =>
  Promise.all(files.map(readFile));

export const readSharedFiles = (): Promise<FileWithCode[]> => readFiles(SHARED_FILES);

export const readOrbFiles = (orb: OrbMeta): Promise<FileWithCode[]> => readFiles(orb.files);
