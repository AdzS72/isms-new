export * from './types';
export * from './format';
export * from './eyd';
export * from './group';
export * from './docx-common';
export { buatBhi, buatBhiDoc, barisBhi, buatBhiNumberMap } from './bhi';
export { buatLk, buatLkDoc } from './lk';

/**
 * Triggers a browser download of the given Blob file
 */
export function unduhBlob(blob: Blob, namaFile: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = namaFile;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
