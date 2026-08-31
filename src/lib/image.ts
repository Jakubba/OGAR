const MAX_DIMENSION = 480
const JPEG_QUALITY = 0.7
export const MAX_PHOTO_DATA_URL_BYTES = 700_000

async function loadImage(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Nie udało się odczytać obrazu.'))
      img.src = objectUrl
    })
    return img
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export async function resizeImageToDataUrl(file: File): Promise<string> {
  const img = await loadImage(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
  const width = Math.round(img.width * scale)
  const height = Math.round(img.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Przeglądarka nie wspiera przetwarzania obrazów.')
  ctx.drawImage(img, 0, 0, width, height)

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  if (dataUrl.length > MAX_PHOTO_DATA_URL_BYTES) {
    throw new Error('Zdjęcie jest zbyt duże nawet po kompresji — wybierz inne lub prostsze zdjęcie.')
  }
  return dataUrl
}
