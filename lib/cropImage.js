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
 * and returns the result as a JPEG blob.
 */
export async function getCroppedImg(imageSrc, croppedAreaPixels, rotation = 0) {
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

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = croppedAreaPixels.width;
  cropCanvas.height = croppedAreaPixels.height;
  cropCanvas.getContext('2d').drawImage(
    rotateCanvas,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height
  );

  return new Promise((resolve) => {
    cropCanvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
  });
}
