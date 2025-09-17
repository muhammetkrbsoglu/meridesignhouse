import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Basic Auth sadece staging/preview için
export function middleware(req: NextRequest) {
  // HTTPS redirect (production only, skip localhost/preview)
  try {
    const isProd = process.env.VERCEL_ENV === 'production' || process.env.NEXT_PUBLIC_ENV === 'production'
    const proto = req.headers.get('x-forwarded-proto')
    const host = req.headers.get('host') || ''
    const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1')

    if (isProd && proto === 'http' && !isLocalhost) {
      const url = new URL(req.url)
      url.protocol = 'https:'
      return NextResponse.redirect(url, 308)
    }
  } catch {
    // no-op: never fail the request due to redirect check
  }

  const isPreview = process.env.NEXT_PUBLIC_ENV === 'staging' || process.env.VERCEL_ENV === 'preview'
  const basicAuthUser = process.env.BASIC_AUTH_USER
  const basicAuthPass = process.env.BASIC_AUTH_PASS

  if (!isPreview || !basicAuthUser || !basicAuthPass) return NextResponse.next()

  const auth = req.headers.get('authorization')
  if (auth) {
    const [scheme, encoded] = auth.split(' ')
    if (scheme === 'Basic' && encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString()
      const [user, pass] = decoded.split(':')
      if (user === basicAuthUser && pass === basicAuthPass) {
        return NextResponse.next()
      }
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Protected"' },
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/public).*)',
  ],
}


