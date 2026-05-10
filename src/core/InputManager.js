/**
 * InputManager - keyboard + mouse + pointer lock.
 * Singleton.
 */
class InputManager {
  constructor() {
    this.keys = {}
    this.mouseDelta = { x: 0, y: 0 }
    this.mouseButtons = { left: false, right: false, middle: false }
    this._mouseMoveCallbacks = []
    this._keyPressCallbacks = {}
    this.pointerLocked = false
    this.enabled = true

    this._installListeners()
  }

  _installListeners() {
    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return
      this.keys[e.code] = true
      const cbs = this._keyPressCallbacks[e.code]
      if (cbs) cbs.forEach(cb => cb())
    })
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false
    })
    window.addEventListener('mousemove', (e) => {
      if (!this.enabled) return
      const dx = e.movementX || 0
      const dy = e.movementY || 0
      this.mouseDelta.x = dx
      this.mouseDelta.y = dy
      this._mouseMoveCallbacks.forEach(cb => cb({ dx, dy, locked: this.pointerLocked }))
    })
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouseButtons.left = true
      if (e.button === 1) this.mouseButtons.middle = true
      if (e.button === 2) this.mouseButtons.right = true
    })
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseButtons.left = false
      if (e.button === 1) this.mouseButtons.middle = false
      if (e.button === 2) this.mouseButtons.right = false
    })
    window.addEventListener('contextmenu', (e) => e.preventDefault())

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement !== null
    })
  }

  /**
   * Request pointer lock on the given element. Must be called from a user gesture.
   */
  requestPointerLock(element) {
    if (element && element.requestPointerLock) element.requestPointerLock()
  }

  exitPointerLock() {
    if (document.exitPointerLock) document.exitPointerLock()
  }

  isDown(code) {
    return !!this.keys[code]
  }

  /**
   * Check any of multiple key codes.
   */
  anyDown(...codes) {
    return codes.some(c => this.keys[c])
  }

  onMouseMove(cb) {
    this._mouseMoveCallbacks.push(cb)
  }

  /**
   * Register callback to fire once per keydown event for this key code.
   * @param {string} code - KeyboardEvent.code (e.g. 'KeyV')
   */
  onKeyPress(code, cb) {
    if (!this._keyPressCallbacks[code]) this._keyPressCallbacks[code] = []
    this._keyPressCallbacks[code].push(cb)
  }

  setEnabled(enabled) {
    this.enabled = enabled
    if (!enabled) this.keys = {}
  }
}

export const input = new InputManager()
