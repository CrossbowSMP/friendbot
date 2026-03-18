const bedrock = require('bedrock-protocol')
const { Authflow } = require('prismarine-auth')

// ✅ CONFIG — change these
const TARGET_SERVER_IP = ''
const TARGET_SERVER_PORT = 
const BOT_PORT = 19132 // port your bot listens on

// Start a fake Bedrock server
const server = bedrock.createServer({
  host: '0.0.0.0',
  port: BOT_PORT,
  version: '1.20.0',
  offline: false, // must be false for Xbox auth
  motd: {
    motd: 'Connecting you...',
    levelName: 'Join to connect!'
  }
})

console.log(`[Bot] Listening on port ${BOT_PORT}`)

// When a player joins → transfer them instantly
server.on('connect', (client) => {
  console.log(`[Bot] ${client.getUserData()?.displayName} joined`)

  client.on('join', () => {
    console.log(`[Bot] Transferring to ${TARGET_SERVER_IP}:${TARGET_SERVER_PORT}`)

    // Send the Transfer packet — kicks them to your real server
    client.queue('transfer', {
      server_address: TARGET_SERVER_IP,
      port: TARGET_SERVER_PORT
    })
  })
})

// Auto-accept friend requests using Xbox Live
async function autoAcceptFriends() {
  const auth = new Authflow('CSMPREDIRECT@outlook.com', './auth-cache', {
    flow: 'msal'
  })

  const token = await auth.getXboxToken()
  const xuid = token.userXUID
  const xblToken = `XBL3.0 x=${token.userHash};${token.XSTSToken}`

  console.log('[Bot] Checking friend requests...')

  // Fetch pending friend requests
  const res = await fetch(
    `https://peoplehub.xboxlive.com/users/me/people/summary`,
    {
      headers: {
        Authorization: xblToken,
        'x-xbl-contract-version': '5',
        'Accept-Language': 'en-US'
      }
    }
  )

  const data = await res.json()
  const pending = data?.people?.filter(p => p.isFollowingCaller === false && p.isFollowedByCaller === false)

  if (pending?.length) {
    for (const person of pending) {
      // Add them back (follow = friend in Xbox)
      await fetch(
        `https://social.xboxlive.com/users/me/people/xuid(${person.xuid})`,
        {
          method: 'PUT',
          headers: {
            Authorization: xblToken,
            'x-xbl-contract-version': '2'
          }
        }
      )
      console.log(`[Bot] Auto-friended: ${person.displayName}`)
    }
  } else {
    console.log('[Bot] No pending requests.')
  }
}

// Check for friend requests every 30 seconds
autoAcceptFriends()
setInterval(autoAcceptFriends, 30_000)
