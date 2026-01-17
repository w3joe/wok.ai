import { NextRequest, NextResponse } from 'next/server'
import vision from '@google-cloud/vision'

interface DetectedObject {
  label: string
  confidence: number
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
}

// Initialize Vision API client
function getVisionClient() {
  const credentials = process.env.GOOGLE_CLOUD_VISION_KEY

  if (!credentials) {
    throw new Error('GOOGLE_CLOUD_VISION_KEY not configured')
  }

  // Parse credentials JSON
  let parsedCredentials
  try {
    parsedCredentials = JSON.parse(credentials)
  } catch {
    throw new Error('Invalid GOOGLE_CLOUD_VISION_KEY format')
  }

  return new vision.ImageAnnotatorClient({
    credentials: parsedCredentials
  })
}

export async function POST(request: NextRequest) {
  try {
    const { imageData, timestamp } = await request.json()

    if (!imageData) {
      return NextResponse.json(
        { error: 'imageData is required' },
        { status: 400 }
      )
    }

    // Extract base64 content (remove data URL prefix if present)
    let base64Content = imageData
    if (imageData.startsWith('data:')) {
      base64Content = imageData.split(',')[1]
    }

    const client = getVisionClient()

    // Run label detection and object localization
    const [labelResult] = await client.labelDetection({
      image: { content: base64Content }
    })

    const [objectResult] = await client.objectLocalization({
      image: { content: base64Content }
    })

    const objects: DetectedObject[] = []

    // Process label annotations
    const labels = labelResult.labelAnnotations || []
    for (const label of labels) {
      if (label.description && label.score && label.score > 0.5) {
        objects.push({
          label: label.description,
          confidence: label.score
        })
      }
    }

    // Process object localizations (with bounding boxes)
    const localizedObjects = objectResult.localizedObjectAnnotations || []
    for (const obj of localizedObjects) {
      if (obj.name && obj.score && obj.score > 0.5) {
        const vertices = obj.boundingPoly?.normalizedVertices || []
        let boundingBox

        if (vertices.length >= 4) {
          const x = vertices[0]?.x || 0
          const y = vertices[0]?.y || 0
          const width = (vertices[2]?.x || 0) - x
          const height = (vertices[2]?.y || 0) - y

          boundingBox = { x, y, width, height }
        }

        // Avoid duplicates with labels
        const existing = objects.find(
          o => o.label.toLowerCase() === obj.name!.toLowerCase()
        )

        if (existing) {
          // Update with bounding box if we have it
          if (boundingBox) {
            existing.boundingBox = boundingBox
          }
          // Use higher confidence
          if (obj.score > existing.confidence) {
            existing.confidence = obj.score
          }
        } else {
          objects.push({
            label: obj.name,
            confidence: obj.score,
            boundingBox
          })
        }
      }
    }

    // Sort by confidence
    objects.sort((a, b) => b.confidence - a.confidence)

    return NextResponse.json({
      objects,
      timestamp,
      labelCount: labels.length,
      objectCount: localizedObjects.length
    })

  } catch (error) {
    console.error('Vision API error:', error)

    const message = error instanceof Error ? error.message : 'Vision API failed'

    // Check for specific errors
    if (message.includes('GOOGLE_CLOUD_VISION_KEY')) {
      return NextResponse.json(
        { error: 'Vision API not configured', objects: [] },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: message, objects: [] },
      { status: 500 }
    )
  }
}
