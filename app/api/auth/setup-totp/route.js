import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { connectDB } from '@/lib/mongodb'
import { sessionOptions } from '@/lib/session'
import User from '@/models/User'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

export async function POST() {
  const session = await getIronSession(await cookies(), sessionOptions)
  if (!session.emailVerified)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await User.findOne({ email: session.emailVerified })
  if (!user)
    return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const secret = authenticator.generateSecret()
  user.totpSecret = secret
  await user.save()

  const otpAuthUrl = authenticator.keyuri(user.email, 'YRCI Bid Pursuit', secret)
  const qrDataUrl = await QRCode.toDataURL(otpAuthUrl)

  return NextResponse.json({ qrDataUrl, secret })
}
