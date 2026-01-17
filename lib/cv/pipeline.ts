/**
 * CV Pipeline Orchestrator
 * Coordinates all CV stages: scene detection, vision API, action recognition, transcription
 */

import { detectScenes, getKeyframeImages, SceneSegment } from './scene-detection'
import { detectCookingActions, CookingAction, initializeHandTracker } from './action-recognition'
import { extractIngredientsFromSegments, ExtractedIngredient, TranscriptSegment } from './transcript-parser'
import { assembleRecipe, AssembledRecipe, categorizeVisionLabel, VisionDetectedObject, CVAnalysisResult } from './assembly'

export interface CVPipelineProgress {
  stage: 'scene-detection' | 'vision-api' | 'action-recognition' | 'transcription' | 'assembly' | 'polish'
  progress: number
  message: string
}

export interface CVPipelineOptions {
  enableActionRecognition?: boolean  // Can be disabled if hands not visible
  enableVisionAPI?: boolean          // Requires API key
  onProgress?: (progress: CVPipelineProgress) => void
}

const DEFAULT_OPTIONS: CVPipelineOptions = {
  enableActionRecognition: true,
  enableVisionAPI: true
}

/**
 * Run the complete CV pipeline on a video
 */
export async function runCVPipeline(
  videoBlob: Blob,
  options: CVPipelineOptions = {}
): Promise<{
  assembled: AssembledRecipe
  raw: CVAnalysisResult
}> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const { onProgress } = opts

  // Create object URL for video
  const videoUrl = URL.createObjectURL(videoBlob)

  try {
    // Stage 1: Scene Detection
    onProgress?.({
      stage: 'scene-detection',
      progress: 0,
      message: 'Detecting scene changes...'
    })

    const scenes = await detectScenes(videoUrl, {}, (p) => {
      onProgress?.({
        stage: 'scene-detection',
        progress: p,
        message: 'Analyzing video frames...'
      })
    })

    // Get video duration
    const videoDuration = await getVideoDuration(videoUrl)

    // Stage 2: Vision API (server-side)
    let visionObjects: VisionDetectedObject[] = []
    if (opts.enableVisionAPI) {
      onProgress?.({
        stage: 'vision-api',
        progress: 0,
        message: 'Sending keyframes to Vision API...'
      })

      const keyframes = getKeyframeImages(scenes)
      visionObjects = await analyzeKeyframesWithVisionAPI(keyframes, (p) => {
        onProgress?.({
          stage: 'vision-api',
          progress: p,
          message: 'Identifying objects in frames...'
        })
      })
    }

    // Stage 3: Action Recognition (optional)
    let actions: CookingAction[] = []
    if (opts.enableActionRecognition) {
      onProgress?.({
        stage: 'action-recognition',
        progress: 0,
        message: 'Tracking hand movements...'
      })

      try {
        await initializeHandTracker()
        actions = await detectCookingActions(videoUrl, (p) => {
          onProgress?.({
            stage: 'action-recognition',
            progress: p,
            message: 'Recognizing cooking actions...'
          })
        })
      } catch (error) {
        console.warn('Action recognition failed, continuing without it:', error)
      }
    }

    // Stage 4: Transcription (server-side)
    onProgress?.({
      stage: 'transcription',
      progress: 0,
      message: 'Transcribing audio...'
    })

    const transcript = await transcribeAudio(videoBlob, (p) => {
      onProgress?.({
        stage: 'transcription',
        progress: p,
        message: 'Converting speech to text...'
      })
    })

    // Extract ingredients from transcript
    const transcriptIngredients = extractIngredientsFromSegments(transcript.segments)

    // Stage 5: Assembly
    onProgress?.({
      stage: 'assembly',
      progress: 0,
      message: 'Assembling recipe...'
    })

    const rawData: CVAnalysisResult = {
      scenes,
      visionObjects,
      actions,
      transcriptIngredients,
      transcript,
      videoDuration
    }

    const assembled = assembleRecipe(rawData)

    onProgress?.({
      stage: 'assembly',
      progress: 1,
      message: 'Recipe assembled!'
    })

    return { assembled, raw: rawData }

  } finally {
    URL.revokeObjectURL(videoUrl)
  }
}

