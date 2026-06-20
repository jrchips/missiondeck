import { useState, useEffect } from 'react'
import DungeonMap from './DungeonMap'
import CommandCenter from './rooms/CommandCenter'
import WarRoom from './rooms/WarRoom'
import Office from './rooms/Office'
import Library from './rooms/Library'
import Armory from './rooms/Armory'
import Forge from './rooms/Forge'
import Vault from './rooms/Vault'
import Tavern from './rooms/Tavern'
import { playDoorSound } from './sounds'

const ROOMS = {
  command: { component: CommandCenter, name: 'Command Center', icon: '⚡' },
  war:     { component: WarRoom,       name: 'War Room',       icon: '⚔' },
  office:  { component: Office,        name: 'Office',         icon: '📅' },
  library: { component: Library,       name: 'Library',        icon: '📚' },
  armory:  { component: Armory,        name: 'Armory',         icon: '🛡' },
  forge:   { component: Forge,         name: 'Forge',          icon: '🔨' },
  vault:   { component: Vault,         name: 'Vault',          icon: '🪙' },
  tavern:  { component: Tavern,        name: 'Tavern',         icon: '🎮' },
}

export default function App() {
  const [activeRoom, setActiveRoom] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && activeRoom) setActiveRoom(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [activeRoom])

  const enterRoom = (roomId) => {
    playDoorSound()
    setActiveRoom(roomId)
  }

  const exitRoom = () => setActiveRoom(null)

  const room = activeRoom ? ROOMS[activeRoom] : null
  const ActiveComponent = room?.component

  return (
    <div style={{ width:'100vw', height:'100vh', overflow:'hidden', background:'#07070e' }}>
      {isMobile ? (
        <MobileGrid onEnterRoom={enterRoom} />
      ) : (
        <DungeonMap onEnterRoom={enterRoom} activeRoom={activeRoom} />
      )}

      {activeRoom && ActiveComponent && (
        <div className="room-overlay">
          <div className="room-overlay-header">
            <button className="back-btn" onClick={exitRoom}>◄ MAP</button>
            <span className="room-overlay-icon">{room.icon}</span>
            <span className="room-overlay-title">{room.name.toUpperCase()}</span>
          </div>
          <div className="room-overlay-content">
            <ActiveComponent />
          </div>
        </div>
      )}
    </div>
  )
}

function MobileGrid({ onEnterRoom }) {
  const items = [
    { id:'command', icon:'⚡', name:'Command\nCenter',  desc:'Agent Status',  center:true },
    { id:'war',     icon:'⚔', name:'War Room',         desc:'Kanban Board' },
    { id:'office',  icon:'📅', name:'Office',           desc:'Calendar' },
    { id:'library', icon:'📚', name:'Library',          desc:'Notes' },
    { id:'armory',  icon:'🛡', name:'Armory',           desc:'Quick Links' },
    { id:'forge',   icon:'🔨', name:'Forge',            desc:'ALS Checklist' },
    { id:'vault',   icon:'🪙', name:'Vault',            desc:'Expenses' },
    { id:'tavern',  icon:'🎮', name:'Tavern',           desc:'Break Zone' },
  ]
  return (
    <div className="mobile-grid">
      {items.map(r => (
        <button
          key={r.id}
          className={`mobile-room-btn${r.center ? ' center-room' : ''}`}
          onClick={() => onEnterRoom(r.id)}
        >
          <span className="mobile-room-icon">{r.icon}</span>
          <span className="mobile-room-name" style={{ whiteSpace:'pre-line' }}>{r.name}</span>
          <span className="mobile-room-desc">{r.desc}</span>
        </button>
      ))}
    </div>
  )
}
