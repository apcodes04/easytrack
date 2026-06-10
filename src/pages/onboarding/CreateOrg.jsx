import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { createOrganization } from '@/services/orgService'
import { useAuth } from '@/contexts/AuthContext'
import { useOrg } from '@/contexts/OrgContext'
import { ChevronLeft, Copy, Share2, Check } from 'lucide-react'

export default function CreateOrg() {
  const { user } = useAuth()
  const { switchOrg } = useOrg()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(null)
  const [copied, setCopied] = useState(false)

  async function handleCreate() {
    if (!name.trim()) { toast.error('Enter organization name'); return }
    setLoading(true)
    try {
      const org = await createOrganization(user.uid, name)
      setCreated(org)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  function copyKey() {
    navigator.clipboard.writeText(created.uniqueKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Key copied!')
  }

  function shareKey() {
    const text = `Join my organization "${created.name}" on EasyTrack!\nUse key: ${created.uniqueKey}\n\nOr join directly: ${window.location.origin}/join-org?key=${created.uniqueKey}`
    if (navigator.share) {
      navigator.share({ title: 'Join EasyTrack', text })
    } else {
      navigator.clipboard.writeText(text)
      toast.success('Share text copied!')
    }
  }

  function proceed() {
    switchOrg(created.id)
    navigate('/')
  }

  if (created) return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center px-5 page-enter">
      <div className="w-full max-w-sm bg-surface-900 rounded-2xl p-6 border border-surface-800">
        <div className="w-12 h-12 bg-brand-500/20 rounded-xl flex items-center justify-center mb-4">
          <Check size={24} className="text-brand-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1" style={{fontFamily:'Syne,sans-serif'}}>{created.name}</h2>
        <p className="text-surface-400 text-sm mb-6">Organization created! Share this key with your team.</p>

        <div className="bg-surface-800 rounded-xl p-4 mb-4 text-center">
          <p className="text-surface-400 text-xs mb-1">Organization Key</p>
          <p className="text-brand-400 font-bold text-xl tracking-widest" style={{fontFamily:'Syne,sans-serif'}}>{created.uniqueKey}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={copyKey}
            className="flex items-center justify-center gap-2 bg-surface-800 hover:bg-surface-700 text-white rounded-xl py-3 text-sm transition-colors">
            {copied ? <Check size={16} className="text-brand-400" /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy Key'}
          </button>
          <button onClick={shareKey}
            className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl py-3 text-sm transition-colors">
            <Share2 size={16} />
            Share
          </button>
        </div>

        <button onClick={proceed}
          className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 text-sm font-semibold transition-colors">
          Go to Dashboard
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm bg-surface-900 rounded-2xl p-6 border border-surface-800">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-surface-400 hover:text-white text-sm mb-4">
          <ChevronLeft size={16} /> Back
        </button>
        <h2 className="text-xl font-bold text-white mb-1" style={{fontFamily:'Syne,sans-serif'}}>Create Organization</h2>
        <p className="text-surface-400 text-sm mb-6">You'll be the Manager of this org</p>

        <label className="text-surface-300 text-xs font-medium mb-2 block">Organization Name</label>
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. ABC Construction Co."
          className="w-full bg-surface-800 text-white rounded-xl px-4 py-3 text-sm border border-surface-700 focus:border-brand-500 outline-none mb-6"
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
        />

        <button onClick={handleCreate} disabled={loading}
          className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center">
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Organization'}
        </button>
      </div>
    </div>
  )
}
