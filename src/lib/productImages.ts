const productImageModules = import.meta.glob('../assets/products/*.{png,jpg,jpeg,webp,svg,gif}', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const imagesByFileName = new Map(
  Object.entries(productImageModules).map(([path, url]) => [path.split('/').pop() as string, url]),
)

/**
 * Resolves a product's `photoUrl` field to something an <img> can render.
 * Accepts a data: URL / http(s) URL as-is (uploaded-photo flow), or a bare
 * filename that must exist in src/assets/products/ (JSON import flow).
 */
export function resolveProductPhoto(photoUrl: string | undefined): string | undefined {
  if (!photoUrl) return undefined
  if (photoUrl.startsWith('data:') || /^https?:\/\//.test(photoUrl)) return photoUrl
  return imagesByFileName.get(photoUrl)
}
