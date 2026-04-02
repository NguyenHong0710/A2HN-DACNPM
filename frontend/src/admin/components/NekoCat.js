import { useEffect } from 'react'

export default function NekoCat() {
  useEffect(() => {
    // ===== Load 1 lần duy nhất =====
    if (!window.__NEKO_LOADED__) {
      window.__NEKO_LOADED__ = true

      const style = document.createElement('style')
      style.innerHTML = `
        #oneko {
          position: fixed !important;
          z-index: 2147483647 !important;
          pointer-events: none !important;
          image-rendering: pixelated;
          transform: scale(1.2);
        }

        #oneko.neko-hidden {
          display: none !important;
        }
      `
      document.head.appendChild(style)

      const script = document.createElement('script')
      script.src = '/oneko.js'
      script.defer = true

      script.onload = () => {
        if (window.oneko?.init) window.oneko.init()

        // áp trạng thái ban đầu
        const enabled =
          localStorage.getItem('neko-enabled') !== 'false'
        const neko = document.getElementById('oneko')
        if (neko && !enabled) {
          neko.classList.add('neko-hidden')
        }
      }

      document.body.appendChild(script)
    }

    // ===== Listen toggle =====
    const handler = (e) => {
      const neko = document.getElementById('oneko')
      if (!neko) return

      if (e.detail) {
        neko.classList.remove('neko-hidden') // ON
      } else {
        neko.classList.add('neko-hidden') // OFF
      }
    }

    window.addEventListener('toggle-neko', handler)

    return () => {
      window.removeEventListener('toggle-neko', handler)
    }
  }, [])

  return null
}
