function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function rotatedSize(width, height, rotation) {
  const rad = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
}

/**
 * Applies a react-easy-crop pixel crop area (plus rotation) to the source image
 * and returns the result as a JPEG blob. When zoomed out past the point where
 * the image fully covers the crop area, the uncovered border is filled with
 * backgroundColor instead of being left black/transparent.
 */
export async function getCroppedImg(imageSrc, croppedAreaPixels, rotation = 0, backgroundColor = '#FDF6EC') {
  const image = await loadImage(imageSrc);
  const rad = (rotation * Math.PI) / 180;
  const { width: rotWidth, height: rotHeight } = rotatedSize(image.width, image.height, rotation);

  const rotateCanvas = document.createElement('canvas');
  rotateCanvas.width = rotWidth;
  rotateCanvas.height = rotHeight;
  const rotateCtx = rotateCanvas.getContext('2d');
  rotateCtx.translate(rotWidth / 2, rotHeight / 2);
  rotateCtx.rotate(rad);
  rotateCtx.translate(-image.width / 2, -image.height / 2);
  rotateCtx.drawImage(image, 0, 0);

  const { x, y, width, height } = croppedAreaPixels;

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = width;
  cropCanvas.height = height;
  const cropCtx = cropCanvas.getContext('2d');

  cropCtx.fillStyle = backgroundColor;
  cropCtx.fillRect(0, 0, width, height);

  // Only draw the portion of the crop rectangle that actually overlaps the
  // image; the rest stays as the background fill above.
  const srcX = Math.max(0, x);
  const srcY = Math.max(0, y);
  const srcW = Math.min(rotWidth, x + width) - srcX;
  const srcH = Math.min(rotHeight, y + height) - srcY;

  if (srcW > 0 && srcH > 0) {
    cropCtx.drawImage(rotateCanvas, srcX, srcY, srcW, srcH, srcX - x, srcY - y, srcW, srcH);
  }

  return new Promise((resolve) => {
    cropCanvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
  });
}
