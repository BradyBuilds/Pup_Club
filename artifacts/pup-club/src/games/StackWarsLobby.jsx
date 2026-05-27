/**
 * StackWarsLobby.jsx
 * Drop into pup-club/src/pages/StackWars.jsx
 *
 * Usage:
 *   import StackWarsLobby from './StackWarsLobby'
 *   // Add route: /hub/stack-wars  →  <StackWarsLobby />
 *
 * Requires:
 *   - supabase client from '../lib/supabase'
 *   - useStore() with { patron, venue } from '../store/useStore'
 *   - GameBoard exported from './StackWarsGame' (the engine we built)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { GameBoard } from './StackWarsGame'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const COLORS = ['#FF2D78','#00F5FF','#39FF14','#CC44FF','#FFE600','#FF8C00','#4D8AFF']

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array(4).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// Compact board serialiser for opponent snapshots (10×20 → 200 booleans → base64-ish)
function packBoard(board) {
  let bits = ''
  board.forEach(row => row.forEach(cell => bits += cell ? '1' : '0'))
  // group into 6-bit chunks, encode as printable char
  const result = []
  for (let i = 0; i < bits.length; i += 6) {
    result.push(String.fromCharCode(48 + parseInt(bits.slice(i, i + 6).padEnd(6, '0'), 2)))
  }
  return result.join('')
}

function unpackBoard(packed) {
  if (!packed) return Array(20).fill(0).map(() => Array(10).fill(0))
  let bits = ''
  for (const ch of packed) bits += (ch.charCodeAt(0) - 48).toString(2).padStart(6, '0')
  const board = []
  for (let r = 0; r < 20; r++) {
    board.push(Array(10).fill(0).map((_, c) => bits[r * 10 + c] === '1' ? '#2a2a22' : 0))
  }
  return board
}

// ─── SQL migration (run once in Supabase) ─────────────────────────────────────
/*
create table if not exists stack_wars_rooms (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  venue_id    uuid references venues(id),
  host_id     text not null,
  status      text default 'waiting',   -- waiting | countdown | playing | finished
  created_at  timestamptz default now()
);
create index on stack_wars_rooms(code);
create index on stack_wars_rooms(status);
-- Auto-clean rooms older than 2 hours (run as cron or pg_cron)
-- delete from stack_wars_rooms where created_at < now() - interval '2 hours';
*/

// ─── Opponent mini-board ──────────────────────────────────────────────────────
function OpponentMini({ player, myColor }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 50, H = 100, CW = 5, CH = 5

    ctx.fillStyle = '#050008'
    ctx.fillRect(0, 0, W, H)

    const board = unpackBoard(player.snapshot)
    board.forEach((row, r) => row.forEach((cell, c) => {
      if (!cell) return
      ctx.fillStyle = player.color || '#333'
      ctx.fillRect(c * CW, r * CH, CW - 0.5, CH - 0.5)
    }))

    // garbage warning overlay
    if (player.pendingGarbage > 0) {
      ctx.fillStyle = `rgba(255, 45, 120, ${Math.min(player.pendingGarbage * 0.15, 0.5)})`
      ctx.fillRect(0, 0, W, H)
    }
  }, [player.snapshot, player.pendingGarbage, player.color])

  const isEliminated = player.died

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      opacity: isEliminated ? 0.35 : 1, transition: 'opacity .4s',
    }}>
      <div style={{
        border: `1px solid ${player.color || '#FF2D78'}55`,
        borderRadius: 4, overflow: 'hidden', position: 'relative',
        boxShadow: isEliminated ? 'none' : `0 0 8px ${player.color || '#FF2D78'}33`,
      }}>
        <canvas ref={canvasRef} width={50} height={100} />
        {isEliminated && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'rgba(5,0,8,0.7)',
          }}>
            <span style={{ fontSize: 9, color: '#FF2D78', letterSpacing: '.1em', fontFamily: 'Courier New' }}>DEAD</span>
          </div>
        )}
        {player.pendingGarbage > 0 && !isEliminated && (
          <div style={{
            position: 'absolute', bottom: 2, right: 2, fontSize: 9,
            color: '#FF2D78', fontFamily: 'Courier New', fontWeight: 700,
            textShadow: '0 0 4px #FF2D78',
          }}>
            +{player.pendingGarbage}
          </div>
        )}
      </div>
      <div style={{ fontSize: 9, color: player.color || '#fff', letterSpacing: '.06em', fontFamily: 'Courier New', maxWidth: 54, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {player.name}
      </div>
      <div style={{ fontSize: 10, color: '#fff', fontFamily: 'Courier New', fontWeight: 700, letterSpacing: '.04em' }}>
        {(player.score || 0).toLocaleString()}
      </div>
    </div>
  )
}

