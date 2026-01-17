/**
 * Scene Detection using histogram-based frame differencing
 * Runs client-side using Canvas API - no external dependencies
 */

export interface SceneSegment {
  startTime: number
  endTime: number
  keyframeTimestamp: number
  keyframeDataUrl: string
  confidence: number
}

export interface SceneDetectionConfig {
  sampleRate: number        // frames per second to analyze (default: 2)
  changeThreshold: number   // histogram difference threshold (default: 0.35)
  minSceneDuration: number  // minimum scene length in seconds (default: 3)
}

const DEFAULT_CONFIG: SceneDetectionConfig = {
  sampleRate: 2,
  changeThreshold: 0.35,
  minSceneDuration: 3
}

interface FrameSample {
  timestamp: number
  histogram: number[]
  dataUrl: string
}

/**
 * Compute grayscale histogram from ImageData
 * Returns 256-bin histogram normalized to [0, 1]
 */
function computeHistogram(imageData: ImageData): number[] {
  const histogram = new Array(256).fill(0)
  const data = imageData.data
  const pixelCount = data.length / 4

  for (let i = 0; i < data.length; i += 4) {
    // Convert to grayscale using luminance formula
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    histogram[gray]++
  }

  // Normalize
  for (let i = 0; i < 256; i++) {
    histogram[i] /= pixelCount
  }

  return histogram
}

/**
 * Calculate chi-squared distance between two histograms
 * Returns value in [0, 1] where higher = more different
 */
function histogramDistance(h1: number[], h2: number[]): number {
  let distance = 0
  for (let i = 0; i < 256; i++) {
    const sum = h1[i] + h2[i]
    if (sum > 0) {
      distance += Math.pow(h1[i] - h2[i], 2) / sum
    }
  }
  return Math.min(distance / 2, 1) // Normalize to [0, 1]
}

/**
 * Sample frames from video at specified intervals
 */
async function sampleFrames(
  videoSrc: string,
  config: SceneDetectionConfig,
  onProgress?: (progress: number) => void
): Promise<FrameSample[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    // Use smaller resolution for histogram computation (faster)
    canvas.width = 320
    canvas.height = 180

    video.preload = 'auto'
    video.muted = true
    video.playsInline = true

    const frames: FrameSample[] = []
    let currentTime = 0

    video.onloadedmetadata = () => {
      const duration = video.duration
      const interval = 1 / config.sampleRate
      const totalFrames = Math.floor(duration * config.sampleRate)

      const captureFrame = () => {
        if (currentTime >= duration) {
          resolve(frames)
          return
        }

        video.currentTime = currentTime
      }

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const histogram = computeHistogram(imageData)

        // Get higher-res frame for keyframe (if needed)
        const fullCanvas = document.createElement('canvas')
        fullCanvas.width = 1280
        fullCanvas.height = 720
        const fullCtx = fullCanvas.getContext('2d')
        fullCtx?.drawImage(video, 0, 0, fullCanvas.width, fullCanvas.height)

        frames.push({
          timestamp: currentTime,
          histogram,
          dataUrl: fullCanvas.toDataURL('image/jpeg', 0.8)
        })

        if (onProgress) {
          onProgress(Math.min(currentTime / duration, 1))
        }

        currentTime += interval
        captureFrame()
      }

      captureFrame()
    }

    video.onerror = () => reject(new Error('Failed to load video'))
    video.src = videoSrc
    video.load()
  })
}

/**
 * Detect scene changes from frame samples
 */
function detectSceneChanges(
  frames: FrameSample[],
  config: SceneDetectionConfig
): number[] {
  const sceneChanges: number[] = [0] // First frame is always a scene start

  for (let i = 1; i < frames.length; i++) {
    const distance = histogramDistance(frames[i - 1].histogram, frames[i].histogram)

    if (distance > config.changeThreshold) {
      // Check minimum duration since last scene change
      const lastChangeIdx = sceneChanges[sceneChanges.length - 1]
      const lastChangeTime = frames[lastChangeIdx].timestamp
      const currentTime = frames[i].timestamp

      if (currentTime - lastChangeTime >= config.minSceneDuration) {
        sceneChanges.push(i)
      }
    }
  }

  return sceneChanges
}

/**
 * Select best keyframe from each scene segment
 * Uses the frame closest to the middle of the segment
 */
function selectKeyframes(
  frames: FrameSample[],
  sceneChanges: number[]
): Map<number, number> {
  const keyframes = new Map<number, number>()

  for (let i = 0; i < sceneChanges.length; i++) {
    const sceneStart = sceneChanges[i]
    const sceneEnd = i < sceneChanges.length - 1 ? sceneChanges[i + 1] : frames.length

    // Select middle frame as keyframe
    const keyframeIdx = Math.floor((sceneStart + sceneEnd) / 2)
    keyframes.set(i, keyframeIdx)
  }

  return keyframes
}

/**
 * Main function: Detect scenes in a video
 */
export async function detectScenes(
  videoSrc: string,
  config: Partial<SceneDetectionConfig> = {},
  onProgress?: (progress: number) => void
): Promise<SceneSegment[]> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }

  // Sample frames
  const frames = await sampleFrames(videoSrc, fullConfig, (p) => {
    onProgress?.(p * 0.7) // 70% of progress is frame sampling
  })

  if (frames.length < 2) {
    // Return single scene for very short videos
    return [{
      startTime: 0,
      endTime: frames[0]?.timestamp || 0,
      keyframeTimestamp: 0,
      keyframeDataUrl: frames[0]?.dataUrl || '',
      confidence: 1
    }]
  }

  // Detect scene changes
  const sceneChanges = detectSceneChanges(frames, fullConfig)
  onProgress?.(0.85)

  // Select keyframes
  const keyframes = selectKeyframes(frames, sceneChanges)
  onProgress?.(0.95)

  // Build scene segments
  const segments: SceneSegment[] = []

  for (let i = 0; i < sceneChanges.length; i++) {
    const startIdx = sceneChanges[i]
    const endIdx = i < sceneChanges.length - 1 ? sceneChanges[i + 1] - 1 : frames.length - 1
    const keyframeIdx = keyframes.get(i) || startIdx

    // Calculate confidence based on histogram distance at boundaries
    let confidence = 1
    if (i > 0) {
      const prevDistance = histogramDistance(
        frames[sceneChanges[i] - 1].histogram,
        frames[sceneChanges[i]].histogram
      )
      confidence = Math.min(prevDistance / fullConfig.changeThreshold, 1)
    }

    segments.push({
      startTime: frames[startIdx].timestamp,
      endTime: frames[endIdx].timestamp,
      keyframeTimestamp: frames[keyframeIdx].timestamp,
      keyframeDataUrl: frames[keyframeIdx].dataUrl,
      confidence
    })
  }

  onProgress?.(1)
  return segments
}

/**
 * Extract keyframes from detected scenes as base64 images
 */
export function getKeyframeImages(segments: SceneSegment[]): Array<{
  timestamp: number
  dataUrl: string
  sceneIndex: number
}> {
  return segments.map((segment, index) => ({
    timestamp: segment.keyframeTimestamp,
    dataUrl: segment.keyframeDataUrl,
    sceneIndex: index
  }))
}
