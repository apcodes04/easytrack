import { LogOut } from 'lucide-react'
import { logOut } from '@/services/authService'
import { useOrg } from '@/contexts/OrgContext'

export default function LogoutButton() {
  const { clearOrg } = useOrg()

  const handleLogout = async () => {
    clearOrg()
    await logOut()
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm"
    >
      <LogOut size={16} />
      Logout
    </button>
  )
}
