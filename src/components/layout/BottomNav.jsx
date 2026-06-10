import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, FileBarChart2, Settings } from 'lucide-react'
import { useOrg } from '@/contexts/OrgContext'

export default function BottomNav() {
  const { isManager, isAsstManager } = useOrg()
  const base = "flex flex-col items-center gap-1 py-2 px-4 text-surface-500 transition-colors text-[10px]"
  const active = "text-brand-400"

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface-950 border-t border-surface-800 flex justify-around safe-area-pb">
      <NavLink to="/" end className={({isActive}) => `${base} ${isActive ? active : ''}`}>
        <LayoutDashboard size={20} />
        Home
      </NavLink>
      <NavLink to="/projects" className={({isActive}) => `${base} ${isActive ? active : ''}`}>
        <FolderKanban size={20} />
        Projects
      </NavLink>
      {(isManager || isAsstManager) && (
        <NavLink to="/reports" className={({isActive}) => `${base} ${isActive ? active : ''}`}>
          <FileBarChart2 size={20} />
          Reports
        </NavLink>
      )}
    </nav>
  )
}
