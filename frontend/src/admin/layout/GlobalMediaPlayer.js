import React, { useState, useEffect } from 'react'
import CIcon from '@coreui/icons-react'
import { cilWindowMaximize, cilWindowMinimize, cilX } from '@coreui/icons'

const GlobalMediaPlayer = () => {
  const [videoId, setVideoId] = useState('')
  const [mode, setMode] = useState('none')

  useEffect(() => {
    const savedId = localStorage.getItem('global_yt_id')
    const savedMode = localStorage.getItem('global_yt_mode') || 'none'

    if (savedId && savedMode !== 'none') {
      setVideoId(savedId)
      setMode(savedMode)
    }

    const handlePlay = (e) => {
      setVideoId(e.detail.videoId)
      setMode('full')
      localStorage.setItem('global_yt_id', e.detail.videoId)
      localStorage.setItem('global_yt_mode', 'full')
    }

    window.addEventListener('play-youtube-video', handlePlay)
    return () => window.removeEventListener('play-youtube-video', handlePlay)
  }, [])

  const updateMode = (newMode) => {
    setMode(newMode)
    localStorage.setItem('global_yt_mode', newMode)
  }

  const closePlayer = () => {
    setMode('none')
    setVideoId('')
    localStorage.removeItem('global_yt_id')
    localStorage.removeItem('global_yt_mode')
  }

  if (!videoId || mode === 'none') return null

  const isFull = mode === 'full'

  const containerStyle = isFull ? {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '85vw',
    maxWidth: '1100px',
    aspectRatio: '16/9',
    borderRadius: '20px',
    boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.8)',
  } : {
    right: '25px',
    bottom: '25px',
    width: '360px',
    borderRadius: '16px',
    boxShadow: '0 20px 40px -5px rgba(0, 0, 0, 0.6)',
  }

  return (
    <>
      {/* Backdrop mờ */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          zIndex: 9998,
          opacity: isFull ? 1 : 0,
          transition: 'opacity 0.4s ease',
          pointerEvents: isFull ? 'auto' : 'none'
        }} 
        onClick={() => updateMode('mini')}
      />

      <div style={{
        position: 'fixed',
        zIndex: 9999,
        background: '#1a1a1a',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        overflow: 'hidden',
        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        ...containerStyle
      }}>
        
        {/* Header Bar */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
             </div>
             <span style={{ 
               color: 'rgba(255,255,255,0.9)', 
               fontSize: '11px', 
               fontWeight: 'bold', 
               letterSpacing: '0.5px',
               marginLeft: '10px',
               textTransform: 'uppercase'
             }}>
               {isFull ? '📺 Chế độ rạp chiếu' : '🎵 Trình phát thu nhỏ'}
             </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => updateMode(isFull ? 'mini' : 'full')}
              className="btn-media-control"
              style={{
                ...actionButtonStyle,
                color: isFull ? '#0dcaf0' : '#f8f9fa'
              }}
            >
              <CIcon icon={isFull ? cilWindowMinimize : cilWindowMaximize} size="sm" />
              <span style={{ marginLeft: '6px' }}>{isFull ? 'Thu nhỏ' : 'Phóng lớn'}</span>
            </button>

            <button 
              onClick={closePlayer}
              className="btn-media-control"
              style={{ ...actionButtonStyle, color: '#ff4d4f' }}
            >
              <CIcon icon={cilX} size="sm" />
              <span style={{ marginLeft: '6px' }}>Đóng</span>
            </button>
          </div>
        </div>
        
        <div style={{ flex: 1, position: 'relative', background: '#000' }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            allow="autoplay; encrypted-media"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
        </div>
      </div>

      <style>{`
        .btn-media-control {
          background: rgba(255, 255, 255, 0.08);
          border: none;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          font-size: 12px;
          font-weight: 600;
          outline: none;
        }
        .btn-media-control:hover {
          background: rgba(255, 255, 255, 0.18);
          transform: translateY(-1px);
        }
        .btn-media-control:active {
          transform: translateY(0px);
        }
      `}</style>
    </>
  )
}

const actionButtonStyle = {
  display: 'flex',
  alignItems: 'center',
}

export default GlobalMediaPlayer