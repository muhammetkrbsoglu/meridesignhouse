import { NextRequest, NextResponse } from 'next/server'
import { imagekit } from '@/lib/imagekit'

export async function GET(_request: NextRequest) {
  try {
    // Get authentication parameters from ImageKit
    const authenticationParameters = imagekit.getAuthenticationParameters()
    
    return NextResponse.json(authenticationParameters)
  } catch (error) {
    console.error('ImageKit authentication error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}


