import { NextRequest, NextResponse } from 'next/server'
import { fetchThemeStyles } from '@/lib/actions/events'

export async function GET() {
  try {
    const themeStyles = await fetchThemeStyles()
    return NextResponse.json(themeStyles)
  } catch (error) {
    console.error('Error fetching theme styles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch theme styles' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const themeStyles = await fetchThemeStyles()
    return NextResponse.json(themeStyles)
  } catch (error) {
    console.error('Error fetching theme styles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch theme styles' },
      { status: 500 }
    )
  }
}
