import { logOut } from '@/services/authService'
import { useOrg } from '@/contexts/OrgContext'
import { Clock } from 'lucide-react'

export default function PendingApproval() {
  const { currentOrg, clearOrg } = useOrg()
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm bg-surface-900 rounded-2xl p-8 border border-surface-800 text-center">
        <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
          <Clock size={32} className="text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2" style={{fontFamily:'Syne,sans-serif'}}>Awaiting Approval</h2>
        {currentOrg && <p className="text-brand-400 text-sm font-medium mb-3">{currentOrg.name}</p>}
        <p className="text-surface-400 text-sm mb-8">Your request to join is pending. The manager will approve or deny your request.</p>
        <button onClick={() => { clearOrg(); }} className="w-full text-surface-400 hover:text-white text-sm border border-surface-700 rounded-xl py-3 mb-3 transition-colors">
          Join a different org
        </button>
        <button onClick={logOut} className="w-full text-surface-500 hover:text-surface-300 text-sm">
          Sign out
        </button>
      </div>
    </div>
  )
}
