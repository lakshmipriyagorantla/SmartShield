import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const pythonCandidates = process.platform === 'win32'
  ? ['.venv/Scripts/python.exe']
  : ['.venv/bin/python']
const python = pythonCandidates
  .map((candidate) => fileURLToPath(new URL(`../${candidate}`, import.meta.url)))
  .find((candidate) => existsSync(candidate))
  || process.env.PYTHON
  || (process.platform === 'win32' ? 'python' : 'python3')
const children = []
let stopping = false

function stop(exitCode) {
  if (stopping) return
  stopping = true
  process.exitCode = exitCode
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill()
  }
}

function start(command, args) {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit' })
  children.push(child)
  child.once('error', (error) => {
    console.error(`Unable to start ${command}:`, error)
    stop(1)
  })
  child.once('close', (code, signal) => {
    if (!stopping) {
      console.error(`${command} exited${signal ? ` after ${signal}` : ` with code ${code}`}.`)
      stop(code || 1)
    }
  })
  return child
}

async function waitForBackend(backend) {
  const deadline = Date.now() + 30000
  let lastError

  while (Date.now() < deadline) {
    if (backend.exitCode !== null || backend.signalCode !== null) {
      throw new Error('Flask exited before its quiz API became ready.')
    }

    try {
      const response = await fetch('http://127.0.0.1:5001/api/quiz?language=en', {
        signal: AbortSignal.timeout(2000),
      })
      if (!response.ok) {
        throw new Error(`Quiz API returned HTTP ${response.status}.`)
      }

      const quizSets = await response.json()
      if (!Array.isArray(quizSets) || quizSets.length === 0) {
        throw new Error('Quiz API did not return any quiz sets.')
      }
      return
    } catch (error) {
      lastError = error
      await delay(500)
    }
  }

  throw new Error(`Flask did not become ready on port 5001: ${lastError}`)
}

process.once('SIGINT', () => stop(0))
process.once('SIGTERM', () => stop(0))

try {
  const backend = start(python, [
    '-m',
    'flask',
    '--app',
    'backend.app',
    'run',
    '--host',
    '127.0.0.1',
    '--port',
    '5001',
  ])
  await waitForBackend(backend)
  if (!stopping) {
    start(process.execPath, [
      fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)),
      '--host',
      '127.0.0.1',
    ])
  }
} catch (error) {
  console.error(error)
  stop(1)
}
