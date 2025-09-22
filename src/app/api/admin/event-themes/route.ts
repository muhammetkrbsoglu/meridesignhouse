import { NextRequest, NextResponse } from 'next/server'
import { fetchEventThemeAssignments } from '@/lib/actions/events'

export async function GET() {
  try {
    const assignments = await fetchEventThemeAssignments()
    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Error fetching event theme assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event theme assignments' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const assignments = await fetchEventThemeAssignments()
    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Error fetching event theme assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event theme assignments' },
      { status: 500 }
    )
  }
}
