/**
 * CameraToolbar - bottom-right HTML controls that adjust the live camera.
 */
export class CameraToolbar {
  constructor(camera) {
    this.camera = camera
    this._defaults = { fov: 75, near: 0.1, far: 300 }
    this._wire('cam-fov', 'fov', v => {
      this.camera.fov = v
      this.camera.updateProjectionMatrix()
    }, n => n.toFixed(0))
    this._wire('cam-near', 'near', v => {
      this.camera.near = v
      this.camera.updateProjectionMatrix()
    }, n => n.toFixed(2))
    this._wire('cam-far', 'far', v => {
      this.camera.far = v
      this.camera.updateProjectionMatrix()
    }, n => n.toFixed(0))

    document.getElementById('cam-reset').addEventListener('click', () => this.reset())
  }

  _wire(id, prop, apply, format) {
    const slider = document.getElementById(id)
    const valEl = document.getElementById(id + '-val')
    const update = () => {
      const v = parseFloat(slider.value)
      apply(v)
      valEl.textContent = format(v)
    }
    slider.addEventListener('input', update)
    update()
  }

  reset() {
    document.getElementById('cam-fov').value = this._defaults.fov
    document.getElementById('cam-near').value = this._defaults.near
    document.getElementById('cam-far').value = this._defaults.far
    this.camera.fov = this._defaults.fov
    this.camera.near = this._defaults.near
    this.camera.far = this._defaults.far
    this.camera.updateProjectionMatrix()
    document.getElementById('cam-fov-val').textContent = this._defaults.fov.toFixed(0)
    document.getElementById('cam-near-val').textContent = this._defaults.near.toFixed(2)
    document.getElementById('cam-far-val').textContent = this._defaults.far.toFixed(0)
  }
}
