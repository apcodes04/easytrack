import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { signInWithGoogle, setupRecaptcha, sendOTP, verifyOTP } from '@/services/authService'
import { Smartphone, Mail, ArrowRight, ChevronLeft } from 'lucide-react'

export default function Login() {
  const [mode, setMode] = useState('choose') // choose | phone | otp
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleGoogle() {
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendOTP() {
    if (!phone.match(/^\+[1-9]\d{7,14}$/)) {
      toast.error('Enter phone with country code e.g. +919876543210')
      return
    }
    setLoading(true)
    try {
      setupRecaptcha('recaptcha-container')
      await sendOTP(phone)
      setMode('otp')
      toast.success('OTP sent!')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP() {
    if (otp.length !== 6) { toast.error('Enter 6-digit OTP'); return }
    setLoading(true)
    try {
      await verifyOTP(otp)
    } catch (e) {
      toast.error('Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center px-5">
      <div id="recaptcha-container" />

      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg" style={{fontFamily:'Syne,sans-serif'}}>ET</span>
          </div>
          <h1 className="text-3xl font-bold text-white" style={{fontFamily:'Syne,sans-serif'}}>EasyTrack</h1>
        </div>
        <p className="text-surface-400 text-sm">Resource tracking made simple</p>
      </div>

      <div className="w-full max-w-sm bg-surface-900 rounded-2xl p-6 border border-surface-800">

        {mode === 'choose' && (
          <div className="space-y-3 page-enter">
            <h2 className="text-xl font-bold text-white mb-6" style={{fontFamily:'Syne,sans-serif'}}>Sign in to continue</h2>

            <button onClick={() => setMode('phone')}
              className="w-full flex items-center gap-3 bg-surface-800 hover:bg-surface-700 text-white rounded-xl px-4 py-3.5 transition-colors">
              <Smartphone size={20} className="text-brand-400" />
              <span className="flex-1 text-left text-sm font-medium">Continue with Phone</span>
              <ArrowRight size={16} className="text-surface-500" />
            </button>

            <button onClick={handleGoogle} disabled={loading}
              className="w-full flex items-center gap-3 bg-surface-800 hover:bg-surface-700 text-white rounded-xl px-4 py-3.5 transition-colors disabled:opacity-50">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="flex-1 text-left text-sm font-medium">Continue with Google</span>
              {loading ? <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" /> : <ArrowRight size={16} className="text-surface-500" />}
            </button>
          </div>
        )}

        {mode === 'phone' && (
          <div className="space-y-4 step-enter">
            <button onClick={() => setMode('choose')} className="flex items-center gap-1 text-surface-400 hover:text-white text-sm mb-2">
              <ChevronLeft size={16} /> Back
            </button>
            <h2 className="text-xl font-bold text-white" style={{fontFamily:'Syne,sans-serif'}}>Enter phone number</h2>
            <p className="text-surface-400 text-sm">Include country code (e.g. +91 for India)</p>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+919876543210"
              className="w-full bg-surface-800 text-white rounded-xl px-4 py-3 text-sm border border-surface-700 focus:border-brand-500 outline-none"
            />
            <button onClick={handleSendOTP} disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Send OTP'}
            </button>
          </div>
        )}

        {mode === 'otp' && (
          <div className="space-y-4 step-enter">
            <button onClick={() => setMode('phone')} className="flex items-center gap-1 text-surface-400 hover:text-white text-sm mb-2">
              <ChevronLeft size={16} /> Back
            </button>
            <h2 className="text-xl font-bold text-white" style={{fontFamily:'Syne,sans-serif'}}>Enter OTP</h2>
            <p className="text-surface-400 text-sm">Sent to {phone}</p>
            <input
              type="number" value={otp} onChange={e => setOtp(e.target.value)}
              placeholder="6-digit code" maxLength={6}
              className="w-full bg-surface-800 text-white rounded-xl px-4 py-3 text-sm border border-surface-700 focus:border-brand-500 outline-none tracking-widest text-center text-lg"
            />
            <button onClick={handleVerifyOTP} disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Verify OTP'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
