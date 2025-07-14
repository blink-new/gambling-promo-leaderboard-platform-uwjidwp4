import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: 'gambling-promo-leaderboard-platform-uwjidwp4',
  authRequired: false // Allow public browsing, no forced redirect
})
