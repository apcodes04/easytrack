import { useState } from 'react'
import { useOrg } from '@/contexts/OrgContext'
import { Share2, Copy, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ShareOrgKey({ compact = false }) {
  const { currentOrg } = useOrg()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!currentOrg) return null

  function copyKey() {
    navigator.clipboard.writeText(currentOrg.uniqueKey)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
    toast.success('Key copied!')
  }

  function share() {
    const text = `Join "${currentOrg.name}" on EasyTrack!\nKey: ${currentOrg.uniqueKey}\nLink: ${window.location.origin}/join-org?key=${currentOrg.uniqueKey}`
    if (navigator.share) navigator.share({ title: 'Join EasyTrack', text })
    else { navigator.clipboard.writeText(text); toast.success('Share text copied!') }
  }

  if (compact) return (
    <>
      <button onClick={() => setOpen(true)} className="text-surface-400 hover:text-white p-1.5 rounded-lg hover:bg-surface-800 transition-colors">
        <Share2 size={18} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm bg-surface-900 rounded-2xl p-5 border border-surface-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white" style={{fontFamily:'Syne,sans-serif'}}>Invite to {currentOrg.name}</h3>
              <button onClick={() => setOpen(false)} className="text-surface-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="bg-surface-800 rounded-xl p-4 text-center mb-4">
              <p className="text-surface-400 text-xs mb-1">Organization Key</p>
              <p className="text-brand-400 font-bold text-xl tracking-widest" style={{fontFamily:'Syne,sans-serif'}}>{currentOrg.uniqueKey}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={copyKey} className="flex items-center justify-center gap-2 bg-surface-800 hover:bg-surface-700 text-white rounded-xl py-3 text-sm transition-colors">
                {copied ? <Check size={15} className="text-brand-400" /> : <Copy size={15} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={share} className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl py-3 text-sm transition-colors">
                <Share2 size={15} /> Share
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  return (
    <div className="bg-surface-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-surface-400 text-xs">Organization Key</p>
      </div>
      <p className="text-brand-400 font-bold text-lg tracking-widest mb-3" style={{fontFamily:'Syne,sans-serif'}}>{currentOrg.uniqueKey}</p>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={copyKey} className="flex items-center justify-center gap-1.5 bg-surface-700 hover:bg-surface-600 text-white rounded-lg py-2 text-xs transition-colors">
          {copied ? <Check size={13} /> : <Copy size={13} />} Copy
        </button>
        <button onClick={share} className="flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg py-2 text-xs transition-colors">
          <Share2 size={13} /> Share
        </button>
      </div>
    </div>
  )
}
