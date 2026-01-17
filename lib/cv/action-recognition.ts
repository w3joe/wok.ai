/**
 * Action Recognition using MediaPipe Hand Landmarker
 * Detects cooking actions by tracking hand motion patterns
 */

import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision'

export type CookingActionType =
  | 'chopping'
  | 'stirring'
  | 'pouring'
  | 'mixing'
  | 'frying'
  | 'plating'
  | 'kneading'
  | 'slicing'
  | 'idle'
  | 'unknown'

export interface CookingAction {
  action: CookingActionType
  startTime: number
  endTime: number
  confidence: number
}

export interface HandPosition {
  timestamp: number
  landmarks: Array<{ x: number; y: number; z: number }>
  handedness: 'Left' | 'Right'
}

interface MotionPattern {
  frequency: number      // oscillations per second
  amplitude: number      // average movement distance
  circularity: number    // 0 = linear, 1 = circular
  verticalBias: number   // positive = up-down, negative = left-right
}

let handLandmarker: HandLandmarker | null = null

/**
 * Initialize MediaPipe Hand Landmarker
 */
export async function initializeHandTracker(): Promise<void> {
  if (handLandmarker) return

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  )

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU'
    },
    runningMode: 'IMAGE',
    numHands: 2
  })
}

/**
 * Detect hands in a single frame
 */
export async function detectHands(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<HandLandmarkerResult | null> {
  if (!handLandmarker) {
    await initializeHandTracker()
  }

  try {
    return handLandmarker!.detect(imageElement)
  } catch (error) {
    console.error('Hand detection error:', error)
    return null
  }
}

/**
 * Track hands across multiple frames from a video
 */
export async function trackHandsInVideo(
  videoSrc: string,
  sampleRate: number = 4, // 4 FPS for action detection
  onProgress?: (progress: number) => void
): Promise<HandPosition[]> {
  await initializeHandTracker()

  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    canvas.width = 640
    canvas.height = 360

    video.preload = 'auto'
    video.muted = true
    video.playsInline = true

    const positions: HandPosition[] = []
    let currentTime = 0

    video.onloadedmetadata = () => {
      const duration = video.duration
      const interval = 1 / sampleRate

      const processFrame = async () => {
        if (currentTime >= duration) {
          resolve(positions)
          return
        }

        video.currentTime = currentTime
      }

      video.onseeked = async () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const result = await detectHands(canvas)

        if (result && result.landmarks.length > 0) {
          result.landmarks.forEach((landmarks, idx) => {
            const handedness = result.handednesses[idx]?.[0]?.categoryName as 'Left' | 'Right' || 'Right'
            positions.push({
              timestamp: currentTime,
              landmarks: landmarks.map(l => ({ x: l.x, y: l.y, z: l.z })),
              handedness
            })
          })
        }

        onProgress?.(currentTime / duration)
        currentTime += interval
        processFrame()
      }

      processFrame()
    }

    video.onerror = () => reject(new Error('Failed to load video'))
    video.src = videoSrc
    video.load()
  })
}

/**
 * Analyze motion pattern from a sequence of hand positions
 */
function analyzeMotion(positions: HandPosition[], windowSize: number = 10): MotionPattern {
  if (positions.length < 2) {
    return { frequency: 0, amplitude: 0, circularity: 0, verticalBias: 0 }
  }

  // Use wrist landmark (index 0) for motion analysis
  const wristPositions = positions.map(p => ({
    x: p.landmarks[0].x,
    y: p.landmarks[0].y,
    t: p.timestamp
  }))

  // Calculate velocities
  const velocities: Array<{ dx: number; dy: number; dt: number }> = []
  for (let i = 1; i < wristPositions.length; i++) {
    const dt = wristPositions[i].t - wristPositions[i - 1].t
    if (dt > 0) {
      velocities.push({
        dx: (wristPositions[i].x - wristPositions[i - 1].x) / dt,
        dy: (wristPositions[i].y - wristPositions[i - 1].y) / dt,
        dt
      })
    }
  }

  if (velocities.length < 2) {
    return { frequency: 0, amplitude: 0, circularity: 0, verticalBias: 0 }
  }

  // Calculate amplitude (average speed)
  const speeds = velocities.map(v => Math.sqrt(v.dx * v.dx + v.dy * v.dy))
  const amplitude = speeds.reduce((a, b) => a + b, 0) / speeds.length

  // Detect oscillation frequency (direction changes per second)
  let directionChanges = 0
  for (let i = 1; i < velocities.length; i++) {
    const dotProduct = velocities[i].dx * velocities[i - 1].dx + velocities[i].dy * velocities[i - 1].dy
    if (dotProduct < 0) directionChanges++
  }
  const totalTime = wristPositions[wristPositions.length - 1].t - wristPositions[0].t
  const frequency = totalTime > 0 ? directionChanges / totalTime : 0

  // Calculate circularity (cross product consistency)
  let circularScore = 0
  for (let i = 1; i < velocities.length; i++) {
    const cross = velocities[i - 1].dx * velocities[i].dy - velocities[i - 1].dy * velocities[i].dx
    if (i > 1) {
      const prevCross = velocities[i - 2].dx * velocities[i - 1].dy - velocities[i - 2].dy * velocities[i - 1].dx
      if (Math.sign(cross) === Math.sign(prevCross)) circularScore++
    }
  }
  const circularity = velocities.length > 2 ? circularScore / (velocities.length - 2) : 0

  // Calculate vertical bias
  const avgDx = velocities.reduce((a, v) => a + Math.abs(v.dx), 0) / velocities.length
  const avgDy = velocities.reduce((a, v) => a + Math.abs(v.dy), 0) / velocities.length
  const verticalBias = avgDx + avgDy > 0 ? (avgDy - avgDx) / (avgDx + avgDy) : 0

  return { frequency, amplitude, circularity, verticalBias }
}

