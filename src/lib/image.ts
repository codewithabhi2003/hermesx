/**
 * Client-side image resize/compression for avatar uploads.
 *
 * Profile photos are stored as base64 data URLs directly in the database
 * (see prisma/schema.prisma User.avatarUrl and its comment) — there is no
 * cloud storage configured for this project. Resizing down to a small
 * square JPEG here, before it ever reaches the network, keeps the
 * resulting data URL small regardless of how large the source photo was.
 */

const MAX_DIMENSION = 256;
const JPEG_QUALITY = 0.85;

export function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Could not read the selected file.'));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error('The selected file is not a valid image.'));

      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not process the image.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
