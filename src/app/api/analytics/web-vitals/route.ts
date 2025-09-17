import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const { name, value, rating, delta, id, timestamp, url, userAgent } = body
    
    if (!name || typeof value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid web vitals data' },
        { status: 400 }
      )
    }

    // Log the web vitals data (in production, you might want to send this to a database or analytics service)
    console.log('Web Vitals:', {
      name,
      value,
      rating,
      delta,
      id,
      timestamp: new Date(timestamp).toISOString(),
      url,
      userAgent: userAgent?.substring(0, 100), // Truncate for logging
    })

    // In a real application, you would:
    // 1. Store this data in a database
    // 2. Send it to an analytics service (e.g., Google Analytics, Mixpanel, etc.)
    // 3. Set up alerts for performance issues
    // 4. Create dashboards to monitor trends

    // For now, we'll just return success
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error processing web vitals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
