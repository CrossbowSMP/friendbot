const bedrock = require('bedrock-protocol')
const { Authflow, Titles } = require('prismarine-auth')
const path = require('path')

// ✅ CONFIG
const TARGET_SERVER_IP = '162.120.4.88'
const TARGET_SERVER_PORT = 9010
const BOT_EMAIL = 'CSMPREDIRECT@outlook.com'

// ✅ FIX 1: Use /tmp for auth cache — survives container restarts better
const AUTH_CACHE_DIR = path.join('/tmp', 'auth-cache')

const server = bedrock.createServer({
  host: '0.0.0.0',
  port: 19132,
  version: '1.21.0',
  offline: false,
  motd: { motd: 'Connecting...', levelName: 'Join me!' }
})

console.log('[Bot] Listening on port 19132')

server.on('connect', (client) => {
  client.on('join', () => {
    console.log('[Bot] Player joined, transferring...')
    client.queue('transfer', {
      server_address: TARGET_SERVER_IP,
      port: TARGET_SERVER_PORT
    })
  })
})

async function autoAcceptFriends() {
  const auth = new Authflow(BOT_EMAIL, AUTH_CACHE_DIR, {
    flow: 'live',
    authTitle: Titles.MinecraftNintendoSwitch,
    deviceType: 'Nintendo'
  })

  try {
    const xboxToken = await auth.getXboxToken('http://xboxlive.com')
    const xblAuth = `XBL3.0 x=${xboxToken.userHash};${xboxToken.XSTSToken}`

    // ✅ FIX 2: Use peoplehub — correct endpoint for followers, returns { people: [...] }
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

    if (followers.length === 0) {
      console.log('[Bot] No pending requests.')
      return
    }

    for (const person of followers) {
      // ✅ FIX 3: Validate xuid before using it — malformed xuids cause 1007 errors
      const xuid = person?.xuid
      if (!xuid || typeof xuid !== 'string' || !/^\d+$/.test(xuid)) {
        console.warn(`[Bot] Skipping malformed xuid for ${person?.displayName}: "${xuid}"`)
        continue
      }

      try {
        const addRes = await fetch(`https://social.xboxlive.com/users/me/people/xuid(${xuid})`, {
          method: 'PUT',
          headers: {
            Authorization: xblAuth,
            'x-xbl-contract-version': '2',
            'Content-Length': '0'
          }
        })
        if (addRes.ok || addRes.status === 204) {
          console.log(`[Bot] Auto-friended: ${person.displayName} (${xuid})`)
        } else {
          const errBody = await addRes.text()
          console.warn(`[Bot] Failed to friend ${person.displayName}: ${addRes.status} ${errBody}`)
        }
      } catch (innerErr) {
        console.error(`[Bot] Error friending ${person.displayName}:`, innerErr.message)
      }
    }

  } catch (err) {
    console.error('[Bot] Error:', err.message)
  }
}

autoAcceptFriends()
setInterval(autoAcceptFriends, 30_000)
