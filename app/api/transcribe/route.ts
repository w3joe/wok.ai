import { NextRequest, NextResponse } from 'next/server'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY is not configured')
      return NextResponse.json(
        { error: 'Transcription service not configured. Please set ELEVENLABS_API_KEY in .env.local' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    console.log('Processing audio file:', audioFile.name, 'Type:', audioFile.type, 'Size:', audioFile.size)

    // Initialize ElevenLabs client
    const client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    })

    // Convert audio file to buffer
    const audioBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(audioBuffer)

    console.log('Sending request to ElevenLabs Speech-to-Text API...')

    // Use ElevenLabs SDK to transcribe
    // Pass the buffer directly as it's a valid Uploadable type
    const result = await client.speechToText.convert({
      file: buffer,
      modelId: 'scribe_v1',
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transcript = (result as any).text || ''
    console.log('Transcription successful, length:', transcript.length)

    return NextResponse.json({ transcript })
  } catch (error) {
    console.error('Error transcribing audio:', error)
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
