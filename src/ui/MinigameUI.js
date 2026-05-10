/**
 * MinigameUI - shared helpers for building/clearing the #minigame-overlay panel.
 *
 * Each minigame creates its own DOM inside the overlay; this class
 * provides utilities like flash-error and overlay open/close.
 */
export class MinigameUI {
  constructor() {
    this.$overlay = document.getElementById('minigame-overlay')
  }

  open() {
    this.$overlay.classList.add('active')
  }

  close() {
    this.$overlay.classList.remove('active')
    this.$overlay.innerHTML = ''
  }

  /** Return the overlay container so a minigame can render into it. */
  get container() { return this.$overlay }

  /** Remove all children but keep the overlay open (for next minigame in chain). */
  clear() {
    this.$overlay.innerHTML = ''
  }

  /** Briefly flash a panel red. */
  flashError(panel) {
    panel.classList.remove('flash-error')
    void panel.offsetWidth
    panel.classList.add('flash-error')
  }
}
