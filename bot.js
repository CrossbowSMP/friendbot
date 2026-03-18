const bedrock = require('bedrock-protocol')
const { Authflow, Titles } = require('prismarine-auth')

const TARGET_SERVER_IP = '162.120.4.88'
const TARGET_SERVER_PORT = 9010
const BOT_EMAIL = 'CSMPREDIRECT@outlook.com'

async function startBot() {
  console.log('[Bot] Connecting to server...')
  const client = bedrock.createClient({
    host: TARGET_SERVER_IP,
    port: TARGET_SERVER_PORT,
    username: BOT_EMAIL,
    profilesFolder: '/tmp/auth-cache',
    authTitle: Titles.MinecraftNintendoSwitch,
    deviceType: 'Nintendo'
  })

  client.on('spawn', () => console.log('[Bot] Connected and visible to friends!'))
  client.on('disconnect', (reason) => {
    console.log('[Bot] Disconnected:', reason)
    setTimeout(startBot, 5000)
  })
  client.on('error', (err) => {
    console.error('[Bot] Error:', err.message)
    setTimeout(startBot, 5000)
  })
}

async function autoAcceptFriends() {
  const auth = new Authflow(BOT_EMAIL, '/tmp/auth-cache', {
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
    const followers = data?.people ?? []
    if (followers.length === 0) { console.log('[Bot] No pending requests.'); return }
    for (const person of followers) {
      const xuid = person?.xuid
      if (!xuid || !/^\d+$/.test(xuid)) continue
      if (person.isFollowedByCaller) continue // already friends, skip
      const addRes = await fetch(`https://social.xboxlive.com/users/me/people/xuid(${xuid})`, {
        method: 'PUT',
        headers: { Authorization: xblAuth, 'x-xbl-contract-version': '2', 'Content-Length': '0' }
      })
      if (addRes.ok || addRes.status === 204) console.log(`[Bot] Auto-friended: ${person.displayName}`)
    }
  } catch (err) {
    console.error('[Bot] Error:', err.message)
  }
}

startBot()
autoAcceptFriends()
setInterval(autoAcceptFriends, 30_000)
