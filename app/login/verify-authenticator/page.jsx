'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function VerifyAuthenticatorPage() {
  const [code, setCode]       = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/verify-totp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    sessionStorage.removeItem('auth_email')
    router.push('/scorecard')
  }

  return (
    <main style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>YRCI · Bid Pursuit</div>
        <h1 style={s.h1}>Authenticator code</h1>
        <p style={s.sub}>Open your authenticator app and enter the 6-digit code.</p>
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
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" disabled={loading || code.length !== 6} style={s.btn}>
            {loading ? 'Verifying…' : 'Sign in'}
          </button>
        </form>
        <button onClick={() => router.push('/login')} style={s.backBtn}>
          ← Back to login
        </button>
      </div>
    </main>
  )
}

const s = {
  page:    { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f7', padding: 16 },
  card:    { background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,.1)', padding: '40px 36px', width: '100%', maxWidth: 420 },
  logo:    { fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#7a00df', opacity: .7, marginBottom: 16 },
  h1:      { fontSize: 26, fontWeight: 800, color: '#1a0030', marginBottom: 8 },
  sub:     { fontSize: 14, color: '#8898bb', marginBottom: 28 },
  form:    { display: 'flex', flexDirection: 'column', gap: 12 },
  input:   { padding: '11px 14px', fontSize: 15, border: '2px solid #e4e9f4', borderRadius: 8, fontFamily: 'inherit', outline: 'none' },
  btn:     { padding: '13px 0', fontSize: 15, fontWeight: 700, background: 'linear-gradient(135deg,#7a00df,#5a00a8)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 4 },
  error:   { color: '#c0392b', fontSize: 13, margin: 0 },
  backBtn: { display: 'block', margin: '20px auto 0', background: 'none', border: 'none', color: '#aab4cc', cursor: 'pointer', fontSize: 13 },
}
