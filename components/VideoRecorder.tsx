'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Video, VideoOff, Loader2, Upload, Camera } from 'lucide-react'

interface VideoRecorderProps {
    onVideoReady: (videoBlob: Blob, videoUrl: string) => void
    onUploadComplete?: (storageUrl: string) => void
}

export function VideoRecorder({ onVideoReady, onUploadComplete }: VideoRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isPreviewing, setIsPreviewing] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
    const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const videoRef = useRef<HTMLVideoElement>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const chunksRef = useRef<Blob[]>([])

    const startPreview = useCallback(async () => {
        try {
            setError(null)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'environment' // Prefer back camera for cooking
                },
                audio: true
            })

            streamRef.current = stream

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.muted = true // Mute preview to avoid feedback
                await videoRef.current.play()
            }

            setIsPreviewing(true)
        } catch (err) {
            console.error('Error accessing camera:', err)
            setError('Failed to access camera. Please check permissions.')
        }
    }, [])

    const stopPreview = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
        setIsPreviewing(false)
    }, [])

    const startRecording = useCallback(() => {
        if (!streamRef.current) return

        chunksRef.current = []

        // Use webm with VP9 codec for better quality
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
            ? 'video/webm;codecs=vp9,opus'
            : 'video/webm'

        const mediaRecorder = new MediaRecorder(streamRef.current, {
            mimeType,
            videoBitsPerSecond: 2500000 // 2.5 Mbps for good quality
        })

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunksRef.current.push(e.data)
            }
        }

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: mimeType })
            const url = URL.createObjectURL(blob)

            setRecordedBlob(blob)
            setRecordedUrl(url)

            // Show recorded video in the player
            if (videoRef.current) {
                videoRef.current.srcObject = null
                videoRef.current.src = url
                videoRef.current.muted = false
                videoRef.current.controls = true
            }

            onVideoReady(blob, url)
        }

        mediaRecorderRef.current = mediaRecorder
        mediaRecorder.start(1000) // Collect data every second
        setIsRecording(true)
    }, [onVideoReady])

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            stopPreview()
        }
    }, [isRecording, stopPreview])

    const uploadVideo = useCallback(async () => {
        if (!recordedBlob) return

        setIsUploading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('video', recordedBlob, 'recording.webm')

            const response = await fetch('/api/video/upload', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
                throw new Error(errorData.error || 'Failed to upload video')
            }

            const data = await response.json()
            console.log('Video uploaded:', data.url)

            if (onUploadComplete) {
                onUploadComplete(data.url)
            }
        } catch (err) {
            console.error('Error uploading video:', err)
            setError(err instanceof Error ? err.message : 'Failed to upload video')
        } finally {
            setIsUploading(false)
        }
    }, [recordedBlob, onUploadComplete])

    const resetRecording = useCallback(() => {
        if (recordedUrl) {
            URL.revokeObjectURL(recordedUrl)
        }
        setRecordedBlob(null)
        setRecordedUrl(null)
        if (videoRef.current) {
            videoRef.current.src = ''
            videoRef.current.controls = false
        }
        setError(null)
    }, [recordedUrl])

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Record Your Cooking
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {/* Video Preview/Playback */}
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                    />

                    {!isPreviewing && !recordedUrl && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-muted-foreground">Camera preview will appear here</p>
                        </div>
                    )}

                    {isRecording && (
                        <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive/90 text-destructive-foreground px-3 py-1.5 rounded-full">
                            <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
                            <span className="text-sm font-medium">Recording</span>
                        </div>
                    )}
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-3 bg-destructive/10 rounded-md border border-destructive/20">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                {/* Instructions */}
                <p className="text-sm text-muted-foreground text-center">
                    {!isPreviewing && !recordedUrl
                        ? 'Click "Start Camera" to begin. Narrate your recipe while cooking!'
                        : isPreviewing && !isRecording
                            ? 'Camera ready. Click "Start Recording" when you\'re ready to cook.'
                            : isRecording
                                ? 'Recording... Narrate your steps clearly. Click "Stop" when done.'
                                : 'Review your recording. Upload when satisfied, or record again.'}
                </p>

                {/* Control Buttons */}
                <div className="flex gap-3 justify-center flex-wrap">
                    {!isPreviewing && !recordedUrl && (
                        <Button onClick={startPreview} size="lg">
                            <Camera className="mr-2 h-4 w-4" />
                            Start Camera
                        </Button>
                    )}

                    {isPreviewing && !isRecording && !recordedUrl && (
                        <>
                            <Button onClick={startRecording} size="lg" variant="default">
                                <Video className="mr-2 h-4 w-4" />
                                Start Recording
                            </Button>
                            <Button onClick={stopPreview} size="lg" variant="outline">
                                Cancel
                            </Button>
                        </>
                    )}

                    {isRecording && (
                        <Button onClick={stopRecording} size="lg" variant="destructive">
                            <VideoOff className="mr-2 h-4 w-4" />
                            Stop Recording
                        </Button>
                    )}

                    {recordedUrl && !isUploading && (
                        <>
                            <Button onClick={uploadVideo} size="lg">
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload & Continue
                                    </>
                                )}
                            </Button>
                            <Button onClick={resetRecording} size="lg" variant="outline">
                                Record Again
                            </Button>
                        </>
                    )}

                    {isUploading && (
                        <Button disabled size="lg">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
