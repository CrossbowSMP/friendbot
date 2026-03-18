const bedrock = require('bedrock-protocol')
const { Authflow, Titles } = require('prismarine-auth')

// ✅ CONFIG — change these
const TARGET_SERVER_IP = '162.120.4.88'
const TARGET_SERVER_PORT = 9010
const BOT_PORT = 19132
const BOT_EMAIL = 'CSMPREDIRECT@outlook.com' // ← your bot's Microsoft email

const server = bedrock.createServer({
  host: '0.0.0.0',
  port: BOT_PORT,
  version: '1.21.0',
  offline: false,
  motd: {
    motd: 'Connecting you...',
    levelName: 'Join to connect!'
  }
})

console.log(`[Bot] Listening on port ${BOT_PORT}`)

server.on('connect', (client) => {
  client.on('join', () => {
    console.log(`[Bot] Player joined, transferring...`)
    client.queue('transfer', {
      server_address: TARGET_SERVER_IP,
      port: TARGET_SERVER_PORT
    })
  })
})

async function autoAcceptFriends() {
  const auth = new Authflow(BOT_EMAIL, './auth-cache', {
    flow: 'live',
    authTitle: Titles.MinecraftNintendoSwitch, // ← this fixes the error!
    deviceType: 'Nintendo'
  })

  try {
    const xboxToken = await auth.getXboxToken('http://xboxlive.com')
    const xblAuth = `XBL3.0 x=${xboxToken.userHash};${xboxToken.XSTSToken}`

    const res = await fetch('https://peoplehub.xboxlive.com/users/me/people/summary', {
      headers: {
        Authorization: xblAuth,
        'x-xbl-contract-version': '5',
        'Accept-Language': 'en-US'
      }
    })

    const data = await res.json()
    const pending = data?.people?.filter(p => p.isFollowingCaller && !p.isFollowedByCaller)

    if (pending?.length) {
      for (const person of pending) {
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
    console.error('[Bot] Auth error:', err.message)
  }
}

autoAcceptFriends()
setInterval(autoAcceptFriends, 30_000)
