import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { connectDB } from '@/lib/mongodb'
import { sessionOptions } from '@/lib/session'
import User from '@/models/User'
import OtpToken from '@/models/OtpToken'

export async function POST(req) {
  const { email, code } = await req.json()
  if (!email || !code)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  await connectDB()

  const codeHash = OtpToken.hashCode(code.trim())
  const token = await OtpToken.findOne({
    email: email.toLowerCase(),
    codeHash,
    used: false,
    expiresAt: { $gt: new Date() },
  })

  if (!token)
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 })

  token.used = true
  await token.save()

  const user = await User.findOne({ email: email.toLowerCase() })

  const session = await getIronSession(await cookies(), sessionOptions)
  session.emailVerified = email.toLowerCase()
  await session.save()

  return NextResponse.json({ ok: true, totpEnabled: user.totpEnabled })
}
