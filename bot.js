const bedrock = require('bedrock-protocol')
const { Authflow, Titles } = require('prismarine-auth')

// ✅ CONFIG
const TARGET_SERVER_IP = '162.120.4.88'
const TARGET_SERVER_PORT = 9010
const BOT_EMAIL = 'CSMPREDIRECT@outlook.com'

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
  const auth = new Authflow(BOT_EMAIL, './auth-cache', {
    flow: 'live',
    authTitle: Titles.MinecraftNintendoSwitch,
    deviceType: 'Nintendo'
  })

  try {
    const xboxToken = await auth.getXboxToken('http://xboxlive.com')
    const xblAuth = `XBL3.0 x=${xboxToken.userHash};${xboxToken.XSTSToken}`

    const res = await fetch('https://social.xboxlive.com/users/me/people/followers', {
      headers: {
        Authorization: xblAuth,
        'x-xbl-contract-version': '2',
        'Accept-Language': 'en-US'
      }
    })

    const data = await res.json()
    console.log('[Bot] Full API response:', JSON.stringify(data).slice(0, 300))

    const followers = data?.people ?? []

    if (followers.length > 0) {
      for (const person of followers) {
        await fetch(`https://social.xboxlive.com/users/me/people/xuid(${person.xuid})`, {
          method: 'PUT',
          headers: {
            Authorization: xblAuth,
            'x-xbl-contract-version': '2'
          }
        })
        console.log(`[Bot] Auto-friended: ${person.displayName}`)
      }
    } else {
      console.log('[Bot] No pending requests.')
    }
  } catch (err) {
    console.error('[Bot] Error:', err.message)
  }
}

autoAcceptFriends()
setInterval(autoAcceptFriends, 30_000)
