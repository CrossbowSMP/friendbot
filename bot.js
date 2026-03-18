const bedrock = require('bedrock-protocol')
const { Authflow, Titles } = require('prismarine-auth')

const TARGET_SERVER_IP = '162.120.4.88'
const TARGET_SERVER_PORT = 9010
const BOT_EMAIL = 'CSMPREDIRECT@outlook.com'

async function startBot() {
  const client = bedrock.createClient({
    host: TARGET_SERVER_IP,
    port: TARGET_SERVER_PORT,
    username: BOT_EMAIL,
    profilesFolder: '/tmp/auth-cache',
    authTitle: Titles.MinecraftNintendoSwitch,
    deviceType: 'Nintendo'
  })

  client.on('spawn', () => {
    console.log('[Bot] Connected and online!')
  })

  client.on('disconnect', (reason) => {
    console.log('[Bot] Disconnected:', reason)
    setTimeout(startBot, 5000)
  })

  client.on('error', (err) => {
    console.error('[Bot] Error:', err.message)
    setTimeout(startBot, 5000)
  })
}

startBot()
setInterval(autoAcceptFriends, 30_000)

// ... keep your autoAcceptFriends function below

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
