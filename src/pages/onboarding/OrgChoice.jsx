import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Users } from 'lucide-react'
import { logOut } from '@/services/authService'
import { useAuth } from '@/contexts/AuthContext'
import { useOrg } from '@/contexts/OrgContext'

import { getUserOrganizations } from '@/services/userService'
import { getOrg } from '@/services/orgService'

export default function OrgChoice() {
  const navigate = useNavigate()

  const { user } = useAuth()
  const { switchOrg } = useOrg()

  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrganizations()
  }, [user])

  async function loadOrganizations() {
    if (!user) return

    try {
      const orgIds = await getUserOrganizations(user.uid)

      const orgs = await Promise.all(
        orgIds.map((id) => getOrg(id))
      )

      setOrganizations(
        orgs.filter(Boolean)
      )
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function enterOrg(orgId) {
    switchOrg(orgId)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center px-5">

      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              ET
            </span>
          </div>

          <span className="text-2xl font-bold text-white">
            EasyTrack
          </span>
        </div>

        <p className="text-surface-400 text-sm mt-2">
          Welcome! Set up your workspace
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">

        <button
          onClick={() => navigate('/create-org')}
          className="w-full bg-surface-900 border border-surface-700 rounded-2xl p-5 text-left"
        >
          <Building2
            size={28}
            className="text-brand-400 mb-3"
          />

          <h3 className="text-white font-bold text-base">
            Create Organization
          </h3>

          <p className="text-surface-400 text-sm mt-1">
            Start fresh — you'll be the Manager
          </p>
        </button>

        <button
          onClick={() => navigate('/join-org')}
          className="w-full bg-surface-900 border border-surface-700 rounded-2xl p-5 text-left"
        >
          <Users
            size={28}
            className="text-brand-400 mb-3"
          />

          <h3 className="text-white font-bold text-base">
            Join Organization
          </h3>

          <p className="text-surface-400 text-sm mt-1">
            Enter a key shared by your manager
          </p>
        </button>

        {!loading && organizations.length > 0 && (
          <>
            <div className="pt-4">
              <h3 className="text-white font-semibold mb-3">
                Your Organizations
              </h3>

              <div className="space-y-2">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => enterOrg(org.id)}
                    className="w-full bg-surface-800 hover:bg-surface-700 border border-surface-700 rounded-xl p-4 text-left"
                  >
                    <div className="text-white font-medium">
                      {org.name}
                    </div>

                    <div className="text-surface-400 text-xs mt-1">
                      {org.uniqueKey}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 flex flex-col items-center gap-2">
  <button
    onClick={logOut}
    className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-medium transition-all"
  >
    Sign Out
  </button>

  <p className="text-xs text-surface-500">
    {user?.displayName || user?.phoneNumber || user?.email}
  </p>
</div>
    </div>
  )
}
