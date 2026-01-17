import { NextRequest, NextResponse } from 'next/server'
import { structureRecipeFromTranscript } from '@/lib/recipe-structure'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transcript } = body

    if (!transcript) {
      return NextResponse.json(
        { error: 'No transcript provided' },
        { status: 400 }
      )
    }

    const recipe = await structureRecipeFromTranscript(transcript)

    return NextResponse.json({ recipe })
  } catch (error) {
    console.error('Error structuring recipe:', error)
    return NextResponse.json(
      {
        error: 'Failed to structure recipe',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
