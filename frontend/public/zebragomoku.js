import React, { useState } from 'react'
import { CButton } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilX, cilReload } from '@coreui/icons'

const SIZE = 15

const AI_DELAY = {
  easy: 200,
  medium: 350,
  hard: 600,
}

/* =======================
   ZEBRA-STYLE AI CORE
======================= */
const AI = {
  HUMAN: 'X',
  BOT: 'O',

  dirs: [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ],

  memory: {},

  inBoard(r, c) {
    return r >= 0 && c >= 0 && r < SIZE && c < SIZE
  },

  count(board, r, c, dx, dy, role) {
    let i = 1
    let cnt = 0
    while (
      this.inBoard(r + dx * i, c + dy * i) &&
      board[r + dx * i][c + dy * i] === role
    ) {
      cnt++
      i++
    }
    return cnt
  },

  scorePoint(board, r, c, role) {
    let score = 0
    for (let [dx, dy] of this.dirs) {
      const a = this.count(board, r, c, dx, dy, role)
      const b = this.count(board, r, c, -dx, -dy, role)
      const t = a + b

      if (t >= 4) score += 100000
      else if (t === 3) score += 15000
      else if (t === 2) score += 1500
      else if (t === 1) score += 150
    }
    return score
  },

  isNear(board, r, c, dist = 2) {
    for (let i = -dist; i <= dist; i++)
      for (let j = -dist; j <= dist; j++)
        if (
          this.inBoard(r + i, c + j) &&
          board[r + i][c + j]
        )
          return true
    return false
  },

  rememberHumanMove(r, c) {
    const k = `${r},${c}`
    this.memory[k] = (this.memory[k] || 0) + 1
  },

  bestMove(board, level) {
    let best = null
    let bestScore = -Infinity
    let hasStone = false

    // kiểm tra bàn trống
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        if (board[r][c]) hasStone = true

    // nước đầu tiên → đánh giữa
    if (!hasStone) {
      return { r: Math.floor(SIZE / 2), c: Math.floor(SIZE / 2) }
    }

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c]) continue
        if (!this.isNear(board, r, c)) continue

        const attack = this.scorePoint(board, r, c, this.BOT)
        const defend = this.scorePoint(board, r, c, this.HUMAN)
        const mem = this.memory[`${r},${c}`] || 0

        let score =
          attack * (level === 'hard' ? 1.3 : 1.1) +
          defend * (level === 'easy' ? 0.7 : 1.1) +
          mem * 500

        // hard: bắt buộc chặn thắng
        if (level === 'hard' && defend >= 100000) {
          score += 500000
        }

        if (score > bestScore) {
          bestScore = score
          best = { r, c }
        }
      }
    }

    // fallback an toàn
    return best || { r: 7, c: 7 }
  },
}

/* =======================
        GAME
======================= */
function CaroGame({ visible, setVisible }) {
  const emptyBoard = Array(SIZE)
    .fill(null)
    .map(() => Array(SIZE).fill(null))

  const [board, setBoard] = useState(emptyBoard)
  const [xTurn, setXTurn] = useState(true)
  const [last, setLast] = useState(null)
  const [winner, setWinner] = useState(null)
  const [level, setLevel] = useState('hard')

  if (!visible) return null

  const checkWin = (b, r, c) => {
    for (let [dx, dy] of AI.dirs) {
      let cnt = 1
      for (let i = 1; i < 5; i++)
        if (b[r + dx * i]?.[c + dy * i] === b[r][c]) cnt++
        else break
      for (let i = 1; i < 5; i++)
        if (b[r - dx * i]?.[c - dy * i] === b[r][c]) cnt++
        else break
      if (cnt >= 5) return true
    }
    return false
  }

  const resetGame = () => {
    setBoard(emptyBoard)
    setXTurn(true)
    setWinner(null)
    setLast(null)
  }

  const clickCell = (r, c) => {
    if (!xTurn || board[r][c] || winner) return

    const b = board.map(row => [...row])
    b[r][c] = 'X'
    setBoard(b)
    setLast({ r, c })
    AI.rememberHumanMove(r, c)

    if (checkWin(b, r, c)) {
      setWinner('X')
      return
    }

    setXTurn(false)
    setTimeout(() => aiMove(b), AI_DELAY[level])
  }

  const aiMove = (b) => {
    if (winner) return

    const { r, c } = AI.bestMove(b, level)
    const nb = b.map(row => [...row])
    nb[r][c] = 'O'

    setBoard(nb)
    setLast({ r, c })

    if (checkWin(nb, r, c)) setWinner('O')
    else setXTurn(true)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15,23,42,0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
    }}>
      <div style={{ width: 560, background: '#0f172a', borderRadius: 20, padding: 16 }}>
        <div className="d-flex justify-content-between mb-2">
          <b style={{ color: '#e5e7eb' }}>🤖 Caro AI – Zebra Rebuild</b>
          <CButton size="sm" onClick={() => setVisible(false)}>
            <CIcon icon={cilX} />
          </CButton>
        </div>

        {/* LEVEL */}
        {['easy', 'medium', 'hard'].map(l => (
          <CButton
            key={l}
            size="sm"
            className="me-2"
            color={level === l ? 'info' : 'secondary'}
            onClick={() => {
              if (l !== level) {
                setLevel(l)
                resetGame()
              }
            }}
          >
            {l.toUpperCase()}
          </CButton>
        ))}

        <div style={{ margin: '8px 0', color: winner ? '#22c55e' : '#93c5fd' }}>
          {winner ? `🎉 ${winner} thắng!` : `Lượt: ${xTurn ? 'X (Bạn)' : 'O (AI)'}`}
        </div>

        {/* BOARD */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${SIZE},1fr)`,
          gap: 2,
          background: '#334155',
          padding: 6,
          borderRadius: 14,
        }}>
          {board.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                onClick={() => clickCell(r, c)}
                style={{
                  width: 30,
                  height: 30,
                  background: last?.r === r && last?.c === c ? '#fde68a' : '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  color: cell === 'X' ? '#ef4444' : '#2563eb',
                  borderRadius: 4,
                }}
              >
                {cell}
              </div>
            ))
          )}
        </div>

        <CButton className="w-100 mt-3" onClick={resetGame}>
          <CIcon icon={cilReload} className="me-2" />
          Chơi lại
        </CButton>
      </div>
    </div>
  )
}

export default CaroGame
