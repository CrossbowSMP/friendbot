const bedrock = require('bedrock-protocol')
const { Authflow, Titles } = require('prismarine-auth')

const TARGET_SERVER_IP = '162.120.4.88'
const TARGET_SERVER_PORT = 9010
const BOT_EMAIL = 'CSMPREDIRECT@outlook.com'
const AUTH_CACHE = '/tmp/auth-cache'

async function startBot() {
  console.log('[Bot] Connecting to server...')
  const client = bedrock.createClient({
    host: TARGET_SERVER_IP,
    port: TARGET_SERVER_PORT,
    username: BOT_EMAIL,
    profilesFolder: AUTH_CACHE,
    flow: 'live',
    authTitle: Titles.MinecraftNintendoSwitch,
    deviceType: 'Nintendo',
    version: '1.21.60'
  })

  client.on('connect', () => console.log('[Bot] TCP connected'))
  client.on('login', () => console.log('[Bot] Logged in, waiting for spawn...'))
  client.on('join', () => console.log('[Bot] Joined world'))
  client.on('spawn', () => console.log('[Bot] Connected and visible to friends!'))
  client.on('disconnect', (reason) => {
    console.log('[Bot] Disconnected:', JSON.stringify(reason))
    setTimeout(startBot, 5000)
  })
  client.on('error', (err) => {
    console.error('[Bot] Error:', err.message)
    setTimeout(startBot, 5000)
  })
}

async function autoAcceptFriends() {
  const auth = new Authflow(BOT_EMAIL, AUTH_CACHE, {
    flow: 'live',
    authTitle: Titles.MinecraftNintendoSwitch,
    deviceType: 'Nintendo'
  })
  try {
    const xboxToken = await auth.getXboxToken('http://xboxlive.com')
    const xblAuth = `XBL3.0 x=${xboxToken.userHash};${xboxToken.XSTSToken}`
    const res = await fetch('https://peoplehub.xboxlive.com/users/me/people/followers', {
      headers: {
        Authorization: xblAuth,
        'x-xbl-contract-version': '5',
        'Accept-Language': 'en-US',
        'Accept': 'application/json'
      }
    })
    const data = await res.json()
    console.log('[Bot] Raw people data:', JSON.stringify(data).slice(0, 300))
    const followers = data?.people ?? []
    if (followers.length === 0) { console.log('[Bot] No pending requests.'); return }
    for (const person of followers) {
      const xuid = person?.xuid
      if (!xuid || !/^\d+$/.test(xuid)) continue
      if (person.isFollowedByCaller) continue
      const addRes = await fetch(`https://social.xboxlive.com/users/me/people/xuid(${xuid})`, {
        method: 'PUT',
        headers: { Authorization: xblAuth, 'x-xbl-contract-version': '2', 'Content-Length': '0' }
      })
      if (addRes.ok || addRes.status === 204) {
        console.log(`[Bot] Auto-friended: ${person.displayName} (${xuid})`)
      }
    }
  } catch (err) {
    console.error('[Bot] Error:', err.message)
  }
}

async function main() {
  console.log('[Bot] Authenticating...')
  const auth = new Authflow(BOT_EMAIL, AUTH_CACHE, {
    flow: 'live',
    authTitle: Titles.MinecraftNintendoSwitch,
    deviceType: 'Nintendo'
  })
  await auth.getXboxToken('http://xboxlive.com')
  console.log('[Bot] Auth complete, starting...')

  startBot()
  autoAcceptFriends()
  setInterval(autoAcceptFriends, 30_000)
}

main()
