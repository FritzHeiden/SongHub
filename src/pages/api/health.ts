import type { NextApiRequest, NextApiResponse } from 'next'
import { getPuppeteerStats } from '../../lib/api/request'
import { getTabApiStats } from './tab'
import { ensureUser } from '../../lib/users'
import { migrateLegacySongs } from '../../lib/songs'

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const hasUser = Boolean(process.env.SONGHUB_LOGIN_USERNAME)
  const hasPassword = Boolean(process.env.SONGHUB_LOGIN_PASSWORD)

  const loginUsername = (process.env.SONGHUB_LOGIN_USERNAME || '').trim()
  if (loginUsername) {
    const seedUser = await ensureUser(loginUsername, 'user')
    await migrateLegacySongs(seedUser.id)
  }

  res.status(200).json({
    status: 'ok',
    service: 'songhub',
    uptimeSec: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    authConfigured: hasUser && hasPassword,
    performance: {
      tabApi: getTabApiStats(),
      puppeteer: getPuppeteerStats(),
    },
  })
}
