import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/session'

export async function middleware(req) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const session = await getIronSession(req.cookies, sessionOptions)

  if (!session.user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
