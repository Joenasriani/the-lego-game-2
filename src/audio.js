let sharedAudioContext

function getAudioContext() {
  if (typeof window === 'undefined') return null
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext
  if (!AudioContextCtor) return null
  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextCtor()
  }
  return sharedAudioContext
}

export function playSound(type, enabled = true) {
  if (!enabled) return

  try {
    const context = getAudioContext()
    if (!context) return

    if (context.state === 'suspended') {
      context.resume().catch((error) => {
        console.error('Unable to resume AudioContext:', error)
      })
    }

    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.connect(gain)
    gain.connect(context.destination)

    const now = context.currentTime

    if (type === 'snap') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(600, now)
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1)
      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
      osc.start(now)
      osc.stop(now + 0.1)
      return
    }

    if (type === 'delete') {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(150, now)
      osc.frequency.linearRampToValueAtTime(50, now + 0.15)
      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
      osc.start(now)
      osc.stop(now + 0.15)
    }
  } catch (error) {
    console.error('Audio playback failed:', error)
  }
}