// ─── Shared styled primitives ─────────────────────────────────────────────────
const sw = {
  wrap: { fontFamily: "'Courier New', monospace", display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '1rem 0', minHeight: 480 },
  title: { fontSize: 22, fontWeight: 700, letterSpacing: '.2em', color: '#FF2D78', textShadow: '0 0 8px #FF2D78, 0 0 22px #FF2D78aa', textAlign: 'center' },
  sub: { fontSize: 9, letterSpacing: '.25em', color: '#FF2D7855', textAlign: 'center' },
  card: { width: '100%', maxWidth: 340, border: '1px solid #FF2D7844', borderRadius: 4, background: '#0d0010', padding: '14px 16px' },
  cardTitle: { fontSize: 9, letterSpacing: '.18em', color: '#FF2D7866', textTransform: 'uppercase', marginBottom: 10 },
  btn: (variant = 'pink') => {
    const variants = {
      pink:  { borderColor: '#FF2D78', color: '#FF2D78', textShadow: '0 0 6px #FF2D78aa', boxShadow: '0 0 10px #FF2D7833' },
      cyan:  { borderColor: '#00F5FF', color: '#00F5FF', textShadow: '0 0 6px #00F5FFaa', boxShadow: '0 0 10px #00F5FF22' },
      green: { borderColor: '#39FF14', color: '#39FF14', textShadow: '0 0 6px #39FF14aa', boxShadow: '0 0 10px #39FF1422' },
      ghost: { borderColor: '#ffffff22', color: '#ffffff44', textShadow: 'none', boxShadow: 'none' },
    }
    return {
      width: '100%', maxWidth: 340, background: '#0d0010', border: '1px solid', borderRadius: 4,
      fontFamily: "'Courier New', monospace", fontSize: 13, fontWeight: 700, letterSpacing: '.12em',
      padding: '11px', cursor: 'pointer', transition: 'all .15s', marginTop: 6,
      ...variants[variant],
    }
  },
  codeDisplay: {
    fontSize: 32, fontWeight: 700, letterSpacing: '.35em', color: '#00F5FF',
    textShadow: '0 0 10px #00F5FF, 0 0 24px #00F5FF88', textAlign: 'center',
    padding: '10px 0', border: '1px solid #00F5FF44', borderRadius: 4,
    background: '#000d14', margin: '8px 0',
  },
}

// ─── Phase: Landing ───────────────────────────────────────────────────────────
function PhaseLanding({ onCreate, onJoin }) {
  return (
    <div style={sw.wrap}>
      <div style={sw.title}>STACK WARS</div>
      <div style={sw.sub}>MULTIPLAYER · UP TO 4 PLAYERS</div>

      <div style={sw.card}>
        <div style={sw.cardTitle}>Host a game</div>
        <div style={{ fontSize: 11, color: '#ffffff44', lineHeight: 1.6, marginBottom: 4 }}>
          Create a room and share the code with friends.
        </div>
        <button style={sw.btn('pink')} onClick={onCreate}>▶ CREATE ROOM</button>
      </div>

      <div style={sw.card}>
        <div style={sw.cardTitle}>Join a game</div>
        <div style={{ fontSize: 11, color: '#ffffff44', lineHeight: 1.6, marginBottom: 4 }}>
          Got a 4-letter code from the host?
        </div>
        <button style={sw.btn('cyan')} onClick={onJoin}>▶ ENTER CODE</button>
      </div>
    </div>
  )
}

