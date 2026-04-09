const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const http = require('http')
const os = require('os')

// const API_HOST = '127.0.0.1'
// const API_PORT = 8000
// const API_BASE = `http://${API_HOST}:${API_PORT}`
const API_BASE = 'https://corelign-desktop-app-production.up.railway.app'
const BACKEND_HEALTH_PATH = '/'
const SKIP_BACKEND = process.env.CORELIGN_SKIP_BACKEND === '1'

let backendProcess = null

function getDeviceMacAddress() {
  const interfaces = os.networkInterfaces()
  for (const entries of Object.values(interfaces)) {
    if (!Array.isArray(entries)) continue
    for (const entry of entries) {
      if (!entry || entry.internal || !entry.mac) continue
      const mac = String(entry.mac).toLowerCase()
      if (mac && mac !== '00:00:00:00:00:00') {
        return mac
      }
    }
  }
  return null
}

function getBackendDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'backend')
  }
  return path.join(__dirname, '..', 'backend')
}

function getFrontendEntry() {
  if (process.env.CORELIGN_FRONTEND_URL) {
    return process.env.CORELIGN_FRONTEND_URL
  }

  const distDir = app.isPackaged
    ? path.join(process.resourcesPath, 'frontend-dist')
    : path.join(__dirname, 'dist')

  return `file://${path.join(distDir, 'index.html')}`
}

function resolvePythonCommand() {
  const explicit = process.env.CORELIGN_PYTHON_PATH
  if (explicit) {
    return explicit
  }

  const candidates = [
    path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe'),
    path.join(__dirname, '..', 'backend', '.venv', 'Scripts', 'python.exe'),
    'python',
  ]

  return candidates.find((candidate) => {
    if (candidate === 'python') {
      return true
    }
    try {
      return require('fs').existsSync(candidate)
    } catch {
      return false
    }
  })
}

function waitForBackend(timeoutMs = 30000) {
  const start = Date.now()

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(`${API_BASE}${BACKEND_HEALTH_PATH}`, (res) => {
        res.resume()
        if (res.statusCode && res.statusCode < 500) {
          resolve()
          return
        }
        retry()
      })

      req.on('error', retry)
      req.setTimeout(1500, () => {
        req.destroy()
        retry()
      })
    }

    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error('Timed out while waiting for backend API to become ready.'))
        return
      }
      setTimeout(attempt, 500)
    }

    attempt()
  })
}

function startBackend() {
  // Local backend startup is disabled when using Railway-hosted API.
  return

  /*
  const pythonCmd = resolvePythonCommand()
  const backendDir = getBackendDir()

  backendProcess = spawn(
    pythonCmd,
    ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'],
    {
      cwd: backendDir,
      windowsHide: true,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )

  backendProcess.stdout.on('data', (data) => {
    process.stdout.write(`[backend] ${data}`)
  })

  backendProcess.stderr.on('data', (data) => {
    process.stderr.write(`[backend] ${data}`)
  })

  backendProcess.on('exit', (code) => {
    console.error(`[backend] exited with code ${code}`)
  })
  */
}

function stopBackend() {
  if (!backendProcess || backendProcess.killed) {
    return
  }

  backendProcess.kill('SIGTERM')
  backendProcess = null
}

async function createMainWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1000,
    minHeight: 680,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const target = getFrontendEntry()
  await win.loadURL(target)
}

app.whenReady().then(async () => {
  ipcMain.handle('corelign:get-device-info', async () => {
    return {
      device_name: os.hostname(),
      platform: `${os.platform()}-${os.release()}`,
      mac_address: getDeviceMacAddress(),
    }
  })

  if (!SKIP_BACKEND) {
    try {
      startBackend()
      await waitForBackend()
    } catch (error) {
      console.error('[backend] startup failed, launching UI without local backend:', error)
    }
  }
  await createMainWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  stopBackend()
})
