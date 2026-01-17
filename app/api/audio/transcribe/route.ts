import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import { Readable } from 'stream'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic)
}

interface TranscriptSegment {
  text: string
  startTime: number
  endTime: number
}

// Initialize OpenAI client
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  return new OpenAI({ apiKey })
}

/**
 * Extract audio from video file using FFmpeg
 */
async function extractAudio(videoPath: string, audioPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        '-vn',           // No video
        '-acodec', 'libmp3lame',
        '-ar', '16000',  // 16kHz sample rate (good for speech)
        '-ac', '1',      // Mono
        '-b:a', '64k'    // 64kbps bitrate
      ])
      .output(audioPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
      .run()
  })
}

/**
 * Transcribe audio using OpenAI Whisper
 */
async function transcribeWithWhisper(
  audioPath: string,
  openai: OpenAI
): Promise<{ text: string; segments: TranscriptSegment[] }> {
  const { createReadStream } = await import('fs')
  const audioFile = createReadStream(audioPath)

  // Use verbose_json for word-level timestamps
  const response = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment']
  })

  // Extract segments with timestamps
  const segments: TranscriptSegment[] = []

  // The response includes segments when using verbose_json
  const responseData = response as any // Whisper verbose response type
  if (responseData.segments) {
    for (const seg of responseData.segments) {
      segments.push({
        text: seg.text.trim(),
        startTime: seg.start,
        endTime: seg.end
      })
    }
  } else {
    // Fallback: single segment for entire transcript
    segments.push({
      text: response.text,
      startTime: 0,
      endTime: 0
    })
  }

  return {
    text: response.text,
    segments
  }
}

export async function POST(request: NextRequest) {
  const tempDir = join(tmpdir(), 'wok-ai-audio')
  const sessionId = randomUUID()
  const videoPath = join(tempDir, `${sessionId}.webm`)
  const audioPath = join(tempDir, `${sessionId}.mp3`)

  try {
    // Ensure temp directory exists
    await mkdir(tempDir, { recursive: true })

    // Get video file from request
    const formData = await request.formData()
    const videoFile = formData.get('video') as Blob | null

    if (!videoFile) {
      return NextResponse.json(
        { error: 'video file is required' },
        { status: 400 }
      )
    }

    // Write video to temp file
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer())
    await writeFile(videoPath, videoBuffer)

    // Extract audio
    try {
      await extractAudio(videoPath, audioPath)
    } catch (error) {
      console.error('Audio extraction error:', error)
      return NextResponse.json(
        { error: 'Failed to extract audio from video' },
        { status: 500 }
      )
    }

    // Transcribe with Whisper
    const openai = getOpenAIClient()
    const result = await transcribeWithWhisper(audioPath, openai)

    return NextResponse.json({
      text: result.text,
      segments: result.segments,
      duration: result.segments.length > 0
        ? result.segments[result.segments.length - 1].endTime
        : 0
    })

  } catch (error) {
    console.error('Transcription error:', error)

    const message = error instanceof Error ? error.message : 'Transcription failed'

    if (message.includes('OPENAI_API_KEY')) {
      return NextResponse.json(
        { error: 'Whisper API not configured', text: '', segments: [] },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: message, text: '', segments: [] },
      { status: 500 }
    )

  } finally {
    // Cleanup temp files
    try {
      await unlink(videoPath).catch(() => {})
      await unlink(audioPath).catch(() => {})
    } catch {
      // Ignore cleanup errors
    }
  }
}