// ─── Phase: Join (enter code) ─────────────────────────────────────────────────
function PhaseJoin({ onConfirm, onBack, error }) {
  const [code, setCode] = useState('')

  return (
    <div style={sw.wrap}>
      <div style={sw.title}>JOIN GAME</div>
      <div style={sw.sub}>ENTER THE ROOM CODE</div>

      <div style={sw.card}>
        <div style={sw.cardTitle}>Room code</div>
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
          onKeyDown={e => e.key === 'Enter' && code.length === 4 && onConfirm(code)}
          maxLength={4}
          placeholder="ABCD"
          autoFocus
          style={{
            width: '100%', background: '#000d14', border: `1px solid ${error ? '#FF2D78' : '#00F5FF66'}`,
            borderRadius: 4, color: '#00F5FF', fontFamily: "'Courier New', monospace",
            fontSize: 28, fontWeight: 700, letterSpacing: '.35em', textAlign: 'center',
            padding: '10px', outline: 'none', textTransform: 'uppercase',
            textShadow: '0 0 8px #00F5FFaa',
          }}
        />
        {error && <div style={{ fontSize: 10, color: '#FF2D78', marginTop: 6, letterSpacing: '.08em' }}>{error}</div>}
        <button
          style={{ ...sw.btn('cyan'), opacity: code.length < 4 ? 0.4 : 1 }}
          onClick={() => code.length === 4 && onConfirm(code)}
        >
          ▶ JOIN ROOM
        </button>
        <button style={sw.btn('ghost')} onClick={onBack}>← BACK</button>
      </div>
    </div>
  )
}

// ─── Phase: Lobby ─────────────────────────────────────────────────────────────
function PhaseLobby({ code, players, myId, isHost, onStart, onReady, onLeave }) {
  const me = players.find(p => p.id === myId)
  const allReady = players.filter(p => !p.isHost).every(p => p.isReady)
  const canStart = isHost && players.length >= 2 && allReady
  const slots = 4

  return (
    <div style={sw.wrap}>
      <div style={sw.title}>STACK WARS</div>

      <div style={sw.card}>
        <div style={sw.cardTitle}>Room code — share with friends</div>
        <div style={sw.codeDisplay}>{code}</div>
        <div style={{ fontSize: 9, color: '#ffffff33', textAlign: 'center', letterSpacing: '.08em' }}>
          They enter this on their phone
        </div>
      </div>

      <div style={{ ...sw.card, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={sw.cardTitle}>Players ({players.length}/{slots})</div>

        {players.map(p => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            border: '1px solid #ffffff12', borderRadius: 4, padding: '9px 12px', background: '#080008',
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, boxShadow: `0 0 6px ${p.color}88`, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 12, color: '#fff', letterSpacing: '.06em' }}>
              {p.name}
              {p.id === myId && <span style={{ fontSize: 9, color: '#FF2D7866', marginLeft: 5 }}>(you)</span>}
            </div>
            {p.isHost
              ? <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: '#FFE600', border: '1px solid #FFE60044', background: '#1a1400', padding: '2px 8px', borderRadius: 2 }}>HOST</span>
              : p.isReady
                ? <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: '#39FF14', border: '1px solid #39FF1444', background: '#001400', padding: '2px 8px', borderRadius: 2 }}>READY</span>
                : <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: '#ffffff33', border: '1px solid #ffffff18', padding: '2px 8px', borderRadius: 2 }}>WAIT</span>
            }
          </div>
        ))}

        {Array(slots - players.length).fill(0).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px dashed #ffffff0a', borderRadius: 4, padding: '9px 12px', opacity: .3 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', border: '1px dashed #ffffff33' }} />
            <div style={{ flex: 1, fontSize: 11, color: '#ffffff22', letterSpacing: '.08em' }}>Waiting for player…</div>
            <span style={{ fontSize: 9, color: '#ffffff18', letterSpacing: '.12em' }}>OPEN</span>
          </div>
        ))}
      </div>

      {!isHost && (
        <button style={{ ...sw.btn(me?.isReady ? 'ghost' : 'green'), maxWidth: 340 }} onClick={onReady}>
          {me?.isReady ? '✓ READY — CANCEL' : '▶ READY UP'}
        </button>
      )}

      {isHost && (
        <button
          style={{ ...sw.btn('pink'), maxWidth: 340, opacity: canStart ? 1 : 0.35, cursor: canStart ? 'pointer' : 'default' }}
          onClick={canStart ? onStart : undefined}
        >
          {canStart ? '▶ START GAME' : players.length < 2 ? 'NEED MORE PLAYERS' : 'WAITING FOR READY…'}
        </button>
      )}

      <button style={{ ...sw.btn('ghost'), maxWidth: 340 }} onClick={onLeave}>← LEAVE LOBBY</button>
    </div>
  )
}

