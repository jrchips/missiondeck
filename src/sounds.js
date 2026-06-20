let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  return ctx
}

function note(freq, type, start, duration, gain = 0.3) {
  try {
    const ac = getCtx()
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.connect(g)
    g.connect(ac.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, ac.currentTime + start)
    g.gain.setValueAtTime(gain, ac.currentTime + start)
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + start + duration)
    osc.start(ac.currentTime + start)
    osc.stop(ac.currentTime + start + duration + 0.01)
  } catch (_) {}
}

export function playDoorSound() {
  try {
    note(120, 'sawtooth', 0, 0.12, 0.25)
    note(80, 'sawtooth', 0.08, 0.25, 0.2)
    note(55, 'triangle', 0.15, 0.35, 0.15)
  } catch (_) {}
}

export function playSuccessSound() {
  try {
    note(440, 'square', 0, 0.08, 0.15)
    note(550, 'square', 0.1, 0.08, 0.15)
    note(660, 'square', 0.2, 0.15, 0.15)
  } catch (_) {}
}

export function playTickSound() {
  try {
    note(880, 'square', 0, 0.04, 0.08)
  } catch (_) {}
}
