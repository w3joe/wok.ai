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

interface RecipeStep {
    instruction: string
    description: string
}

interface RecipeData {
    title: string
    ingredients: string[]
    steps: (string | RecipeStep)[]
    timing?: {
        prep?: number
        cook?: number
        total?: number
    }
    techniques?: string[]
}

function getStepInstruction(step: string | RecipeStep): string {
    if (typeof step === 'string') return step
    return step.instruction
}

function getStepDescription(step: string | RecipeStep): string {
    if (typeof step === 'string') return ''
    return step.description || ''
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
                                className="text-xl font-semibold"
                                autoFocus
                            />
                        ) : (
                            <CardTitle
                                className="text-xl cursor-pointer hover:text-primary flex items-center gap-2"
                                onClick={() => setEditingTitle(true)}
                            >
                                {recipe.title}
                                <Edit2 className="h-4 w-4 opacity-40" />
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

            {/* Video Player */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Play className="h-4 w-4" />
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

                    {keyMoments.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Key Moments</p>
                            <div className="flex flex-wrap gap-2">
                                {keyMoments.map((moment, idx) => (
                                    <Badge key={idx} variant="outline">
                                        {formatTime(moment.timestamp)} - {moment.label}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Extracted Frames */}
            {frames.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Extracted Photos ({frames.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {frames.map((frame, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                                        <img
                                            src={frame.url}
                                            alt={frame.label}
                                            className="w-full h-full object-cover"
                                        />
                                        <Badge className="absolute bottom-2 left-2" variant="secondary">
                                            {formatTime(frame.timestamp)}
                                        </Badge>
                                    </div>

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
                                            <Edit2 className="h-3 w-3 opacity-40" />
                                        </p>
                                    )}

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
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-base">Ingredients</CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            const newIngredients = [...recipe.ingredients, '']
                            onRecipeUpdate({ ...recipe, ingredients: newIngredients })
                        }}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                    </Button>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {recipe.ingredients.map((ingredient, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary shrink-0" />
                                <Input
                                    value={ingredient}
                                    onChange={(e) => {
                                        const newIngredients = [...recipe.ingredients]
                                        newIngredients[idx] = e.target.value
                                        onRecipeUpdate({ ...recipe, ingredients: newIngredients })
                                    }}
                                    placeholder="Ingredient"
                                    className="flex-1"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                        const newIngredients = recipe.ingredients.filter((_, i) => i !== idx)
                                        onRecipeUpdate({ ...recipe, ingredients: newIngredients })
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            {/* Steps */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-base">Instructions</CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            const newStep: RecipeStep = { instruction: '', description: '' }
                            const newSteps = [...recipe.steps, newStep]
                            onRecipeUpdate({ ...recipe, steps: newSteps })
                        }}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recipe.steps.map((step, idx) => (
                            <div key={idx} className="flex gap-3">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                                    {idx + 1}
                                </span>
                                <div className="flex-1 space-y-2">
                                    <Input
                                        value={getStepInstruction(step)}
                                        onChange={(e) => {
                                            const newSteps = [...recipe.steps]
                                            const currentStep = typeof step === 'string'
                                                ? { instruction: step, description: '' }
                                                : { ...step }
                                            currentStep.instruction = e.target.value
                                            newSteps[idx] = currentStep
                                            onRecipeUpdate({ ...recipe, steps: newSteps })
                                        }}
                                        placeholder={`Step ${idx + 1}...`}
                                    />
                                    <Textarea
                                        value={getStepDescription(step)}
                                        onChange={(e) => {
                                            const newSteps = [...recipe.steps]
                                            const currentStep = typeof step === 'string'
                                                ? { instruction: step, description: '' }
                                                : { ...step }
                                            currentStep.description = e.target.value
                                            newSteps[idx] = currentStep
                                            onRecipeUpdate({ ...recipe, steps: newSteps })
                                        }}
                                        placeholder="Additional tips..."
                                        className="min-h-[60px] text-sm"
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                        const newSteps = recipe.steps.filter((_, i) => i !== idx)
                                        onRecipeUpdate({ ...recipe, steps: newSteps })
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Transcript */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle
                        className="text-base flex items-center gap-2 cursor-pointer"
                        onClick={() => setShowTranscript(!showTranscript)}
                    >
                        <FileText className="h-4 w-4" />
                        Original Transcript
                        <Badge variant="outline" className="ml-auto text-xs">
                            {showTranscript ? 'Hide' : 'Show'}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                {showTranscript && (
                    <CardContent>
                        <Textarea
                            value={transcript}
                            onChange={(e) => onTranscriptUpdate(e.target.value)}
                            className="min-h-[150px] font-mono text-sm"
                            placeholder="Transcript..."
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Edit any transcription errors here.
                        </p>
                    </CardContent>
                )}
            </Card>

            {/* Techniques */}
            {recipe.techniques && recipe.techniques.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Techniques</CardTitle>
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

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
                <Button
                    onClick={handlePublish}
                    disabled={isPublishing}
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
                >
                    Start Over
                </Button>
            </div>
        </div>
    )
}
