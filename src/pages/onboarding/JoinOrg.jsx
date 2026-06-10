import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getOrgByKey, requestJoinOrg } from '@/services/orgService'
import { useAuth } from '@/contexts/AuthContext'
import { ChevronLeft, Search, Clock } from 'lucide-react'

export default function JoinOrg() {
  const { user, userProfile } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [key, setKey] = useState(params.get('key') || '')
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSearch() {
    if (!key.trim()) { toast.error('Enter organization key'); return }
    setLoading(true)
    try {
      const found = await getOrgByKey(key.trim().toUpperCase())
      if (!found) { toast.error('Organization not found'); setOrg(null); return }
      setOrg(found)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRequest() {
    setLoading(true)
    try {
      await requestJoinOrg(org.id, user.uid, userProfile?.displayName || user.displayName, userProfile?.phone || user.phoneNumber)
      setSent(true)
      toast.success('Request sent! Wait for manager approval.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.get('key')) handleSearch()
  }, [])

  if (sent) return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center px-5 page-enter">
      <div className="w-full max-w-sm bg-surface-900 rounded-2xl p-6 border border-surface-800 text-center">
        <div className="w-14 h-14 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock size={28} className="text-brand-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2" style={{fontFamily:'Syne,sans-serif'}}>Request Sent</h2>
        <p className="text-surface-400 text-sm mb-2">Your request to join <span className="text-white font-medium">{org?.name}</span> has been sent.</p>
        <p className="text-surface-500 text-xs">Wait for the Manager to approve your request. Come back and refresh.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm bg-surface-900 rounded-2xl p-6 border border-surface-800">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-surface-400 hover:text-white text-sm mb-4">
          <ChevronLeft size={16} /> Back
        </button>
        <h2 className="text-xl font-bold text-white mb-1" style={{fontFamily:'Syne,sans-serif'}}>Join Organization</h2>
        <p className="text-surface-400 text-sm mb-6">Enter the key shared by your manager</p>

        <label className="text-surface-300 text-xs font-medium mb-2 block">Organization Key</label>
        <div className="flex gap-2 mb-4">
          <input value={key} onChange={e => setKey(e.target.value.toUpperCase())}
            placeholder="ET-XXXX-XXXX-XXXX"
            className="flex-1 bg-surface-800 text-white rounded-xl px-4 py-3 text-sm border border-surface-700 focus:border-brand-500 outline-none tracking-wider"
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={loading}
            className="bg-surface-700 hover:bg-surface-600 text-white rounded-xl px-4 transition-colors">
            <Search size={16} />
          </button>
        </div>

        {org && (
          <div className="bg-surface-800 rounded-xl p-4 mb-4 step-enter">
            <p className="text-surface-400 text-xs mb-1">Found</p>
            <p className="text-white font-bold">{org.name}</p>
            <p className="text-surface-500 text-xs mt-1">{org.uniqueKey}</p>
          </div>
        )}

        {org && (
          <button onClick={handleRequest} disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Send Join Request'}
          </button>
        )}
      </div>
    </div>
  )
}
