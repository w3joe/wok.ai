'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileVideo, Loader2, X } from 'lucide-react'

interface VideoUploaderProps {
    onVideoReady: (videoBlob: Blob, videoUrl: string) => void
    onUploadComplete?: (storageUrl: string) => void
}

export function VideoUploader({ onVideoReady, onUploadComplete }: VideoUploaderProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('video/')) {
            setError('Please select a video file')
            return
        }

        // Validate file size (max 500MB)
        if (file.size > 500 * 1024 * 1024) {
            setError('Video file must be under 500MB')
            return
        }

        setError(null)
        setSelectedFile(file)

        // Create preview URL
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)

        // Notify parent
        onVideoReady(file, url)
    }

    const handleAnalyze = async () => {
        if (!selectedFile || !previewUrl) return

        setIsUploading(true)
        setError(null)

        try {
            // Skip storage upload - pass the local blob URL and file directly
            // The analyze API will receive the video as form data
            console.log('Starting analysis with local video file...')

            if (onUploadComplete) {
                // Pass the local preview URL - analysis will use the blob
                onUploadComplete(previewUrl)
            }
        } catch (err) {
            console.error('Error starting analysis:', err)
            setError(err instanceof Error ? err.message : 'Failed to start analysis')
            setIsUploading(false)
        }
        // Note: isUploading stays true until parent handles the flow
    }

    const handleClear = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
        }
        setSelectedFile(null)
        setPreviewUrl(null)
        setError(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Cooking Video
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Video Preview */}
                {previewUrl ? (
                    <div className="space-y-4">
                        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                            <video
                                src={previewUrl}
                                controls
                                className="w-full h-full object-contain"
                            />
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={handleClear}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileVideo className="h-4 w-4" />
                            <span className="truncate">{selectedFile?.name}</span>
                            <span>({(selectedFile?.size || 0 / 1024 / 1024).toFixed(1)} MB)</span>
                        </div>
                    </div>
                ) : (
                    <div
                        className="aspect-video bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="h-12 w-12 text-muted-foreground" />
                        <div className="text-center">
                            <p className="text-muted-foreground">Drop a video file or click to browse</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">MP4, WebM, MOV up to 500MB</p>
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="p-3 bg-destructive/10 rounded-md border border-destructive/20">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                {/* Action Buttons */}
                {selectedFile && !isUploading && (
                    <div className="flex gap-3">
                        <Button onClick={handleAnalyze} size="lg" className="flex-1">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload & Analyze
                        </Button>
                        <Button onClick={handleClear} size="lg" variant="outline">
                            Clear
                        </Button>
                    </div>
                )}

                {isUploading && (
                    <Button disabled size="lg" className="w-full">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                    </Button>
                )}

                {!selectedFile && (
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        size="lg"
                        variant="outline"
                        className="w-full"
                    >
                        <FileVideo className="mr-2 h-4 w-4" />
                        Select Video File
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