/**
 * Get video duration
 */
async function getVideoDuration(videoUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => resolve(video.duration)
    video.onerror = () => reject(new Error('Failed to load video'))
    video.src = videoUrl
  })
}

/**
 * Send keyframes to Vision API for object detection
 */
async function analyzeKeyframesWithVisionAPI(
  keyframes: Array<{ timestamp: number; dataUrl: string; sceneIndex: number }>,
  onProgress?: (progress: number) => void
): Promise<VisionDetectedObject[]> {
  const allObjects: VisionDetectedObject[] = []

  for (let i = 0; i < keyframes.length; i++) {
    const keyframe = keyframes[i]

    try {
      const response = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: keyframe.dataUrl,
          timestamp: keyframe.timestamp
        })
      })

      if (response.ok) {
        const data = await response.json()
        const objects = data.objects || []

        for (const obj of objects) {
          allObjects.push({
            label: obj.label,
            confidence: obj.confidence,
            category: categorizeVisionLabel(obj.label),
            timestamp: keyframe.timestamp
          })
        }
      }
    } catch (error) {
      console.warn(`Vision API failed for keyframe ${i}:`, error)
    }

    onProgress?.((i + 1) / keyframes.length)
  }

  // Deduplicate objects
  const seen = new Map<string, VisionDetectedObject>()
  for (const obj of allObjects) {
    const key = obj.label.toLowerCase()
    const existing = seen.get(key)
    if (!existing || obj.confidence > existing.confidence) {
      seen.set(key, obj)
    }
  }

  return Array.from(seen.values())
}

/**
 * Transcribe audio using Whisper API
 */
async function transcribeAudio(
  videoBlob: Blob,
  onProgress?: (progress: number) => void
): Promise<{ fullText: string; segments: TranscriptSegment[] }> {
  onProgress?.(0.1)

  const formData = new FormData()
  formData.append('video', videoBlob)

  const response = await fetch('/api/audio/transcribe', {
    method: 'POST',
    body: formData
  })

  onProgress?.(0.9)

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Transcription failed: ${error}`)
  }

  const data = await response.json()
  onProgress?.(1)

  return {
    fullText: data.text || '',
    segments: data.segments || []
  }
}

/**
 * Polish recipe with minimal LLM
 */
export async function polishRecipeWithLLM(
  assembled: AssembledRecipe
): Promise<AssembledRecipe> {
  const response = await fetch('/api/recipe/polish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assembled)
  })

  if (!response.ok) {
    console.warn('LLM polish failed, returning unpolished recipe')
    return assembled
  }

  const polished = await response.json()
  return {
    ...assembled,
    title: polished.title || assembled.title,
    ingredients: polished.ingredients || assembled.ingredients,
    steps: polished.steps || assembled.steps,
    techniques: polished.techniques || assembled.techniques
  }
}

/**
 * Full pipeline including LLM polish
 */
export async function runFullCVPipeline(
  videoBlob: Blob,
  options: CVPipelineOptions = {}
): Promise<AssembledRecipe> {
  const { onProgress } = options

  // Run CV pipeline
  const { assembled } = await runCVPipeline(videoBlob, options)

  // Polish with LLM
  onProgress?.({
    stage: 'polish',
    progress: 0,
    message: 'Polishing recipe text...'
  })

  const polished = await polishRecipeWithLLM(assembled)

  onProgress?.({
    stage: 'polish',
    progress: 1,
    message: 'Done!'
  })

  return polished
}

// Re-export types for convenience
export type {
  SceneSegment,
  CookingAction,
  ExtractedIngredient,
  TranscriptSegment,
  VisionDetectedObject,
  CVAnalysisResult,
  AssembledRecipe
}
