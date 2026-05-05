import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { connectDB } from '@/lib/mongodb'
import { sessionOptions } from '@/lib/session'
import User from '@/models/User'
import { authenticator } from 'otplib'

export async function POST(req) {
  const { code } = await req.json()
  const session = await getIronSession(await cookies(), sessionOptions)

  if (!session.emailVerified)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await User.findOne({ email: session.emailVerified })
  if (!user || !user.totpSecret)
    return NextResponse.json({ error: 'Authenticator not configured' }, { status: 400 })

  const isValid = authenticator.verify({ token: code.trim(), secret: user.totpSecret })
  if (!isValid)
    return NextResponse.json({ error: 'Invalid code — check the time on your device and try again' }, { status: 401 })

  if (!user.totpEnabled) {
    user.totpEnabled = true
    await user.save()
  }

  session.emailVerified = null
  session.user = { email: user.email }
  await session.save()

  return NextResponse.json({ ok: true })
}
