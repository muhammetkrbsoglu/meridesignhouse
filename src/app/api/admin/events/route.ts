import { NextRequest, NextResponse } from 'next/server'
import { fetchEventTypes } from '@/lib/actions/events'

export async function GET() {
  try {
    const eventTypes = await fetchEventTypes()
    return NextResponse.json(eventTypes)
  } catch (error) {
    console.error('Error fetching event types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event types' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const eventTypes = await fetchEventTypes()
    return NextResponse.json(eventTypes)
  } catch (error) {
    console.error('Error fetching event types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event types' },
      { status: 500 }
    )
  }
}
