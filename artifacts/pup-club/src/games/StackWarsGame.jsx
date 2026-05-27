import { useState, useEffect, useRef, useCallback } from "react"

// ─── Constants ────────────────────────────────────────────────────────────────
const W = 10, H = 20, CS = 28

const PIECES = [
  { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#00CFCF' }, // I
  { shape: [[1,1],[1,1]],                              color: '#F0C040' }, // O
  { shape: [[0,1,0],[1,1,1],[0,0,0]],                  color: '#AA44CC' }, // T
  { shape: [[0,1,1],[1,1,0],[0,0,0]],                  color: '#44CC44' }, // S
  { shape: [[1,1,0],[0,1,1],[0,0,0]],                  color: '#EE3333' }, // Z
  { shape: [[1,0,0],[1,1,1],[0,0,0]],                  color: '#4488EE' }, // J
  { shape: [[0,0,1],[1,1,1],[0,0,0]],                  color: '#EE8833' }, // L
]

// Points per line clear × level multiplier
const POINTS   = [0, 100, 300, 500, 800]
// Garbage sent on clear: 1→0, 2→1, 3→2, 4→4
const GARBAGE_OUT = [0, 0, 1, 2, 4]
// Drop interval per level (ms)
const SPEEDS = [750, 660, 570, 480, 380, 280, 200, 150, 100, 80]

// ─── Pure game helpers ────────────────────────────────────────────────────────
const emptyBoard = () => Array(H).fill(0).map(() => Array(W).fill(0))
const randPiece  = () => {
  const p = PIECES[Math.floor(Math.random() * 7)]
  return { shape: p.shape.map(r => [...r]), color: p.color, x: 3, y: 0 }
}
const rotateCW = s => s[0].map((_, i) => s.map(r => r[i]).reverse())

const fits = (board, shape, x, y) => {
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue
      const nx = x + c, ny = y + r
      if (nx < 0 || nx >= W || ny >= H) return false
      if (ny >= 0 && board[ny][nx])      return false
    }
  return true
}

// ─── Canvas drawing helpers ───────────────────────────────────────────────────
function drawCell(ctx, col, row, color) {
  const x = col * CS + 1, y = row * CS + 1, s = CS - 2
  ctx.fillStyle = color
  ctx.fillRect(x, y, s, s)
  // highlight
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ctx.fillRect(x, y, s, 3)
  ctx.fillRect(x, y, 3, s)
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fillRect(x, y + s - 2, s, 2)
  ctx.fillRect(x + s - 2, y, 2, s)
}

function renderBoard(ctx, g) {
  const PW = W * CS, PH = H * CS
  ctx.fillStyle = '#080808'
  ctx.fillRect(0, 0, PW, PH)

  // grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  ctx.lineWidth = 0.5
  for (let x = 0; x <= W; x++) {
    ctx.beginPath(); ctx.moveTo(x*CS, 0); ctx.lineTo(x*CS, PH); ctx.stroke()
  }
  for (let y = 0; y <= H; y++) {
    ctx.beginPath(); ctx.moveTo(0, y*CS); ctx.lineTo(PW, y*CS); ctx.stroke()
  }

  // locked cells
  g.board.forEach((row, r) => row.forEach((cell, c) => { if (cell) drawCell(ctx, c, r, cell) }))

  if (g.piece) {
    // ghost
    let gy = g.piece.y
    while (fits(g.board, g.piece.shape, g.piece.x, gy + 1)) gy++
    g.piece.shape.forEach((row, r) => row.forEach((cell, c) => {
      if (!cell) return
      const gr = gy + r, gc = g.piece.x + c
      if (gr >= 0 && !g.board[gr]?.[gc]) {
        ctx.fillStyle = 'rgba(255,255,255,0.09)'
        ctx.fillRect(gc*CS+1, gr*CS+1, CS-2, CS-2)
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'
        ctx.lineWidth = 0.5
        ctx.strokeRect(gc*CS+1.5, gr*CS+1.5, CS-3, CS-3)
      }
    }))
    // active piece
    g.piece.shape.forEach((row, r) => row.forEach((cell, c) => {
      if (cell && g.piece.y + r >= 0) drawCell(ctx, g.piece.x + c, g.piece.y + r, g.piece.color)
    }))
  }

  // overlay when not playing
  if (g.status !== 'playing') {
    ctx.fillStyle = 'rgba(0,0,0,0.72)'
    ctx.fillRect(0, 0, PW, PH)
  }
}

