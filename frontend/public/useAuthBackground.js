import { useEffect } from 'react'

export default function useAuthBackground() {
  useEffect(() => {
    const applyBg = ({ type, value }) => {
      const el = document.body

      if (type === 'image' && value) {
        el.style.background = `url(${value}) center/cover no-repeat fixed`
      } else {
        el.style.background = ''
        el.setAttribute('data-auth-bg', value || 'rgb')
      }
    }

    // áp dụng lúc load trang
    applyBg({
      type: localStorage.getItem('auth_bg_type'),
      value: localStorage.getItem('auth_bg_value'),
    })

    const listener = (e) => applyBg(e.detail)
    window.addEventListener('auth-bg-change', listener)

    return () => {
      window.removeEventListener('auth-bg-change', listener)
    }
  }, [])
}
