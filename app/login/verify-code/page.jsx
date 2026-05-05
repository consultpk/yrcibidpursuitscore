'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const COOLDOWN_SECONDS = 60

export default function VerifyCodePage() {
  const [code, setCode]           = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [cooldown, setCooldown]   = useState(COOLDOWN_SECONDS)
  const [resendMsg, setResendMsg] = useState('')
  const router = useRouter()

  const email = typeof window !== 'undefined' ? sessionStorage.getItem('auth_email') : ''

  useEffect(() => { if (!email) router.replace('/login') }, [email])

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return
    setError('')
    setResendMsg('')
    setCooldown(COOLDOWN_SECONDS)
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setCooldown(0) }
    else { setResendMsg('A new code has been sent.'); setCode('') }
  }, [cooldown, email])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    if (data.totpEnabled) router.push('/login/verify-authenticator')
    else router.push('/login/setup-authenticator')
  }

  return (
    <main style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>YRCI · Bid Pursuit</div>
        <h1 style={s.h1}>Check your email</h1>
        <p style={s.sub}>We sent a 6-digit code to <strong>{email}</strong></p>
        <form onSubmit={handleSubmit} style={s.form}>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            autoFocus
            style={{ ...s.input, letterSpacing: 10, textAlign: 'center', fontSize: 30, fontWeight: 800 }}
          />
          {error    && <p style={s.error}>{error}</p>}
          {resendMsg && <p style={s.success}>{resendMsg}</p>}
          <button type="submit" disabled={loading || code.length !== 6} style={s.btn}>
            {loading ? 'Verifying…' : 'Verify code'}
          </button>
        </form>

        <div style={s.resendRow}>
          {cooldown > 0
            ? <span style={s.cooldownText}>Resend code in <strong>{cooldown}s</strong></span>
            : <button onClick={handleResend} style={s.resendBtn}>Resend code</button>
          }
        </div>

        <button onClick={() => router.push('/login')} style={s.backBtn}>
          ← Use a different email
        </button>
      </div>
    </main>
  )
}

const s = {
  page:        { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f7', padding: 16 },
  card:        { background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,.1)', padding: '40px 36px', width: '100%', maxWidth: 420 },
  logo:        { fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#7a00df', opacity: .7, marginBottom: 16 },
  h1:          { fontSize: 26, fontWeight: 800, color: '#1a0030', marginBottom: 8 },
  sub:         { fontSize: 14, color: '#8898bb', marginBottom: 28 },
  form:        { display: 'flex', flexDirection: 'column', gap: 12 },
  input:       { padding: '11px 14px', fontSize: 15, border: '2px solid #e4e9f4', borderRadius: 8, fontFamily: 'inherit', outline: 'none' },
  btn:         { padding: '13px 0', fontSize: 15, fontWeight: 700, background: 'linear-gradient(135deg,#7a00df,#5a00a8)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 4 },
  error:       { color: '#c0392b', fontSize: 13, margin: 0 },
  success:     { color: '#1a7a45', fontSize: 13, margin: 0 },
  resendRow:   { textAlign: 'center', marginTop: 20 },
  cooldownText:{ color: '#8898bb', fontSize: 14 },
  resendBtn:   { background: 'none', border: 'none', color: '#7a00df', cursor: 'pointer', fontSize: 14, textDecoration: 'underline', padding: 0 },
  backBtn:     { display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: '#aab4cc', cursor: 'pointer', fontSize: 13 },
}
