// src/components/layout/Navbar.jsx
import { useNavigate } from 'react-router-dom'
import { useOrg } from '@/contexts/OrgContext'
import { useAuth } from '@/contexts/AuthContext'
import ShareOrgKey from '@/components/shared/ShareOrgKey'
import { Bell, Menu } from 'lucide-react'

export default function Navbar({ title, onMenuClick }) {
  const { currentOrg, memberData } = useOrg()
  const roleColor = { manager: 'text-brand-400', asst_manager: 'text-amber-400', employee: 'text-surface-400' }

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-surface-950/90 backdrop-blur border-b border-surface-800 px-4 h-14 flex items-center gap-3">
      {onMenuClick && (
        <button onClick={onMenuClick} className="text-surface-400 hover:text-white md:hidden">
          <Menu size={20} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm truncate" style={{fontFamily:'Syne,sans-serif'}}>
            {title || currentOrg?.name || 'EasyTrack'}
          </span>
          {memberData?.role && (
            <span className={`text-xs font-medium ${roleColor[memberData.role] || 'text-surface-400'} hidden sm:inline`}>
              • {memberData.role.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>
      <ShareOrgKey compact />
    </nav>
  )
}
