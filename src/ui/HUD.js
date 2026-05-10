/**
 * HUD - the on-screen overlay (money, timer, hints, game-over screen).
 * Operates on existing DOM elements declared in index.html.
 */
export class HUD {
  constructor() {
    this.$money = document.getElementById('money')
    this.$timer = document.getElementById('timer')
    this.$timerWrap = document.getElementById('timer-display')
    this.$hint = document.getElementById('interact-hint')
    this.$gameOver = document.getElementById('game-over')
    this.$gameOverTitle = document.getElementById('game-over-title')
    this.$gameOverSummary = document.getElementById('game-over-summary')
  }

  showMoney(amount) {
    if (this.$money) this.$money.textContent = String(amount)
  }

  showTimer(seconds) {
    if (!this.$timerWrap) return
    if (seconds === null || seconds === undefined) {
      this.$timerWrap.classList.add('hidden')
      return
    }
    this.$timerWrap.classList.remove('hidden')
    if (this.$timer) this.$timer.textContent = String(Math.max(0, Math.ceil(seconds)))
    if (seconds <= 10) this.$timerWrap.classList.add('urgent')
    else this.$timerWrap.classList.remove('urgent')
  }

  hideTimer() {
    if (this.$timerWrap) {
      this.$timerWrap.classList.add('hidden')
      this.$timerWrap.classList.remove('urgent')
    }
  }

  showInteractHint(show, text) {
    if (!this.$hint) return
    if (show) {
      this.$hint.classList.remove('hidden')
      if (text) this.$hint.innerHTML = text
    } else {
      this.$hint.classList.add('hidden')
    }
  }

  showGameOver(reason, totalMoney) {
    if (!this.$gameOver) return
    this.$gameOver.classList.remove('hidden')
    if (reason === 'escaped') {
      this.$gameOverTitle.textContent = '🏆 THOÁT THÀNH CÔNG!'
      this.$gameOverTitle.className = 'escaped'
      this.$gameOverSummary.textContent = `Bạn đã trộm được tổng cộng $${totalMoney}`
    } else if (reason === 'caught') {
      this.$gameOverTitle.textContent = '🚨 BẠN ĐÃ BỊ BẮT!'
      this.$gameOverTitle.className = 'caught'
      this.$gameOverSummary.textContent = `Số tiền trộm được: $${totalMoney}`
    }
  }
}