// ─── Phase: Countdown ─────────────────────────────────────────────────────────
function PhaseCountdown({ count, players }) {
  return (
    <div style={{ ...sw.wrap, justifyContent: 'center', minHeight: 500 }}>
      <div style={sw.title}>STACK WARS</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '30px 0' }}>
        <div style={{ fontSize: 10, letterSpacing: '.25em', color: '#FF2D7866' }}>GAME STARTS IN</div>
        <div style={{ fontSize: 88, fontWeight: 700, color: '#FF2D78', textShadow: '0 0 20px #FF2D78, 0 0 50px #FF2D78aa', lineHeight: 1 }}>
          {count}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {players.map(p => (
            <div key={p.id} style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, boxShadow: `0 0 8px ${p.color}` }} />
          ))}
        </div>
        <div style={{ fontSize: 10, letterSpacing: '.18em', color: '#ffffff33', marginTop: 4 }}>
          {players.length} PLAYERS CONNECTED
        </div>
      </div>
    </div>
  )
}

// ─── Phase: Results ───────────────────────────────────────────────────────────
function PhaseResults({ players, onRematch, onExit }) {
  const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0))
  const medals = ['🥇', '🥈', '🥉', '  ']
  const xpRewards = [320, 220, 160, 80]

  return (
    <div style={sw.wrap}>
      <div style={sw.title}>GAME OVER</div>
      <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '.15em', color: '#FFE600', textShadow: '0 0 10px #FFE600', textAlign: 'center' }}>
        ★ {sorted[0]?.name} WINS ★
      </div>

      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map((p, i) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 4,
            background: i === 0 ? '#1a1200' : '#080008',
            border: `1px solid ${i === 0 ? '#FFE60044' : '#ffffff0a'}`,
          }}>
            <div style={{ fontSize: 16, minWidth: 24, fontFamily: 'Courier New' }}>{medals[i] || i + 1}</div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, boxShadow: `0 0 5px ${p.color}`, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 12, color: '#fff', letterSpacing: '.06em' }}>{p.name}</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'Courier New' }}>{(p.score || 0).toLocaleString()}</div>
              <div style={{ fontSize: 9, color: '#CC44FF', border: '1px solid #CC44FF44', background: '#0d001a', padding: '2px 7px', borderRadius: 2, fontWeight: 700 }}>
                +{xpRewards[i] || 40} XP
              </div>
            </div>
          </div>
        ))}
      </div>

      <button style={sw.btn('green')} onClick={onRematch}>▶ REMATCH</button>
      <button style={sw.btn('ghost')} onClick={onExit}>← EXIT TO HUB</button>
    </div>
  )
}

// ─── Phase: Playing ───────────────────────────────────────────────────────────
function PhasePlaying({ myId, players, channel, onGameOver }) {
  const [opponents, setOpponents] = useState(
    players.filter(p => p.id !== myId).map(p => ({ ...p, snapshot: null, score: 0, died: false, pendingGarbage: 0 }))
  )
  const [incomingGarbage, setIncomingGarbage] = useState(0)
  const snapshotInterval = useRef(null)

  // Subscribe to channel events during play
  useEffect(() => {
    const sub = channel
      .on('broadcast', { event: 'garbage' }, ({ payload }) => {
        if (payload.to === myId || payload.to === 'all') {
          setIncomingGarbage(payload.rows)
          setTimeout(() => setIncomingGarbage(0), 100)
        }
      })
      .on('broadcast', { event: 'snapshot' }, ({ payload }) => {
        setOpponents(prev => prev.map(o =>
          o.id === payload.from
            ? { ...o, snapshot: payload.board, score: payload.score, pendingGarbage: payload.pendingGarbage || 0 }
            : o
        ))
      })
      .on('broadcast', { event: 'player_died' }, ({ payload }) => {
        setOpponents(prev => prev.map(o => o.id === payload.from ? { ...o, died: true } : o))
        const alive = opponents.filter(o => !o.died && o.id !== payload.from)
        if (alive.length === 0) {
          // We're the last one standing
          setTimeout(() => onGameOver('win'), 500)
        }
      })

    return () => { channel.unsubscribe() }
  }, [channel, myId, opponents, onGameOver])

  const handleGarbage = useCallback((rows) => {
    // Target a random alive opponent
    const alive = opponents.filter(o => !o.died)
    if (!alive.length) return
    const target = alive[Math.floor(Math.random() * alive.length)]
    channel.send({ type: 'broadcast', event: 'garbage', payload: { rows, from: myId, to: target.id } })
  }, [channel, myId, opponents])

  const handleSnapshot = useCallback((board) => {
    channel.send({
      type: 'broadcast', event: 'snapshot',
      payload: { board: packBoard(board), from: myId, score: 0, pendingGarbage: 0 },
    })
  }, [channel, myId])

  const handleDied = useCallback(() => {
    channel.send({ type: 'broadcast', event: 'player_died', payload: { from: myId } })
    onGameOver('lose')
  }, [channel, myId, onGameOver])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '0.5rem 0' }}>
      {/* Opponent mini-boards */}
      {opponents.length > 0 && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {opponents.map(o => <OpponentMini key={o.id} player={o} />)}
        </div>
      )}

      {/* Main board */}
      <GameBoard
        onGarbage={handleGarbage}
        onSnapshot={handleSnapshot}
        onDied={handleDied}
        incomingGarbage={incomingGarbage}
      />
    </div>
  )
}

