import { Routes, Route, Navigate } from 'react-router-dom'
import { NavBar } from '@/components/layout/NavBar'
import { BottomNav } from '@/components/layout/BottomNav'
import { FloatingMusicPlayer } from '@/components/music/FloatingMusicPlayer'
import Home from '@/pages/Home'
import Memories from '@/pages/Memories'
import CreateMemory from '@/pages/CreateMemory'
import MemoryDetail from '@/pages/MemoryDetail'
import Wishes from '@/pages/Wishes'
import StarrySky from '@/pages/StarrySky'
import MonthAlbum from '@/pages/MonthAlbum'
import EditMemory from '@/pages/EditMemory'

function App() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <NavBar />
      <main className="pt-20 pb-20 md:pb-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/memories" element={<Memories />} />
          <Route path="/memories/new" element={<CreateMemory />} />
          <Route path="/memories/:id" element={<MemoryDetail />} />
          <Route path="/wishes" element={<Wishes />} />
          <Route path="/starry" element={<StarrySky />} />
          <Route path="/album/:monthKey" element={<MonthAlbum />} />
          <Route path="/memories/:id/edit" element={<EditMemory />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
      <FloatingMusicPlayer />
    </div>
  )
}

export default App