function renderNext(ctx, piece) {
  const SIZE = 64
  ctx.clearRect(0, 0, SIZE, SIZE)
  if (!piece) return
  const { shape, color } = piece
  const bw = shape[0].length, bh = shape.length
  const cs = Math.min(13, Math.floor(54 / Math.max(bw, bh)))
  const ox = Math.floor((SIZE - bw * cs) / 2)
  const oy = Math.floor((SIZE - bh * cs) / 2)
  shape.forEach((row, r) => row.forEach((cell, c) => {
    if (!cell) return
    ctx.fillStyle = color
    ctx.fillRect(ox + c*cs, oy + r*cs, cs-1, cs-1)
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(ox + c*cs, oy + r*cs, cs-1, 2)
  }))
}

// ─── Main component ───────────────────────────────────────────────────────────
/**
 * GameBoard — self-contained Tetris engine.
 *
 * Props (all optional for standalone play):
 *   onGarbage(rows)      — called when you clear lines; pass rows count to opponent via Supabase
 *   onSnapshot(board)    — called every ~500ms with compact board state for opponent minimap
 *   onDied()             — called when board tops out
 *   incomingGarbage      — number of garbage rows to apply (from Supabase channel)
 *   disabled             — freeze input (used during countdown)
 */
export function GameBoard({ onGarbage, onSnapshot, onDied, incomingGarbage = 0, disabled = false }) {
  const canvasRef    = useRef(null)
  const nextRef      = useRef(null)
  const gameRef      = useRef(null)
  const intervalRef  = useRef(null)
  const snapshotRef  = useRef(null)
  const touchRef     = useRef(null)
  const [ui, setUi]  = useState({ score:0, lines:0, level:1, status:'idle', pendingGarbage:0 })

  // ── Drawing ────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const g = gameRef.current
    const canvas = canvasRef.current
    if (!canvas || !g) return
    renderBoard(canvas.getContext('2d'), g)
    const nc = nextRef.current
    if (nc) renderNext(nc.getContext('2d'), g.nextPiece)
  }, [])

  // ── Spawn next piece ───────────────────────────────────────────────────────
  const spawn = useCallback(() => {
    const g = gameRef.current
    const piece = g.nextPiece || randPiece()
    g.nextPiece = randPiece()
    if (!fits(g.board, piece.shape, piece.x, 0)) {
      g.status = 'over'
      clearInterval(intervalRef.current)
      clearInterval(snapshotRef.current)
      setUi(u => ({ ...u, status:'over' }))
      draw()
      onDied?.()
      return
    }
    g.piece = piece
    draw()
  }, [draw, onDied])

  // ── Lock piece + clear lines ───────────────────────────────────────────────
  const lock = useCallback(() => {
    const g = gameRef.current
    if (!g?.piece) return

    // Place piece
    const b = g.board.map(r => [...r])
    g.piece.shape.forEach((row, r) => row.forEach((cell, c) => {
      if (cell && g.piece.y + r >= 0) b[g.piece.y + r][g.piece.x + c] = g.piece.color
    }))
    g.piece = null

    // Clear full lines
    const kept    = b.filter(row => row.some(v => !v))
    const cleared = H - kept.length
    const newBoard = [...Array(cleared).fill(0).map(() => Array(W).fill(0)), ...kept]

    if (cleared > 0) {
      g.score += POINTS[cleared] * g.level
      g.lines += cleared
      const newLevel = Math.floor(g.lines / 10) + 1
      if (newLevel !== g.level) {
        g.level = newLevel
        clearInterval(intervalRef.current)
        intervalRef.current = setInterval(tickFn, SPEEDS[Math.min(newLevel - 1, 9)])
      }
      // Fire garbage callback for Supabase
      const gOut = GARBAGE_OUT[cleared]
      if (gOut > 0) onGarbage?.(gOut)
    } else {
      // Apply any pending incoming garbage
      const incoming = g.pendingGarbage
      if (incoming > 0) {
        const garbageRows = Array(incoming).fill(0).map(() => {
          const row = Array(W).fill('#2a2a22')
          row[Math.floor(Math.random() * W)] = 0
          return row
        })
        newBoard.splice(0, incoming)
        newBoard.push(...garbageRows)
        g.pendingGarbage = 0
      }
    }

    g.board = newBoard
    setUi({ score:g.score, lines:g.lines, level:g.level, status:g.status, pendingGarbage:g.pendingGarbage })
    spawn()
  }, [spawn, onGarbage])

  // ── Game tick ──────────────────────────────────────────────────────────────
  function tickFn() {
    const g = gameRef.current
    if (!g || g.status !== 'playing' || !g.piece) return
    if (fits(g.board, g.piece.shape, g.piece.x, g.piece.y + 1)) {
      g.piece = { ...g.piece, y: g.piece.y + 1 }
      drawRef.current()
    } else {
      lockRef.current()
    }
  }
  // Stable refs so setInterval closure is never stale
  const drawRef = useRef(draw); drawRef.current = draw
  const lockRef = useRef(lock); lockRef.current = lock

  // ── Player actions ─────────────────────────────────────────────────────────
  const moveLeft = useCallback(() => {
    const g = gameRef.current
    if (!g?.piece || g.status !== 'playing' || disabled) return
    if (fits(g.board, g.piece.shape, g.piece.x - 1, g.piece.y)) {
      g.piece = { ...g.piece, x: g.piece.x - 1 }; draw()
    }
  }, [draw, disabled])

  const moveRight = useCallback(() => {
    const g = gameRef.current
    if (!g?.piece || g.status !== 'playing' || disabled) return
    if (fits(g.board, g.piece.shape, g.piece.x + 1, g.piece.y)) {
      g.piece = { ...g.piece, x: g.piece.x + 1 }; draw()
    }
  }, [draw, disabled])

  const rotatePiece = useCallback(() => {
    const g = gameRef.current
    if (!g?.piece || g.status !== 'playing' || disabled) return
    const rot = rotateCW(g.piece.shape)
    for (const kick of [0, 1, -1, 2, -2]) {
      if (fits(g.board, rot, g.piece.x + kick, g.piece.y)) {
        g.piece = { ...g.piece, shape: rot, x: g.piece.x + kick }
        draw(); return
      }
    }
  }, [draw, disabled])

  const softDrop = useCallback(() => {
    const g = gameRef.current
    if (!g?.piece || g.status !== 'playing' || disabled) return
    if (fits(g.board, g.piece.shape, g.piece.x, g.piece.y + 1)) {
      g.piece = { ...g.piece, y: g.piece.y + 1 }; draw()
    } else { lockRef.current() }
  }, [draw, disabled])

  const hardDrop = useCallback(() => {
    const g = gameRef.current
    if (!g?.piece || g.status !== 'playing' || disabled) return
    let drop = 0
    while (fits(g.board, g.piece.shape, g.piece.x, g.piece.y + drop + 1)) drop++
    g.piece = { ...g.piece, y: g.piece.y + drop }
    lockRef.current()
  }, [disabled])

  // ── Start game ─────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    clearInterval(intervalRef.current)
    clearInterval(snapshotRef.current)
    gameRef.current = {
      board: emptyBoard(), piece: null, nextPiece: randPiece(),
      score: 0, lines: 0, level: 1, status: 'playing', pendingGarbage: 0,
    }
    setUi({ score:0, lines:0, level:1, status:'playing', pendingGarbage:0 })
    spawn()
    intervalRef.current = setInterval(tickFn, SPEEDS[0])
    // Snapshot ticker for opponent minimap
    snapshotRef.current = setInterval(() => {
      const g = gameRef.current
      if (g?.status === 'playing') onSnapshot?.(g.board)
    }, 500)
  }, [spawn, onSnapshot])

  // ── Handle incoming garbage from Supabase ──────────────────────────────────
  useEffect(() => {
    const g = gameRef.current
    if (!g || !incomingGarbage) return
    g.pendingGarbage = (g.pendingGarbage || 0) + incomingGarbage
    setUi(u => ({ ...u, pendingGarbage: g.pendingGarbage }))
  }, [incomingGarbage])

  // ── Keyboard controls ──────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = e => {
      if (gameRef.current?.status !== 'playing') return
      const map = {
        ArrowLeft:  () => { e.preventDefault(); moveLeft()    },
        ArrowRight: () => { e.preventDefault(); moveRight()   },
        ArrowDown:  () => { e.preventDefault(); softDrop()    },
        ArrowUp:    () => { e.preventDefault(); rotatePiece() },
        x:          () => { e.preventDefault(); rotatePiece() },
        ' ':        () => { e.preventDefault(); hardDrop()    },
      }
      map[e.key]?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moveLeft, moveRight, softDrop, rotatePiece, hardDrop])

  // ── Touch controls ─────────────────────────────────────────────────────────
  const onTouchStart = e => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }
  }
  const onTouchEnd = e => {
    if (!touchRef.current) return
    const dx = e.changedTouches[0].clientX - touchRef.current.x
    const dy = e.changedTouches[0].clientY - touchRef.current.y
    const dt = Date.now() - touchRef.current.t
    const ax = Math.abs(dx), ay = Math.abs(dy)
    if      (ax < 15 && ay < 15 && dt < 250) rotatePiece()
    else if (ax > ay && ax > 20)              dx > 0 ? moveRight() : moveLeft()
    else if (dy > 20 && ay > ax)              ay > 90 ? hardDrop() : softDrop()
    touchRef.current = null
  }

  // ── Redraw on UI change & cleanup ─────────────────────────────────────────
  useEffect(() => { draw() }, [ui, draw])
  useEffect(() => () => {
    clearInterval(intervalRef.current)
    clearInterval(snapshotRef.current)
  }, [])

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, userSelect:'none', padding:'1rem 0' }}>

      {/* Score strip */}
      <div style={{ display:'flex', gap:10, width:'100%', maxWidth:360 }}>
        {[['Score', ui.score.toLocaleString()], ['Level', ui.level], ['Lines', ui.lines]].map(([label, val]) => (
          <div key={label} style={{ flex:1, background:'var(--color-background-secondary)', borderRadius:'var(--border-radius-md)', padding:'8px 10px', textAlign:'center' }}>
            <div style={{ fontSize:11, color:'var(--color-text-tertiary)', marginBottom:2 }}>{label}</div>
            <div style={{ fontSize:19, fontWeight:500, color:'var(--color-text-primary)', fontFamily:'var(--font-mono)' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Board + sidebar */}
      <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
        <div
          onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
          style={{ border:'0.5px solid var(--color-border-secondary)', borderRadius:'var(--border-radius-md)', overflow:'hidden', touchAction:'none' }}
        >
          <canvas ref={canvasRef} width={W * CS} height={H * CS} />
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:8, width:76 }}>
          {/* Next piece */}
          <div style={{ background:'var(--color-background-secondary)', borderRadius:'var(--border-radius-md)', padding:8, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'var(--color-text-tertiary)', marginBottom:4 }}>Next</div>
            <canvas ref={nextRef} width={64} height={64} style={{ display:'block', margin:'0 auto' }} />
          </div>

          {/* Incoming garbage warning */}
          {ui.pendingGarbage > 0 && (
            <div style={{ background:'var(--color-background-danger)', borderRadius:'var(--border-radius-md)', padding:'6px 8px', textAlign:'center' }}>
              <div style={{ fontSize:10, color:'var(--color-text-danger)', marginBottom:2 }}>Incoming</div>
              <div style={{ fontSize:18, fontWeight:500, color:'var(--color-text-danger)', fontFamily:'var(--font-mono)' }}>{ui.pendingGarbage}</div>
            </div>
          )}

          {/* Controls hint */}
          <div style={{ fontSize:10, color:'var(--color-text-tertiary)', lineHeight:1.9, padding:'2px' }}>
            <div>← → Move</div>
            <div>↑ Rotate</div>
            <div>↓ Soft drop</div>
            <div>Space Hard</div>
            <div>Tap = rotate</div>
            <div>Swipe = move</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      {(ui.status === 'idle' || ui.status === 'over') && (
        <div style={{ textAlign:'center', marginTop:4 }}>
          {ui.status === 'over' && (
            <div style={{ fontSize:14, color:'var(--color-text-danger)', marginBottom:10 }}>
              Game over — {ui.score.toLocaleString()} pts
            </div>
          )}
          <button onClick={startGame} style={{ padding:'10px 28px', fontSize:15, fontWeight:500 }}>
            {ui.status === 'idle' ? 'Start game ↗' : 'Play again ↗'}
          </button>
        </div>
      )}

      {/* Mobile D-pad */}
      {ui.status === 'playing' && (
        <div style={{ display:'flex', gap:6, marginTop:2 }}>
          <button onClick={moveLeft}    style={{ padding:'10px 16px', fontSize:18 }}>←</button>
          <button onClick={rotatePiece} style={{ padding:'10px 13px', fontSize:15 }}>↺</button>
          <button onClick={softDrop}    style={{ padding:'10px 13px', fontSize:14 }}>↓</button>
          <button onClick={hardDrop}    style={{ padding:'10px 11px', fontSize:12, fontWeight:500 }}>↓↓</button>
          <button onClick={moveRight}   style={{ padding:'10px 16px', fontSize:18 }}>→</button>
        </div>
      )}
    </div>
  )
}