// ─── Root component ───────────────────────────────────────────────────────────
export default function StackWarsLobby() {
  const { patron, venue } = useStore()
  const [phase, setPhase] = useState('landing')   // landing | joining | lobby | countdown | playing | results
  const [code, setCode] = useState('')
  const [players, setPlayers] = useState([])
  const [joinError, setJoinError] = useState('')
  const [countdown, setCountdown] = useState(3)
  const [isHost, setIsHost] = useState(false)
  const [gameResults, setGameResults] = useState(null)
  const channelRef = useRef(null)
  const countdownRef = useRef(null)
  const myId = patron?.id || 'anon_' + Math.random().toString(36).slice(2, 7)
  const myName = patron?.name || 'PLAYER'
  const myColor = COLORS[Math.floor(Math.random() * COLORS.length)]

  // ── Subscribe to a room channel ───────────────────────────────────────────
  function subscribeToRoom(roomCode, asHost) {
    if (channelRef.current) channelRef.current.unsubscribe()

    const channel = supabase.channel(`stack-wars:${roomCode}`, {
      config: { presence: { key: myId } },
    })

    channel
      // Presence: player list sync
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const playerList = Object.values(state).flat().map(p => ({
          id: p.id, name: p.name, color: p.color, isHost: p.isHost, isReady: p.isReady,
        }))
        setPlayers(playerList)
      })

      // Broadcasts: game flow
      .on('broadcast', { event: 'countdown_start' }, () => {
        setPhase('countdown'); setCountdown(3); runCountdown(channel)
      })
      .on('broadcast', { event: 'countdown_tick' }, ({ payload }) => {
        setCountdown(payload.count)
      })
      .on('broadcast', { event: 'game_start' }, () => {
        setPhase('playing')
      })
      .on('broadcast', { event: 'game_over' }, ({ payload }) => {
        // Update final scores from payload
        setGameResults(payload.results)
        setPhase('results')
        // Write winner XP to Supabase
        if (payload.results?.[0]?.id === myId) {
          writeScore(roomCode, payload.results[0].score)
        }
      })

      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: myId, name: myName, color: myColor, isHost: asHost, isReady: asHost,
          })
        }
      })

    channelRef.current = channel
    return channel
  }

  // ── Create room ───────────────────────────────────────────────────────────
  async function createRoom() {
    const newCode = genCode()
    const { error } = await supabase.from('stack_wars_rooms').insert({
      code: newCode, venue_id: venue?.id, host_id: myId, status: 'waiting',
    })
    if (error) { console.error('Room create error:', error); return }

    setCode(newCode)
    setIsHost(true)
    setPhase('lobby')
    subscribeToRoom(newCode, true)
  }

  // ── Join room ─────────────────────────────────────────────────────────────
  async function joinRoom(enteredCode) {
    setJoinError('')
    const { data, error } = await supabase
      .from('stack_wars_rooms')
      .select('*')
      .eq('code', enteredCode.toUpperCase())
      .eq('status', 'waiting')
      .single()

    if (error || !data) {
      setJoinError('Room not found or already started.')
      return
    }

    setCode(enteredCode.toUpperCase())
    setIsHost(false)
    setPhase('lobby')
    subscribeToRoom(enteredCode.toUpperCase(), false)
  }

  // ── Ready toggle ──────────────────────────────────────────────────────────
  async function toggleReady() {
    const channel = channelRef.current
    if (!channel) return
    const me = players.find(p => p.id === myId)
    await channel.track({ ...me, isReady: !me?.isReady })
  }

  // ── Host starts game → countdown ──────────────────────────────────────────
  async function startGame() {
    const channel = channelRef.current
    if (!channel) return

    await supabase.from('stack_wars_rooms').update({ status: 'countdown' }).eq('code', code)
    channel.send({ type: 'broadcast', event: 'countdown_start', payload: {} })
    setPhase('countdown')
    setCountdown(3)
    runCountdown(channel)
  }

  function runCountdown(channel) {
    let count = 3
    clearInterval(countdownRef.current)
    countdownRef.current = setInterval(async () => {
      count--
      if (count > 0) {
        channel.send({ type: 'broadcast', event: 'countdown_tick', payload: { count } })
        setCountdown(count)
      } else {
        clearInterval(countdownRef.current)
        await supabase.from('stack_wars_rooms').update({ status: 'playing' }).eq('code', code)
        channel.send({ type: 'broadcast', event: 'game_start', payload: {} })
        setPhase('playing')
      }
    }, 1000)
  }

  // ── Game over → results ───────────────────────────────────────────────────
  function handleGameOver(outcome) {
    const channel = channelRef.current
    if (!channel) return

    // Compile results from players state (real scores come from snapshot events)
    const results = players.map(p => ({
      id: p.id, name: p.name, color: p.color, score: p.score || 0,
    })).sort((a, b) => b.score - a.score)

    setGameResults(results)
    setPhase('results')

    if (isHost) {
      supabase.from('stack_wars_rooms').update({ status: 'finished' }).eq('code', code)
      channel.send({ type: 'broadcast', event: 'game_over', payload: { results } })
    }
  }

  async function writeScore(roomCode, score) {
    try {
      await supabase.from('scores').insert({
        venue_id: venue?.id,
        patron_id: patron?.id,
        game_id: 'stack-wars',
        score,
        metadata: { room_code: roomCode },
      })
    } catch (e) { console.warn('Score write error:', e) }
  }

  // ── Rematch ───────────────────────────────────────────────────────────────
  async function rematch() {
    const channel = channelRef.current
    if (!channel) return
    const newCode = isHost ? genCode() : code
    if (isHost) {
      await supabase.from('stack_wars_rooms').update({ status: 'waiting' }).eq('code', code)
    }
    setPhase('lobby')
    setGameResults(null)
    // Reset ready states
    await channel.track({ id: myId, name: myName, color: myColor, isHost, isReady: isHost })
  }

  // ── Leave lobby ───────────────────────────────────────────────────────────
  function leaveRoom() {
    clearInterval(countdownRef.current)
    if (channelRef.current) channelRef.current.unsubscribe()
    channelRef.current = null
    setPlayers([])
    setPhase('landing')
    setCode('')
    setIsHost(false)
  }

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(countdownRef.current)
      if (channelRef.current) channelRef.current.unsubscribe()
    }
  }, [])

  // ─── Render ────────────────────────────────────────────────────────────────
  if (phase === 'landing')   return <PhaseLanding onCreate={createRoom} onJoin={() => setPhase('joining')} />
  if (phase === 'joining')   return <PhaseJoin onConfirm={joinRoom} onBack={() => setPhase('landing')} error={joinError} />
  if (phase === 'lobby')     return <PhaseLobby code={code} players={players} myId={myId} isHost={isHost} onStart={startGame} onReady={toggleReady} onLeave={leaveRoom} />
  if (phase === 'countdown') return <PhaseCountdown count={countdown} players={players} />
  if (phase === 'results')   return <PhaseResults players={gameResults || players} onRematch={rematch} onExit={leaveRoom} />

  if (phase === 'playing') return (
    <PhasePlaying
      myId={myId}
      players={players}
      channel={channelRef.current}
      onGameOver={handleGameOver}
    />
  )

  return null
}
