import * as THREE from 'three'

/**
 * AssetLoader - generates procedural textures (no external files needed).
 * Singleton: import { assets }.
 */
class AssetLoader {
  constructor() {
    this.textures = {}
    this.cubeTexture = null
    this._textureLoader = new THREE.TextureLoader()
  }

  _genTex(name) {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const ctx = c.getContext('2d')
    const presets = {
      marble:      'marble', wood: 'wood', wall: 'plaster', brick: 'brick',
      grass: 'grass', stone: 'stone',
      deco_gold: 'gold', deco_floral: 'floral', deco_ancient: 'ancient', deco_modern: 'modern'
    }
    const style = presets[name] || 'noise'
    switch (style) {
      case 'marble': {
        const g = ctx.createRadialGradient(128, 128, 30, 128, 128, 200)
        g.addColorStop(0, '#f6f4ee'); g.addColorStop(0.6, '#e8e6e0'); g.addColorStop(1, '#d4d0c4')
        ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256)
        for (let i = 0; i < 50; i++) {
          ctx.strokeStyle = `rgba(${100 + Math.random() * 40},${90 + Math.random() * 30},${75 + Math.random() * 30},${0.1 + Math.random() * 0.3})`
          ctx.lineWidth = 0.5 + Math.random() * 2.5
          ctx.beginPath()
          let x = Math.random() * 256, y = Math.random() * 256
          ctx.moveTo(x, y)
          for (let j = 0; j < 8; j++) { x += (Math.random() - 0.5) * 60; y += (Math.random() - 0.5) * 60; ctx.lineTo(x, y) }
          ctx.stroke()
        }
        break
      }
      case 'wood':
        ctx.fillStyle = '#8B5A2B'; ctx.fillRect(0, 0, 256, 256)
        for (let y = 0; y < 256; y += 4) {
          const v = Math.sin(y * 0.05) * 0.2 + Math.random() * 0.15
          ctx.fillStyle = `rgba(60,40,20,${v})`
          ctx.fillRect(0, y, 256, 2)
        }
        for (let i = 0; i < 10; i++) {
          ctx.strokeStyle = 'rgba(40,25,10,0.4)'; ctx.beginPath()
          ctx.moveTo(0, Math.random() * 256)
          ctx.bezierCurveTo(80, Math.random() * 256, 160, Math.random() * 256, 256, Math.random() * 256)
          ctx.stroke()
        }
        break
      case 'plaster':
        ctx.fillStyle = '#d6cfc0'; ctx.fillRect(0, 0, 256, 256)
        for (let i = 0; i < 2000; i++) {
          ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`
          ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1)
        }
        break
      case 'brick': {
        ctx.fillStyle = '#9b4a2e'; ctx.fillRect(0, 0, 256, 256)
        const bw = 64, bh = 24
        for (let y = 0; y < 256; y += bh) {
          const off = (y / bh) % 2 === 0 ? 0 : bw / 2
          for (let x = -bw; x < 256; x += bw) {
            ctx.fillStyle = `hsl(${15 + Math.random() * 10}, ${40 + Math.random() * 20}%, ${30 + Math.random() * 10}%)`
            ctx.fillRect(x + off + 1, y + 1, bw - 2, bh - 2)
          }
        }
        ctx.strokeStyle = '#3a1a0a'; ctx.lineWidth = 1
        for (let y = 0; y < 256; y += bh) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke() }
        break
      }
      case 'grass':
        ctx.fillStyle = '#3d7a2d'; ctx.fillRect(0, 0, 256, 256)
        for (let i = 0; i < 5000; i++) {
          const s = 50 + Math.random() * 80
          ctx.fillStyle = `rgb(${30 + Math.random() * 30},${s + 30},${30 + Math.random() * 30})`
          ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2)
        }
        break
      case 'stone':
        ctx.fillStyle = '#9a9a9a'; ctx.fillRect(0, 0, 256, 256)
        for (let i = 0; i < 1500; i++) {
          ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`
          const s = 1 + Math.random() * 4
          ctx.fillRect(Math.random() * 256, Math.random() * 256, s, s)
        }
        break
      case 'gold': {
        const g = ctx.createLinearGradient(0, 0, 256, 256)
        g.addColorStop(0, '#FFD700'); g.addColorStop(0.5, '#FFEC8B'); g.addColorStop(1, '#B8860B')
        ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256)
        for (let i = 0; i < 40; i++) {
          ctx.fillStyle = `rgba(255,255,200,${Math.random() * 0.3})`
          ctx.beginPath(); ctx.arc(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 6, 0, Math.PI * 2); ctx.fill()
        }
        break
      }
      case 'floral':
        ctx.fillStyle = '#a8c8a0'; ctx.fillRect(0, 0, 256, 256)
        for (let i = 0; i < 20; i++) {
          const cx = Math.random() * 256, cy = Math.random() * 256
          const cols = ['#d96aa8', '#f5c542', '#ffffff', '#7aaa5a']
          ctx.fillStyle = cols[Math.floor(Math.random() * cols.length)]
          for (let j = 0; j < 6; j++) {
            const a = (j / 6) * Math.PI * 2
            ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8, 6, 0, Math.PI * 2); ctx.fill()
          }
          ctx.fillStyle = '#3d6b3d'
          ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill()
        }
        break
      case 'ancient':
        ctx.fillStyle = '#c2a878'; ctx.fillRect(0, 0, 256, 256)
        ctx.strokeStyle = '#7a5c30'; ctx.lineWidth = 2
        for (let y = 0; y < 256; y += 40) for (let x = 0; x < 256; x += 40) {
          ctx.strokeRect(x + 5, y + 5, 30, 30); ctx.strokeRect(x + 12, y + 12, 16, 16)
        }
        for (let i = 0; i < 800; i++) {
          ctx.fillStyle = `rgba(80,60,30,${Math.random() * 0.15})`
          ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1)
        }
        break
      case 'modern':
        ctx.fillStyle = '#2a2a3e'; ctx.fillRect(0, 0, 256, 256)
        for (let i = 0; i < 12; i++) {
          ctx.fillStyle = `rgba(255,215,0,${0.3 + Math.random() * 0.5})`
          const x = Math.floor(Math.random() * 8) * 32
          const y = Math.floor(Math.random() * 8) * 32
          if (Math.random() > 0.5) ctx.fillRect(x, y, 32, 32)
          else { ctx.beginPath(); ctx.arc(x + 16, y + 16, 14, 0, Math.PI * 2); ctx.fill() }
        }
        break
      default:
        ctx.fillStyle = '#888'; ctx.fillRect(0, 0, 256, 256)
    }
    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }

  _genSky() {
    const colors = [
      ['#4A90E2', '#87CEEB'], ['#4A90E2', '#87CEEB'],
      ['#1E5799', '#4A90E2'], ['#3d7a2d', '#5e9a48'],
      ['#4A90E2', '#87CEEB'], ['#4A90E2', '#87CEEB']
    ]
    const sides = []
    for (let i = 0; i < 6; i++) {
      const c = document.createElement('canvas')
      c.width = c.height = 256
      const ctx = c.getContext('2d')
      const g = ctx.createLinearGradient(0, 0, 0, 256)
      g.addColorStop(0, colors[i][0]); g.addColorStop(1, colors[i][1])
      ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256)
      // Sun on top face
      if (i === 2) {
        const sg = ctx.createRadialGradient(180, 60, 5, 180, 60, 60)
        sg.addColorStop(0, 'rgba(255,255,220,1)')
        sg.addColorStop(0.4, 'rgba(255,210,140,0.6)')
        sg.addColorStop(1, 'rgba(255,210,140,0)')
        ctx.fillStyle = sg; ctx.fillRect(120, 0, 120, 120)
      }
      // Clouds
      if (i !== 3) {
        for (let cId = 0; cId < 6; cId++) {
          ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.3})`
          const cx = Math.random() * 256, cy = Math.random() * 256
          for (let k = 0; k < 5; k++) {
            ctx.beginPath()
            ctx.arc(cx + (Math.random() - 0.5) * 40, cy + (Math.random() - 0.5) * 20,
                    12 + Math.random() * 16, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
      sides.push(c.toDataURL())
    }
    return new THREE.CubeTextureLoader().load(sides)
  }

  async loadAll(onProgress) {
    const names = ['marble', 'wood', 'wall', 'brick', 'grass', 'stone',
                   'deco_gold', 'deco_floral', 'deco_ancient', 'deco_modern']
    const total = names.length + 1
    let done = 0
    for (const n of names) {
      this.textures[n] = this._genTex(n)
      done++
      onProgress && onProgress((done / total) * 100)
      await new Promise(r => setTimeout(r, 30))
    }
    this.cubeTexture = this._genSky()
    done++
    onProgress && onProgress(100)
  }

  getTexture(name) {
    return this.textures[name] || this._genTex(name)
  }
}

export const assets = new AssetLoader()
