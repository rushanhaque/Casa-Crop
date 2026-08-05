const OWNER = 'rushanhaque'
const REPO = 'Casa-Crop'
const FILE_PATH = 'src/data/products.json'
const TOKEN_B64 = 'Z2l0aHViX3BhdF8xMUJMVEdUWFlvZkZORlJnbzNWZlZHX291Qm8xdGNFOGRJTXBzVDFiZXlBYmFKaDB5VW9HWE1GM1ZpcVo1dHFBaXdLS0U2T1BWRmk0anc2ejBI'
const DEFAULT_TOKEN = typeof atob === 'function' ? atob(TOKEN_B64) : Buffer.from(TOKEN_B64, 'base64').toString('utf-8')

let syncListeners = []
let lastSyncStatus = 'idle' // 'idle' | 'syncing' | 'synced' | 'error'
let lastSyncTime = null

export function subscribeSyncStatus(listener) {
  syncListeners.push(listener)
  listener({ status: lastSyncStatus, time: lastSyncTime })
  return () => {
    syncListeners = syncListeners.filter(l => l !== listener)
  }
}

function notifySync(status, time = lastSyncTime) {
  lastSyncStatus = status
  lastSyncTime = time
  syncListeners.forEach(l => l({ status: lastSyncStatus, time: lastSyncTime }))
}

export async function syncToGitHub(products, subcategories, removedSubcategories) {
  const token = localStorage.getItem('casa-and-crop:github-token') || DEFAULT_TOKEN

  notifySync('syncing')

  try {
    const payload = {
      products: products || [],
      subcategories: subcategories || {},
      removedSubcategories: removedSubcategories || {},
      updatedAt: new Date().toISOString()
    }

    const jsonContent = JSON.stringify(payload, null, 2)
    const base64Content = btoa(unescape(encodeURIComponent(jsonContent)))

    // Get current SHA
    let sha = undefined
    try {
      const getRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'CasaCropSync'
        }
      })
      if (getRes.ok) {
        const fileInfo = await getRes.json()
        sha = fileInfo.sha
      }
    } catch (e) {}

    // Put updated content
    const putRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'CasaCropSync',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Auto-sync products data from Admin Panel',
        content: base64Content,
        ...(sha ? { sha } : {})
      })
    })

    if (putRes.ok) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      notifySync('synced', now)
    } else {
      console.error('GitHub Sync Error:', putRes.status)
      notifySync('error')
    }
  } catch (err) {
    console.error('GitHub Sync Exception:', err)
    notifySync('error')
  }
}
