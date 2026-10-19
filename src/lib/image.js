/**
 * Center-crop an image file to a small square JPEG data URL (~5KB), small enough
 * to live inside an event and sync through the GitHub files.
 * @param {File} file
 */
export async function resizeToDataUrl(file, size = 128) {
  const bmp = await createImageBitmap(file)
  const side = Math.min(bmp.width, bmp.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const g = canvas.getContext('2d')
  g.fillStyle = '#fff' // JPEG has no alpha
  g.fillRect(0, 0, size, size)
  g.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, size, size)
  bmp.close?.()
  return canvas.toDataURL('image/jpeg', 0.8)
}
