import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import App from './App'

beforeEach(() => {
  localStorage.clear()
  if (!URL.createObjectURL) {
    URL.createObjectURL = vi.fn()
  }
  if (!URL.revokeObjectURL) {
    URL.revokeObjectURL = vi.fn()
  }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('App smoke tests', () => {
  it('mounts the app', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /lego build studio/i })).toBeInTheDocument()
  })

  it('saves and loads bricks across refresh', async () => {
    const user = userEvent.setup()

    const { unmount } = render(<App />)
    await user.click(screen.getByRole('button', { name: /add brick/i }))
    await user.click(screen.getByRole('button', { name: /save build/i }))

    expect(JSON.parse(localStorage.getItem('lego-build'))).toHaveLength(1)

    unmount()

    render(<App />)
    expect(await screen.findByText(/Loaded 1 saved brick/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /bricks \(1\)/i })).toBeInTheDocument()
  })

  it('supports import and export actions', async () => {
    const user = userEvent.setup()

    const createUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url')
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<App />)

    await user.click(screen.getByRole('button', { name: /add brick/i }))
    await user.click(screen.getByRole('button', { name: /export build/i }))

    expect(createUrlSpy).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeSpy).toHaveBeenCalledWith('blob:test-url')
    expect(screen.getByText(/Build exported/i)).toBeInTheDocument()

    const importInput = screen.getByLabelText(/import build file/i)
    const validFile = new File(
      [
        JSON.stringify([
          { id: 'b1', position: [1, 0, 2], color: '#ef4444', rotation: 0 },
        ]),
      ],
      'build.json',
      { type: 'application/json' },
    )

    await user.upload(importInput, validFile)

    await waitFor(() => {
      expect(screen.getByText(/Imported 1 brick/i)).toBeInTheDocument()
    })

    const invalidFile = new File(
      [JSON.stringify([{ id: 'bad', position: ['x', 0, 0], color: '#ef4444', rotation: 0 }])],
      'invalid.json',
      { type: 'application/json' },
    )

    await user.upload(importInput, invalidFile)

    await waitFor(() => {
      expect(screen.getByText(/Import failed:/i)).toBeInTheDocument()
    })
    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})
