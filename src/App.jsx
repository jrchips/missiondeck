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
import Scholar from './rooms/Scholar'
import { LibraryBackdrop, CommandBackdrop, TavernBackdrop } from './RoomBackdrops'
import { playDoorSound } from './sounds'

const ROOMS = {
  command: { component: CommandCenter, name: 'Command Center',    icon: '⚡' },
  scholar: { component: Scholar,       name: "Scholar's Sanctum", icon: '📜' },
  war:     { component: WarRoom,       name: 'War Room',          icon: '⚔' },
  office:  { component: Office,        name: 'Office',            icon: '📅' },
  library: { component: Library,       name: 'Library',           icon: '📚' },
  armory:  { component: Armory,        name: 'Armory',            icon: '🛡' },
  forge:   { component: Forge,         name: 'Forge',             icon: '🔨' },
  vault:   { component: Vault,         name: 'Vault',             icon: '🪙' },
  tavern:  { component: Tavern,        name: 'Tavern',            icon: '🎮' },
}

const BACKDROPS = {
  library: LibraryBackdrop,
  command: CommandBackdrop,
  tavern:  TavernBackdrop,
}

export default function App() {
  const [activeRoom, setActiveRoom] = useState(null)

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
  const Backdrop = activeRoom ? BACKDROPS[activeRoom] : null

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#050308' }}>
      <DungeonMap onEnterRoom={enterRoom} activeRoom={activeRoom} />

      {activeRoom && ActiveComponent && (
        <div className="room-overlay">
          {/* Art backdrop — absolute, behind everything in the overlay */}
          {Backdrop && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 0,
              pointerEvents: 'none', overflow: 'hidden',
            }}>
              <Backdrop />
            </div>
          )}

          {/* Header — floats above backdrop */}
          <div className="room-overlay-header" style={{ position: 'relative', zIndex: 10 }}>
            <button className="back-btn" onClick={exitRoom}>◄ MAP</button>
            <span className="room-overlay-icon">{room.icon}</span>
            <span className="room-overlay-title">{room.name.toUpperCase()}</span>
          </div>

          {/* Scrollable content — above backdrop, below header */}
          <div className="room-overlay-content" style={{ position: 'relative', zIndex: 1 }}>
            <ActiveComponent />
          </div>
        </div>
      )}
    </div>
  )
}
