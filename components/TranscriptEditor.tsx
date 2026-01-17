'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Play, Sparkles } from 'lucide-react'

interface VideoAnalyzerProps {
    videoUrl: string | null
    onAnalyze: () => void
    isAnalyzing: boolean
    analysisProgress?: string
}

export function VideoAnalyzer({ videoUrl, onAnalyze, isAnalyzing, analysisProgress }: VideoAnalyzerProps) {
    const [isPlaying, setIsPlaying] = useState(false)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Analyze Video with AI
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Video Player */}
                {videoUrl && (
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                        <video
                            src={videoUrl}
                            className="w-full h-full"
                            controls
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onEnded={() => setIsPlaying(false)}
                        />
                    </div>
                )}

                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                        🤖 Gemini 2.5 Flash will:
                    </p>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                        <li>Watch and analyze the video</li>
                        <li>Transcribe any speech/narration</li>
                        <li>Extract ingredients and cooking steps</li>
                        <li>Identify key moments and techniques</li>
                    </ul>
                </div>

                {/* Status */}
                {isAnalyzing && (
                    <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <div>
                            <p className="font-medium">Analyzing video...</p>
                            <p className="text-sm text-muted-foreground">
                                {analysisProgress || 'This may take a minute for longer videos'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Analyze Button */}
                <Button
                    onClick={onAnalyze}
                    disabled={!videoUrl || isAnalyzing}
                    size="lg"
                    className="w-full"
                >
                    {isAnalyzing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing with Gemini 2.5 Flash...
                        </>
                    ) : (
                        <>
                            <Play className="mr-2 h-4 w-4" />
                            Analyze Video
                        </>
                    )}
                </Button>

                {/* Debug info */}
                <p className="text-xs text-muted-foreground text-center">
                    Video will be sent to Gemini AI for analysis. Check browser console for detailed logs.
                </p>
            </CardContent>
        </Card>
    )
}
