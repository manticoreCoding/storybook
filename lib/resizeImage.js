const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

/**
 * Downscales an image file to at most maxDimension on its longest side and
 * re-encodes it as JPEG, so camera photos don't bloat storage.
 */
export async function resizeImage(file, maxDimension = MAX_DIMENSION, quality = JPEG_QUALITY) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));

  if (scale === 1 && file.type === 'image/jpeg') {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  const name = file.name.replace(/\.\w+$/, '') + '.jpg';
  return new File([blob], name, { type: 'image/jpeg' });
}
