import { useOrg } from '@/contexts/OrgContext'
import { ShieldOff } from 'lucide-react'

// roles: array of allowed roles e.g. ['manager','asst_manager']
export default function RoleGuard({ roles = [], feature, children, fallback }) {
  const { memberData, isManager } = useOrg()
  const role = memberData?.role

  const allowed = isManager || roles.includes(role) ||
    (feature && memberData?.permissions?.includes(feature))

  if (!allowed) {
    if (fallback) return fallback
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <ShieldOff size={40} className="text-surface-600 mb-3" />
        <p className="text-surface-400 text-sm">You don't have permission to view this</p>
      </div>
    )
  }
  return children
}
