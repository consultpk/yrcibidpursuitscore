import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { sendOtpEmail } from '@/lib/email'
import { isRateLimited } from '@/lib/rateLimit'
import User from '@/models/User'
import OtpToken from '@/models/OtpToken'
import crypto from 'crypto'

const TEN_MINUTES = 10 * 60 * 1000

export async function POST(req) {
  const { email } = await req.json()
  if (!email || !email.includes('@'))
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
           || req.headers.get('x-real-ip')
           || 'unknown'

  if (await isRateLimited(`otp:email:${email.toLowerCase()}`, 3, TEN_MINUTES))
    return NextResponse.json({ error: 'Too many attempts. Try again in 10 minutes.' }, { status: 429 })

  if (await isRateLimited(`otp:ip:${ip}`, 5, TEN_MINUTES))
    return NextResponse.json({ error: 'Too many attempts from this location. Try again in 10 minutes.' }, { status: 429 })

  const allowedDomains = (process.env.ALLOWED_DOMAINS || '').toLowerCase().split(',').map(d => d.trim()).filter(Boolean)
  const emailDomain    = email.split('@')[1]?.toLowerCase()

  // Silent 200 for domains not on the allowlist — prevents enumeration
  if (!allowedDomains.length || !allowedDomains.includes(emailDomain))
    return NextResponse.json({ ok: true })

  await connectDB()

  // Auto-create user record on first login from an allowed domain
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $setOnInsert: { email: email.toLowerCase(), totpSecret: null, totpEnabled: false } },
    { upsert: true, new: true }
  )

  const code = String(crypto.randomInt(100000, 999999))
  const codeHash = OtpToken.hashCode(code)

  await OtpToken.deleteMany({ email: email.toLowerCase() })
  await OtpToken.create({
    email: email.toLowerCase(),
    codeHash,
    expiresAt: new Date(Date.now() + TEN_MINUTES),
  })

  await sendOtpEmail(email, code)
  return NextResponse.json({ ok: true })
}