// ─── Standalone demo wrapper (remove in production) ───────────────────────────
export default function StackWarsDemo() {
  const [garbage, setGarbage] = useState(0)

  const handleGarbage = (rows) => {
    console.log(`[Stack Wars] Would send ${rows} garbage rows to opponent via Supabase`)
    // In production:
    // supabase.channel(roomId).send({ type: 'broadcast', event: 'garbage', payload: { rows, from: myId } })
  }

  const handleSnapshot = (board) => {
    // In production, send compact snapshot to Supabase for opponent minimap
    // supabase.channel(roomId).send({ type: 'broadcast', event: 'snapshot', payload: { board: packBoard(board), from: myId } })
  }

  // Simulate incoming garbage (for testing — replace with Supabase subscription)
  const simulateGarbage = () => setGarbage(g => g + 2)
  useEffect(() => { if (garbage > 0) setTimeout(() => setGarbage(0), 100) }, [garbage])

  return (
    <div>
      <GameBoard
        onGarbage={handleGarbage}
        onSnapshot={handleSnapshot}
        onDied={() => console.log('[Stack Wars] Player died')}
        incomingGarbage={garbage}
      />
      <div style={{ textAlign:'center', marginTop:4 }}>
        <button onClick={simulateGarbage} style={{ fontSize:12, padding:'6px 14px', opacity:0.6 }}>
          Simulate 2 incoming garbage rows
        </button>
      </div>
    </div>
  )
}
