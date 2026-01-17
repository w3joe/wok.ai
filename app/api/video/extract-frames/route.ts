import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '')

interface ExtractedFrame {
    timestamp: number
    url: string
    label: string
    type: string
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { frames } = body

        if (!frames || !Array.isArray(frames)) {
            return NextResponse.json(
                { error: 'No frames data provided' },
                { status: 400 }
            )
        }

        // For server-side, we receive already extracted frame blobs from client
        // The client extracts frames using canvas and sends them here for storage
        const uploadedFrames: ExtractedFrame[] = []

        for (const frame of frames) {
            const { timestamp, label, type, imageData } = frame

            if (!imageData) {
                console.log('Skipping frame without imageData at timestamp:', timestamp)
                continue
            }

            // Convert base64 to buffer
            const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
            const buffer = Buffer.from(base64Data, 'base64')

            // Generate filename
            const randomId = Math.random().toString(36).substring(2, 8)
            const filename = `frame-${timestamp}-${randomId}.jpg`

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('recipe-frames')
                .upload(filename, buffer, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600',
                    upsert: false
                })

            if (error) {
                console.error('Failed to upload frame:', error)
                continue
            }

            // Get public URL
            const { data: publicUrlData } = supabase.storage
                .from('recipe-frames')
                .getPublicUrl(data.path)

            uploadedFrames.push({
                timestamp,
                url: publicUrlData.publicUrl,
                label,
                type
            })
        }

        console.log('Uploaded', uploadedFrames.length, 'frames')

        return NextResponse.json({
            frames: uploadedFrames,
            count: uploadedFrames.length
        })
    } catch (error) {
        console.error('Error extracting frames:', error)
        return NextResponse.json(
            { error: 'Failed to extract frames', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
