'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { VideoRecorder } from '@/components/VideoRecorder'
import { VideoUploader } from '@/components/VideoUploader'
import { VideoReview } from '@/components/VideoReview'
import { Header } from '@/components/Header'

import { VideoAnalyzer } from '@/components/TranscriptEditor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    ChefHat,
    Loader2,
    Globe,
    Video,
    CheckCircle2,
    Upload,
    Camera
} from 'lucide-react'

interface KeyMoment {
    timestamp: number
    type: 'ingredient' | 'technique' | 'doneness' | 'general'
    label: string
    description: string
}

interface ExtractedFrame {
    timestamp: number
    url: string
    label: string
    type: string
    notes?: string
}

interface RecipeData {
    title: string
    ingredients: string[]
    steps: string[]
    timing?: {
        prep?: number
        cook?: number
        total?: number
    }
    techniques?: string[]
}



type RecordingStep = 'setup' | 'transcribe' | 'analyzing' | 'review' | 'published'
type InputMode = 'record' | 'upload'

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文 (Chinese)' },
    { code: 'ms', name: 'Bahasa Melayu' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'th', name: 'ไทย (Thai)' },
]

export default function RecordVideoPage() {
    const router = useRouter()
    const [step, setStep] = useState<RecordingStep>('setup')
    const [inputMode, setInputMode] = useState<InputMode>('upload')
    const [language, setLanguage] = useState('en')
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
    const [videoUrl, setVideoUrl] = useState<string | null>(null)
    const [storageUrl, setStorageUrl] = useState<string | null>(null)
    const [transcript, setTranscript] = useState<string>('')
    const [keyMoments, setKeyMoments] = useState<KeyMoment[]>([])
    const [extractedFrames, setExtractedFrames] = useState<ExtractedFrame[]>([])
    const [recipe, setRecipe] = useState<RecipeData | null>(null)

    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisProgress, setAnalysisProgress] = useState('')
    const [error, setError] = useState<string | null>(null)

    const handleVideoReady = useCallback((blob: Blob, url: string) => {
        setVideoBlob(blob)
        setVideoUrl(url)
        // Go to transcribe step where user will speak/type the transcript
        setStep('transcribe')
    }, [])

    // Called when user manually submits video for old flow (not used in new flow)
    const handleUploadComplete = useCallback(async () => {
        // This is deprecated - now we use handleTranscriptReady
        setStep('transcribe')
    }, [])

    // Called when video is ready for analysis
    const handleAnalyzeVideo = useCallback(async () => {
        if (!videoBlob) {
            setError('No video available')
            return
        }

        setStep('analyzing')
        setIsAnalyzing(true)
        setError(null)
        setAnalysisProgress('Sending video to Gemini 2.5 Flash...')

        try {
            console.log('=== SENDING VIDEO TO GEMINI ===')
            console.log('Video size:', videoBlob.size, 'bytes')
            console.log('Video type:', videoBlob.type)

            const formData = new FormData()
            formData.append('video', videoBlob, 'video.webm')
            formData.append('language', language)

            const response = await fetch('/api/video/analyze', {
                method: 'POST',
                body: formData
            })

            const analysisData = await response.json()

            console.log('=== API RESPONSE ===')
            console.log('Status:', response.status)
            console.log('Response:', JSON.stringify(analysisData, null, 2))
            console.log('====================')

            if (!response.ok) {
                throw new Error(analysisData.error || 'Failed to analyze video')
            }

            // Display what AI analyzed
            setTranscript(analysisData.transcript || '')
            setKeyMoments(analysisData.keyMoments || [])
            setRecipe(analysisData.recipe)
            setExtractedFrames([])

            // Log the raw AI response for user to see
            if (analysisData.rawResponse) {
                console.log('=== RAW AI RESPONSE ===')
                console.log(analysisData.rawResponse)
                console.log('=======================')
            }

            setStep('review')
        } catch (err) {
            console.error('Analysis error:', err)
            setError(err instanceof Error ? err.message : 'Failed to analyze')
            setStep('transcribe')
        } finally {
            setIsAnalyzing(false)
            setAnalysisProgress('')
        }
    }, [language, videoBlob])

    // Extract frames from video using canvas
    const extractFramesFromVideo = async (
        videoSrc: string,
        moments: KeyMoment[]
    ): Promise<Array<{ timestamp: number; label: string; type: string; imageData: string }>> => {
        return new Promise((resolve) => {
            const video = document.createElement('video')
            video.src = videoSrc
            video.crossOrigin = 'anonymous'
            video.muted = true

            const frames: Array<{ timestamp: number; label: string; type: string; imageData: string }> = []
            let currentIndex = 0

            video.onloadedmetadata = () => {
                const canvas = document.createElement('canvas')
                canvas.width = 1280
                canvas.height = 720
                const ctx = canvas.getContext('2d')

                const captureFrame = () => {
                    if (currentIndex >= moments.length || !ctx) {
                        resolve(frames)
                        return
                    }

                    const moment = moments[currentIndex]
                    video.currentTime = moment.timestamp

                    video.onseeked = () => {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                        const imageData = canvas.toDataURL('image/jpeg', 0.8)

                        frames.push({
                            timestamp: moment.timestamp,
                            label: moment.label,
                            type: moment.type,
                            imageData
                        })

                        currentIndex++
                        captureFrame()
                    }
                }

                captureFrame()
            }

            video.onerror = () => {
                console.error('Failed to load video for frame extraction')
                resolve(frames)
            }

            video.load()
        })
    }

    const { user } = useAuth()

    const handlePublish = async () => {
        if (!recipe) return

        try {
            // Use Supabase client directly to ensure RLS policies work with the user's session
            const { error } = await supabase
                .from('recipes')
                .insert({
                    ...recipe,
                    transcript,
                    // If user is logged in, attach their ID. Supabase RLS will verify this matches auth.uid()
                    // If not logged in, user_id is undefined/null
                    user_id: user?.id || null
                })

            if (error) throw error

            setStep('published')
            setTimeout(() => router.push('/'), 2000)
        } catch (err) {
            console.error('Publish error:', err)
            setError(err instanceof Error ? err.message : 'Failed to publish')
        }
    }

    const handleStartOver = () => {
        setStep('setup')
        setVideoBlob(null)
        setVideoUrl(null)
        setStorageUrl(null)
        setTranscript('')
        setKeyMoments([])
        setExtractedFrames([])
        setRecipe(null)
        setError(null)
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="flex items-center gap-3 mb-8">
                    <Video className="h-8 w-8 text-primary" />
                    <h1 className="text-4xl font-bold">Record Video Recipe</h1>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
                    {['Setup', 'Transcribe', 'Analyze', 'Review'].map((label, idx) => {
                        const stepNames: RecordingStep[] = ['setup', 'transcribe', 'analyzing', 'review']
                        const isActive = stepNames.indexOf(step) >= idx
                        const isCurrent = stepNames[idx] === step

                        return (
                            <div key={label} className="flex items-center gap-2">
                                <Badge
                                    variant={isActive ? 'default' : 'outline'}
                                    className={isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}
                                >
                                    {idx + 1}. {label}
                                </Badge>
                                {idx < 3 && <div className="w-8 h-0.5 bg-muted" />}
                            </div>
                        )
                    })}
                </div>

                {/* Error Display */}
                {error && (
                    <Card className="mb-6 border-destructive">
                        <CardContent className="p-4">
                            <p className="text-destructive">{error}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => setError(null)}
                            >
                                Dismiss
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Step: Setup */}
                {step === 'setup' && (
                    <div className="space-y-6">
                        {/* Input Mode Toggle */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Video className="h-5 w-5" />
                                    Video Source
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant={inputMode === 'upload' ? 'default' : 'outline'}
                                        onClick={() => setInputMode('upload')}
                                        className="h-20 flex-col gap-2"
                                    >
                                        <Upload className="h-6 w-6" />
                                        <span>Upload Video</span>
                                    </Button>
                                    <Button
                                        variant={inputMode === 'record' ? 'default' : 'outline'}
                                        onClick={() => setInputMode('record')}
                                        className="h-20 flex-col gap-2"
                                    >
                                        <Camera className="h-6 w-6" />
                                        <span>Record Live</span>
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-3 text-center">
                                    {inputMode === 'upload'
                                        ? 'Upload an existing cooking video for AI analysis'
                                        : 'Record a new video using your camera'}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="h-5 w-5" />
                                    Language Selection
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Select the language used in the video narration.
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {LANGUAGES.map((lang) => (
                                        <Button
                                            key={lang.code}
                                            variant={language === lang.code ? 'default' : 'outline'}
                                            onClick={() => setLanguage(lang.code)}
                                            className="justify-start"
                                        >
                                            {lang.name}
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>



                        {/* Conditional: Upload or Record */}
                        {inputMode === 'upload' ? (
                            <VideoUploader
                                onVideoReady={handleVideoReady}
                                onUploadComplete={handleUploadComplete}
                            />
                        ) : (
                            <VideoRecorder
                                onVideoReady={handleVideoReady}
                                onUploadComplete={handleUploadComplete}
                            />
                        )}
                    </div>
                )}

                {/* Step: Analyze with Gemini */}
                {step === 'transcribe' && (
                    <VideoAnalyzer
                        videoUrl={videoUrl}
                        onAnalyze={handleAnalyzeVideo}
                        isAnalyzing={isAnalyzing}
                        analysisProgress={analysisProgress}
                    />
                )}

                {/* Step: Analyzing */}
                {step === 'analyzing' && (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-4 py-12">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="text-lg font-medium">Analyzing Your Video</p>
                            <p className="text-muted-foreground">{analysisProgress}</p>
                            <div className="text-sm text-muted-foreground space-y-1 text-center">
                                <p>• Transcribing your narration</p>
                                <p>• Identifying key cooking moments</p>
                                <p>• Extracting photos at critical points</p>
                                <p>• Generating labels and structure</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step: Review */}
                {step === 'review' && recipe && (
                    <VideoReview
                        recipe={recipe}
                        transcript={transcript}
                        videoUrl={storageUrl || videoUrl || ''}
                        frames={extractedFrames}
                        keyMoments={keyMoments}
                        onFramesUpdate={setExtractedFrames}
                        onRecipeUpdate={setRecipe}
                        onTranscriptUpdate={setTranscript}

                        onPublish={handlePublish}
                        onStartOver={handleStartOver}
                    />
                )}

                {/* Step: Published */}
                {step === 'published' && (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-4 py-12">
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                            <p className="text-2xl font-bold">Recipe Published!</p>
                            <p className="text-muted-foreground">Redirecting to home page...</p>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    )
}
