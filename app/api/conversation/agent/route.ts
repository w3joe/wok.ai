import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple API endpoint to get the ElevenLabs agent ID
 * Uses environment variable for agent ID (no dynamic creation)
 */
export async function GET(request: NextRequest) {
  try {
    const agentId = process.env.ELEVENLABS_AGENT_ID

    if (!agentId) {
      return NextResponse.json(
        { error: 'ELEVENLABS_AGENT_ID not configured in environment variables' },
        { status: 500 }
      )
    }

    return NextResponse.json({ agentId })
  } catch (error) {
    console.error('Error getting agent ID:', error)
    return NextResponse.json(
      { error: 'Failed to get agent ID' },
      { status: 500 }
    )
  }
}
