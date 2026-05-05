'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SetupAuthenticatorPage() {
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [secret, setSecret]       = useState('')
  const [code, setCode]           = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/setup-totp', { method: 'POST' })
      .then(r => r.json())
      .then(d => { setQrDataUrl(d.qrDataUrl); setSecret(d.secret) })
  }, [])

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
        <h1 style={s.h1}>Set up authenticator</h1>
        <p style={s.sub}>
          Use any TOTP app — <strong>Google Authenticator</strong>, <strong>Authy</strong>,{' '}
          <strong>Microsoft Authenticator</strong>, or <strong>1Password</strong>.
        </p>

        <ol style={s.steps}>
          <li>Open your authenticator app</li>
          <li>Tap <em>"Add account"</em> or the <strong>+</strong> button</li>
          <li>Scan the QR code below</li>
        </ol>

        <div style={s.qrWrap}>
          {qrDataUrl
            ? <img src={qrDataUrl} alt="TOTP QR code" style={s.qr} />
            : <div style={s.qrPlaceholder}>Loading…</div>
          }
        </div>

        <details style={s.details}>
          <summary style={s.summary}>Can't scan? Enter this key manually</summary>
          <code style={s.secret}>{secret}</code>
        </details>

        <form onSubmit={handleSubmit} style={s.form}>
          <label style={s.label}>Enter the 6-digit code from your app to confirm</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            style={{ ...s.input, letterSpacing: 10, textAlign: 'center', fontSize: 30, fontWeight: 800 }}
          />
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" disabled={loading || code.length !== 6} style={s.btn}>
            {loading ? 'Verifying…' : 'Confirm & finish setup'}
          </button>
        </form>
      </div>
    </main>
  )
}

const s = {
  page:          { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f7', padding: 16 },
  card:          { background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,.1)', padding: '40px 36px', width: '100%', maxWidth: 460 },
  logo:          { fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#7a00df', opacity: .7, marginBottom: 16 },
  h1:            { fontSize: 26, fontWeight: 800, color: '#1a0030', marginBottom: 8 },
  sub:           { fontSize: 14, color: '#8898bb', marginBottom: 20 },
  steps:         { fontSize: 14, color: '#5a6a8a', lineHeight: 2.2, paddingLeft: 20, marginBottom: 20 },
  qrWrap:        { textAlign: 'center', margin: '0 0 16px' },
  qr:            { border: '1px solid #e4e9f4', borderRadius: 8, maxWidth: 200 },
  qrPlaceholder: { width: 200, height: 200, background: '#f5eeff', borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#7a00df', fontSize: 13 },
  details:       { marginBottom: 20, fontSize: 13 },
  summary:       { cursor: 'pointer', color: '#7a00df', fontWeight: 600 },
  secret:        { display: 'block', marginTop: 10, padding: '10px 14px', background: '#f5f8ff', border: '1px solid #e4e9f4', borderRadius: 8, fontSize: 13, wordBreak: 'break-all', color: '#1a0030' },
  form:          { display: 'flex', flexDirection: 'column', gap: 12 },
  label:         { fontSize: 13, fontWeight: 700, color: '#5a6a8a' },
  input:         { padding: '11px 14px', fontSize: 15, border: '2px solid #e4e9f4', borderRadius: 8, fontFamily: 'inherit', outline: 'none' },
  btn:           { padding: '13px 0', fontSize: 15, fontWeight: 700, background: 'linear-gradient(135deg,#7a00df,#5a00a8)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 4 },
  error:         { color: '#c0392b', fontSize: 13, margin: 0 },
}
