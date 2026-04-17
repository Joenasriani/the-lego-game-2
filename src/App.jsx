import React, { useRef, useState } from 'react'
import './App.css'
import { playSound } from './audio'
import {
  parseImportText,
  STORAGE_KEY,
  validateBuildPayload,
} from './brickValidation'

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7']

function loadInitialState() {
  const fallback = {
    bricks: [],
    status: { type: 'info', message: 'No saved build found.' },
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback

    const parsed = JSON.parse(raw)
    const validated = validateBuildPayload(parsed)
    return {
      bricks: validated,
      status: { type: 'success', message: `Loaded ${validated.length} saved brick(s).` },
    }
  } catch (error) {
    console.error('Saved build is invalid and could not be loaded.', error)
    return {
      bricks: [],
      status: { type: 'error', message: 'Saved build is invalid and could not be loaded.' },
    }
  }
}

function createBrick({ x, y, z, color, rotation }) {
  return {
    id: crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
    position: [x, y, z],
    color,
    rotation,
  }
}

function App() {
  const [initialLoad] = useState(() => loadInitialState())
  const [bricks, setBricks] = useState(initialLoad.bricks)
  const [status, setStatus] = useState(initialLoad.status)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [form, setForm] = useState({ x: 0, y: 0, z: 0, color: COLORS[0], rotation: 0 })
  const fileInputRef = useRef(null)

  const setStatusMessage = (type, message, error) => {
    if (error) {
      console.error(message, error)
    }
    setStatus({ type, message })
  }

  const addBrick = () => {
    const nextBrick = createBrick(form)

    try {
      validateBuildPayload([...bricks, nextBrick])
      setBricks((prev) => [...prev, nextBrick])
      playSound('snap', soundEnabled)
      setStatus({ type: 'success', message: 'Brick added.' })
    } catch (error) {
      setStatusMessage('error', 'Unable to add brick.', error)
    }
  }

  const removeBrick = (id) => {
    setBricks((prev) => prev.filter((brick) => brick.id !== id))
    playSound('delete', soundEnabled)
    setStatus({ type: 'success', message: 'Brick removed.' })
  }

  const saveBuild = () => {
    try {
      const validated = validateBuildPayload(bricks)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validated))
      setStatus({ type: 'success', message: `Saved ${validated.length} brick(s).` })
    } catch (error) {
      setStatusMessage('error', 'Failed to save build.', error)
    }
  }

  const loadBuild = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        throw new Error('No saved build exists in localStorage.')
      }
      const parsed = JSON.parse(raw)
      const validated = validateBuildPayload(parsed)
      setBricks(validated)
      setStatus({ type: 'success', message: `Loaded ${validated.length} brick(s).` })
    } catch (error) {
      setStatusMessage('error', 'Failed to load saved build.', error)
    }
  }

  const exportBuild = () => {
    try {
      const validated = validateBuildPayload(bricks)
      const blob = new Blob([JSON.stringify(validated, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'lego-build.json'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setStatus({ type: 'success', message: 'Build exported.' })
    } catch (error) {
      setStatusMessage('error', 'Failed to export build.', error)
    }
  }

  const triggerImport = () => {
    fileInputRef.current?.click()
  }

  const handleImportChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const reader = new FileReader()
    reader.onerror = () => {
      setStatusMessage('error', 'Failed to read import file.', reader.error)
    }
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : ''
        const validated = parseImportText(text, file.size)
        setBricks(validated)
        setStatus({ type: 'success', message: `Imported ${validated.length} brick(s).` })
      } catch (error) {
        setStatusMessage('error', `Import failed: ${error.message}`, error)
      }
    }

    reader.readAsText(file)
  }

  return (
    <main className="app">
      <h1>Lego Build Studio</h1>

      <section className="toolbar" aria-label="Build toolbar">
        <button type="button" onClick={saveBuild} aria-label="Save build">Save</button>
        <button type="button" onClick={loadBuild} aria-label="Load build">Load</button>
        <button type="button" onClick={exportBuild} aria-label="Export build">Export</button>
        <button type="button" onClick={triggerImport} aria-label="Import build">Import</button>
        <label>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(event) => setSoundEnabled(event.target.checked)}
          />
          Sound
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportChange}
          className="visually-hidden"
          aria-label="Import build file"
        />
      </section>

      <section className="builder" aria-label="Brick builder form">
        <label>
          X
          <input
            type="number"
            value={form.x}
            onChange={(event) => setForm((prev) => ({ ...prev, x: Number(event.target.value) }))}
          />
        </label>
        <label>
          Y
          <input
            type="number"
            value={form.y}
            min={0}
            onChange={(event) => setForm((prev) => ({ ...prev, y: Number(event.target.value) }))}
          />
        </label>
        <label>
          Z
          <input
            type="number"
            value={form.z}
            onChange={(event) => setForm((prev) => ({ ...prev, z: Number(event.target.value) }))}
          />
        </label>
        <label>
          Rotation
          <input
            type="number"
            value={form.rotation}
            step={0.1}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, rotation: Number(event.target.value) }))
            }
          />
        </label>
        <label>
          Color
          <select
            value={form.color}
            onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
          >
            {COLORS.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={addBrick}>Add brick</button>
      </section>

      <p className={`status ${status.type}`} role="status" aria-live="polite">
        {status.message}
      </p>

      <section aria-label="Bricks list">
        <h2>Bricks ({bricks.length})</h2>
        {bricks.length === 0 ? (
          <p>No bricks yet.</p>
        ) : (
          <ul className="brick-list">
            {bricks.map((brick) => (
              <li key={brick.id}>
                <span>
                  {brick.id.slice(0, 8)} • [{brick.position.join(', ')}] • {brick.color} • {brick.rotation}
                </span>
                <button type="button" onClick={() => removeBrick(brick.id)} aria-label={`Remove brick ${brick.id}`}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