/**
 * Classify cooking action from motion pattern
 */
function classifyAction(pattern: MotionPattern): { action: CookingActionType; confidence: number } {
  const { frequency, amplitude, circularity, verticalBias } = pattern

  // Idle: very low amplitude
  if (amplitude < 0.05) {
    return { action: 'idle', confidence: 0.9 }
  }

  // Chopping: high frequency, vertical bias, low circularity
  if (frequency > 3 && verticalBias > 0.3 && circularity < 0.4) {
    return { action: 'chopping', confidence: Math.min(frequency / 5, 0.95) }
  }

  // Stirring: high circularity, moderate frequency
  if (circularity > 0.6 && frequency > 1 && frequency < 4) {
    return { action: 'stirring', confidence: circularity }
  }

  // Mixing: moderate circularity, irregular pattern
  if (circularity > 0.3 && circularity < 0.7 && amplitude > 0.15) {
    return { action: 'mixing', confidence: 0.6 }
  }

  // Pouring: dominant downward motion, low frequency
  if (verticalBias > 0.5 && frequency < 1 && amplitude > 0.1) {
    return { action: 'pouring', confidence: 0.7 }
  }

  // Frying/shaking: lateral motion, moderate frequency
  if (verticalBias < -0.2 && frequency > 1 && frequency < 3) {
    return { action: 'frying', confidence: 0.65 }
  }

  // Kneading: high amplitude, low frequency, mixed direction
  if (amplitude > 0.2 && frequency < 2 && Math.abs(verticalBias) < 0.3) {
    return { action: 'kneading', confidence: 0.6 }
  }

  // Slicing: horizontal motion with moderate frequency
  if (verticalBias < -0.3 && frequency > 1 && frequency < 4) {
    return { action: 'slicing', confidence: 0.55 }
  }

  return { action: 'unknown', confidence: 0.3 }
}

/**
 * Detect cooking actions in a video
 */
export async function detectCookingActions(
  videoSrc: string,
  onProgress?: (progress: number) => void
): Promise<CookingAction[]> {
  const positions = await trackHandsInVideo(videoSrc, 4, (p) => {
    onProgress?.(p * 0.8) // 80% for tracking
  })

  if (positions.length < 10) {
    return []
  }

  // Group positions by time windows (2-second windows with 1-second overlap)
  const windowSize = 2 // seconds
  const windowStep = 1 // seconds
  const actions: CookingAction[] = []

  const minTime = positions[0].timestamp
  const maxTime = positions[positions.length - 1].timestamp

  for (let windowStart = minTime; windowStart < maxTime - windowSize; windowStart += windowStep) {
    const windowEnd = windowStart + windowSize
    const windowPositions = positions.filter(
      p => p.timestamp >= windowStart && p.timestamp < windowEnd
    )

    if (windowPositions.length < 4) continue

    const pattern = analyzeMotion(windowPositions)
    const { action, confidence } = classifyAction(pattern)

    // Merge with previous action if same type
    const lastAction = actions[actions.length - 1]
    if (lastAction && lastAction.action === action && lastAction.endTime >= windowStart - windowStep) {
      lastAction.endTime = windowEnd
      lastAction.confidence = (lastAction.confidence + confidence) / 2
    } else if (action !== 'idle' && action !== 'unknown') {
      actions.push({
        action,
        startTime: windowStart,
        endTime: windowEnd,
        confidence
      })
    }
  }

  onProgress?.(1)

  // Filter out very short actions
  return actions.filter(a => a.endTime - a.startTime >= 1)
}

/**
 * Get unique techniques from detected actions
 */
export function extractTechniques(actions: CookingAction[]): string[] {
  const techniqueMap: Record<CookingActionType, string> = {
    chopping: 'chopping',
    stirring: 'stir-frying',
    pouring: 'adding liquid',
    mixing: 'mixing',
    frying: 'pan-frying',
    plating: 'plating',
    kneading: 'kneading',
    slicing: 'slicing',
    idle: '',
    unknown: ''
  }

  const techniques = new Set<string>()
  actions.forEach(a => {
    const technique = techniqueMap[a.action]
    if (technique) techniques.add(technique)
  })

  return Array.from(techniques)
}
