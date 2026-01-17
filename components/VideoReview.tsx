'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Clock,
    ChefHat,
    Check,
    Loader2,
    Play,
    Edit2,
    Image as ImageIcon,
    FileText,
    Save,
    Plus,
    Trash2
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

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



interface VideoReviewProps {
    recipe: RecipeData
    transcript: string
    videoUrl: string
    frames: ExtractedFrame[]
    keyMoments: KeyMoment[]
    onFramesUpdate: (frames: ExtractedFrame[]) => void
    onRecipeUpdate: (recipe: RecipeData) => void
    onTranscriptUpdate: (transcript: string) => void
    onPublish: () => void
    onStartOver: () => void
}

export function VideoReview({
    recipe,
    transcript,
    videoUrl,
    frames,
    keyMoments,
    onFramesUpdate,
    onRecipeUpdate,
    onTranscriptUpdate,
    onPublish,
    onStartOver
}: VideoReviewProps) {
    const [isPublishing, setIsPublishing] = useState(false)
    const [editingFrameIndex, setEditingFrameIndex] = useState<number | null>(null)
    const [editingTitle, setEditingTitle] = useState(false)
    const [showTranscript, setShowTranscript] = useState(false)

    const handlePublish = async () => {
        setIsPublishing(true)
        try {
            await onPublish()
        } finally {
            setIsPublishing(false)
        }
    }

    const updateFrameLabel = (index: number, newLabel: string) => {
        const updatedFrames = [...frames]
        updatedFrames[index] = { ...updatedFrames[index], label: newLabel }
        onFramesUpdate(updatedFrames)
        setEditingFrameIndex(null)
    }

    const updateFrameNotes = (index: number, notes: string) => {
        const updatedFrames = [...frames]
        updatedFrames[index] = { ...updatedFrames[index], notes }
        onFramesUpdate(updatedFrames)
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'ingredient': return 'bg-green-100 text-green-800 border-green-200'
            case 'technique': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'doneness': return 'bg-orange-100 text-orange-800 border-orange-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    return (
        <div className="space-y-6">
            {/* Recipe Title */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        {editingTitle ? (
                            <Input
                                value={recipe.title}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onRecipeUpdate({ ...recipe, title: e.target.value })}
                                onBlur={() => setEditingTitle(false)}
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && setEditingTitle(false)}
                                className="text-2xl font-bold"
                                autoFocus
                            />
                        ) : (
                            <CardTitle
                                className="text-3xl cursor-pointer hover:text-primary flex items-center gap-2"
                                onClick={() => setEditingTitle(true)}
                            >
                                {recipe.title}
                                <Edit2 className="h-4 w-4 opacity-50" />
                            </CardTitle>
                        )}
                    </div>
                    <div className="flex gap-2 pt-2 flex-wrap">

                        {recipe.timing && (
                            <Badge variant="secondary">
                                <Clock className="mr-1 h-3 w-3" />
                                {recipe.timing.total || (recipe.timing.prep || 0) + (recipe.timing.cook || 0)} min
                            </Badge>
                        )}
                        {recipe.techniques && recipe.techniques.length > 0 && (
                            <Badge variant="secondary">
                                <ChefHat className="mr-1 h-3 w-3" />
                                {recipe.techniques.length} techniques
                            </Badge>
                        )}
                    </div>
                </CardHeader>
            </Card>

            {/* Video Player with Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Play className="h-5 w-5" />
                        Video Preview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                        <video
                            src={videoUrl}
                            controls
                            className="w-full h-full"
                        />
                    </div>

                    {/* Timeline Markers */}
                    {keyMoments.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Key Moments</p>
                            <div className="flex flex-wrap gap-2">
                                {keyMoments.map((moment, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="outline"
                                        className={`cursor-pointer ${getTypeColor(moment.type)}`}
                                    >
                                        {formatTime(moment.timestamp)} - {moment.label}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Extracted Frames Gallery */}
            {frames.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5" />
                            Extracted Photos ({frames.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {frames.map((frame, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="aspect-video bg-muted rounded-lg overflow-hidden relative group">
                                        <img
                                            src={frame.url}
                                            alt={frame.label}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                            <Badge className={`text-xs ${getTypeColor(frame.type)}`}>
                                                {formatTime(frame.timestamp)}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Editable Label */}
                                    {editingFrameIndex === idx ? (
                                        <Input
                                            value={frame.label}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const updatedFrames = [...frames]
                                                updatedFrames[idx] = { ...frame, label: e.target.value }
                                                onFramesUpdate(updatedFrames)
                                            }}
                                            onBlur={() => setEditingFrameIndex(null)}
                                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && setEditingFrameIndex(null)}
                                            className="text-sm"
                                            autoFocus
                                        />
                                    ) : (
                                        <p
                                            className="text-sm font-medium cursor-pointer hover:text-primary flex items-center gap-1"
                                            onClick={() => setEditingFrameIndex(idx)}
                                        >
                                            {frame.label}
                                            <Edit2 className="h-3 w-3 opacity-50" />
                                        </p>
                                    )}

                                    {/* Notes */}
                                    <Input
                                        value={frame.notes || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFrameNotes(idx, e.target.value)}
                                        placeholder="Add notes..."
                                        className="text-xs"
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Ingredients */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Ingredients</CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            const newIngredients = [...recipe.ingredients, '']
                            onRecipeUpdate({ ...recipe, ingredients: newIngredients })
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Ingredient
                    </Button>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {recipe.ingredients.map((ingredient, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                                <div className="h-4 w-4 shrink-0 mt-1">
                                    <Check className="h-4 w-4 text-primary" />
                                </div>
                                <Input
                                    value={ingredient}
                                    onChange={(e) => {
                                        const newIngredients = [...recipe.ingredients]
                                        newIngredients[idx] = e.target.value
                                        onRecipeUpdate({ ...recipe, ingredients: newIngredients })
                                    }}
                                    placeholder="Ingredient amount and name"
                                    className="flex-1"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        const newIngredients = recipe.ingredients.filter((_, i) => i !== idx)
                                        onRecipeUpdate({ ...recipe, ingredients: newIngredients })
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            {/* Steps */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Instructions</CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            const newSteps = [...recipe.steps, '']
                            onRecipeUpdate({ ...recipe, steps: newSteps })
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Step
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recipe.steps.map((step, idx) => (
                            <div key={idx} className="flex gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold mt-1">
                                    {idx + 1}
                                </span>
                                <Textarea
                                    value={step}
                                    onChange={(e) => {
                                        const newSteps = [...recipe.steps]
                                        newSteps[idx] = e.target.value
                                        onRecipeUpdate({ ...recipe, steps: newSteps })
                                    }}
                                    placeholder={`Step ${idx + 1} instructions...`}
                                    className="flex-1 min-h-[80px]"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mt-1"
                                    onClick={() => {
                                        const newSteps = recipe.steps.filter((_, i) => i !== idx)
                                        onRecipeUpdate({ ...recipe, steps: newSteps })
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Transcript */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => setShowTranscript(!showTranscript)}
                        >
                            <FileText className="h-5 w-5" />
                            Original Transcript
                            <Badge variant="outline" className="ml-2">
                                {showTranscript ? 'Hide' : 'Show'}
                            </Badge>
                        </CardTitle>
                    </div>
                </CardHeader>
                {showTranscript && (
                    <CardContent>
                        <Textarea
                            value={transcript}
                            onChange={(e) => onTranscriptUpdate(e.target.value)}
                            className="min-h-[200px] font-mono text-sm leading-relaxed"
                            placeholder=" Transcript will appear here..."
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            You can edit any errors in the AI transcription here.
                        </p>
                    </CardContent>
                )}
            </Card>

            {/* Techniques */}
            {recipe.techniques && recipe.techniques.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Techniques</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {recipe.techniques.map((technique, idx) => (
                                <Badge key={idx} variant="outline">
                                    {technique}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
                <Button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    size="lg"
                    className="flex-1"
                >
                    {isPublishing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Publishing...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Publish Recipe
                        </>
                    )}
                </Button>
                <Button
                    onClick={onStartOver}
                    disabled={isPublishing}
                    variant="outline"
                    size="lg"
                >
                    Start Over
                </Button>
            </div>
        </div>
    )
}
