export interface PhotoItem {
  id: string;
  file: File;
  previewUrl: string;
  rotation: number; // 0 | 90 | 180 | 270
}

export async function applyRotation(file: File, rotation: number): Promise<File> {
  if (rotation === 0) return file;
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const rad = (rotation * Math.PI) / 180;
      if (rotation === 90 || rotation === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("toBlob failed")); return; }
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.92,
      );
    };
    img.onerror = () => reject(new Error("Image load error"));
    img.src = url;
  });
}
