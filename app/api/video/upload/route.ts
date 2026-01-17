import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role for storage operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables for video upload')
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '')

export async function POST(request: NextRequest) {
    try {
        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json(
                { error: 'Storage service not configured' },
                { status: 500 }
            )
        }

        const formData = await request.formData()
        const videoFile = formData.get('video') as File

        if (!videoFile) {
            return NextResponse.json(
                { error: 'No video file provided' },
                { status: 400 }
            )
        }

        console.log('Uploading video:', videoFile.name, 'Type:', videoFile.type, 'Size:', videoFile.size)

        // Generate unique filename with timestamp
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 8)
        const filename = `recipe-${timestamp}-${randomId}.webm`

        // Convert File to ArrayBuffer then to Buffer
        const arrayBuffer = await videoFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('recipe-videos')
            .upload(filename, buffer, {
                contentType: videoFile.type || 'video/webm',
                cacheControl: '3600',
                upsert: false
            })

        if (error) {
            console.error('Supabase storage error:', error)

            // Check if bucket doesn't exist
            if (error.message?.includes('Bucket not found')) {
                return NextResponse.json(
                    {
                        error: 'Storage bucket not configured',
                        details: 'Please create a "recipe-videos" bucket in Supabase Storage'
                    },
                    { status: 500 }
                )
            }

            return NextResponse.json(
                { error: 'Failed to upload video', details: error.message },
                { status: 500 }
            )
        }

        // Get public URL for the uploaded video
        const { data: publicUrlData } = supabase.storage
            .from('recipe-videos')
            .getPublicUrl(data.path)

        console.log('Video uploaded successfully:', publicUrlData.publicUrl)

        return NextResponse.json({
            url: publicUrlData.publicUrl,
            path: data.path,
            filename
        })
    } catch (error) {
        console.error('Error uploading video:', error)
        return NextResponse.json(
            { error: 'Failed to upload video', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
