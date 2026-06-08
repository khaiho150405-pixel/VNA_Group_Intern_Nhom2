import * as fs from 'fs';
import * as path from 'path';

export const readSqlFile = (filepath: string): string[] => {
  return fs
    .readFileSync(filepath)
    .toString()
    .replace(/\r?\n|\r/g, '')
    .split(';')
    .filter((query) => query?.length);
};

export namespace FileUtils {
  export const randomString = (length: number) => {
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
    let randomStr = '';
    for (let index = 0; index < length; index++) {
      randomStr += alphabet[Math.round(Math.random() * 36)];
    }
    return randomStr;
  };

  export const getFileInfo = (file: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
  }): {
    filename: string;
    originalname: string;
    mimeType: string;
    ext: string;
  } => {
    const fileName = path.basename(
      file.originalname,
      `${path.extname(file.originalname)}`,
    );

    const ext = file.mimetype.split('/')[1];

    return {
      filename: fileName.replace(/\s+/g, '+'),
      originalname: file.originalname,
      mimeType: file.mimetype,
      ext: ext,
    };
  };
}
