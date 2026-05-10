import { Game } from './core/Game.js'

const game = new Game()
game.init().then(() => {
  game.start()
}).catch(err => {
  console.error('Game init failed:', err)
  const loadingText = document.getElementById('loading-text')
  if (loadingText) loadingText.textContent = 'Lỗi: ' + err.message
})

// Expose for debugging
window.__game = game
