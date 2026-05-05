'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]     = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    sessionStorage.setItem('auth_email', email)
    router.push('/login/verify-code')
  }

  return (
    <main style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>YRCI · Bid Pursuit</div>
        <h1 style={s.h1}>Sign in</h1>
        <p style={s.sub}>Enter your email — if you're authorized, we'll send a code.</p>
        <form onSubmit={handleSubmit} style={s.form}>
          <label style={s.label}>Email address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
            placeholder="you@example.com"
            style={s.input}
          />
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? 'Sending…' : 'Send code'}
          </button>
        </form>
      </div>
    </main>
  )
}

const s = {
  page:  { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f7', padding: 16 },
  card:  { background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,.1)', padding: '40px 36px', width: '100%', maxWidth: 420 },
  logo:  { fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#7a00df', opacity: .7, marginBottom: 16 },
  h1:    { fontSize: 26, fontWeight: 800, color: '#1a0030', marginBottom: 8 },
  sub:   { fontSize: 14, color: '#8898bb', marginBottom: 28 },
  form:  { display: 'flex', flexDirection: 'column', gap: 12 },
  label: { fontSize: 13, fontWeight: 700, color: '#5a6a8a' },
  input: { padding: '11px 14px', fontSize: 15, border: '2px solid #e4e9f4', borderRadius: 8, fontFamily: 'inherit', outline: 'none' },
  btn:   { padding: '13px 0', fontSize: 15, fontWeight: 700, background: 'linear-gradient(135deg,#7a00df,#5a00a8)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 4 },
  error: { color: '#c0392b', fontSize: 13, margin: 0 },
}
