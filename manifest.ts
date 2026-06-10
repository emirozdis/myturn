import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MyTurn',
    short_name: 'MyTurn',
    description: 'Never miss your turn to vlog with your group.',
    start_url: '/',
    display: 'standalone',
    orientation: 'any', // Unlocked at the manifest level, controlled per-route via CSS/JS
    background_color: '#080808',
    theme_color: '#080808',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}