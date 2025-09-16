export type SupportedPlatform = 'youtube' | 'instagram' | 'tiktok'

export function detectPlatform(url: string): SupportedPlatform | null {
  try {
    const u = new URL(url)
    const h = u.hostname.replace('www.', '')
    if (h.includes('youtube.com') || h.includes('youtu.be')) return 'youtube'
    if (h.includes('instagram.com')) return 'instagram'
    if (h.includes('tiktok.com')) return 'tiktok'
    return null
  } catch {
    return null
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
