'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, X, Save, ArrowLeft, Clock, Utensils, ListOrdered, Tag, GripVertical } from 'lucide-react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface RecipeData {
    id: string
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

interface RecipeEditorProps {
    initialRecipe: RecipeData
    onSave: (updatedRecipe: any) => Promise<void>
    onCancel: () => void
}
interface SortableStepItemProps {
    id: string
    step: string
    index: number
    onChange: (value: string) => void
    onRemove: () => void
}

function SortableStepItem({ id, step, index, onChange, onRemove }: SortableStepItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as const,
    }

    return (
        <div ref={setNodeRef} style={style} className={`flex gap-3 group items-start ${isDragging ? 'opacity-50' : ''}`}>
            <div {...attributes} {...listeners} className="mt-4 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary outline-none">
                <GripVertical className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="mt-4 h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0 border-primary/20 bg-primary/5 text-primary">
                {index + 1}
            </Badge>
            <Textarea
                value={step}
                onChange={(e) => onChange(e.target.value)}
                placeholder={`Step ${index + 1} instruction...`}
                className="min-h-[80px] resize-y bg-background"
            />
            <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 mt-3"
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    )
}

export function RecipeEditor({ initialRecipe, onSave, onCancel }: RecipeEditorProps) {
    const [recipe, setRecipe] = useState(initialRecipe)
    const [stepIds, setStepIds] = useState(() => initialRecipe.steps.map(() => Math.random().toString(36).substr(2, 9)))
    const [isSaving, setIsSaving] = useState(false)
    const [newTechnique, setNewTechnique] = useState('')

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleTimingChange = (field: 'prep' | 'cook', value: string) => {
        const numValue = parseInt(value) || 0
        setRecipe(prev => ({
            ...prev,
            timing: {
                ...prev.timing,
                [field]: numValue,
                total: (field === 'prep' ? numValue : (prev.timing?.prep || 0)) +
                    (field === 'cook' ? numValue : (prev.timing?.cook || 0))
            }
        }))
    }

    const handleArrayChange = (
        field: 'ingredients' | 'steps',
        index: number,
        value: string
    ) => {
        const newArray = [...(recipe[field] || [])]
        newArray[index] = value
        setRecipe({ ...recipe, [field]: newArray })
    }

    const addItem = (field: 'ingredients' | 'steps') => {
        if (field === 'steps') {
            setStepIds([...stepIds, Math.random().toString(36).substr(2, 9)])
        }
        setRecipe({
            ...recipe,
            [field]: [...(recipe[field] || []), '']
        })
    }

    const removeItem = (field: 'ingredients' | 'steps', index: number) => {
        const newArray = [...(recipe[field] || [])]
        newArray.splice(index, 1)
        if (field === 'steps') {
            const newIds = [...stepIds]
            newIds.splice(index, 1)
            setStepIds(newIds)
        }
        setRecipe({ ...recipe, [field]: newArray })
    }

    const addTechnique = () => {
        if (newTechnique.trim()) {
            setRecipe({
                ...recipe,
                techniques: [...(recipe.techniques || []), newTechnique.trim()]
            })
            setNewTechnique('')
        }
    }

    const removeTechnique = (index: number) => {
        const newTechniques = [...(recipe.techniques || [])]
        newTechniques.splice(index, 1)
        setRecipe({ ...recipe, techniques: newTechniques })
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (active.id !== over?.id) {
            const oldIndex = stepIds.indexOf(active.id as string)
            const newIndex = stepIds.indexOf(over?.id as string)

            setStepIds((ids) => arrayMove(ids, oldIndex, newIndex))
            setRecipe((prev) => ({
                ...prev,
                steps: arrayMove(prev.steps, oldIndex, newIndex)
            }))
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await onSave(recipe)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-10">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={onCancel} className="hover:bg-transparent pl-0 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Cancel Editing
                </Button>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onCancel} disabled={isSaving}>
                        Discard Changes
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="min-w-[140px]">
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Basic Info */}
                <Card className="border-2 border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Recipe Title</Label>
                            <Input
                                id="title"
                                value={recipe.title}
                                onChange={(e) => setRecipe({ ...recipe, title: e.target.value })}
                                className="text-lg font-medium h-12"
                                placeholder="e.g. Grandma's Spotted Dick"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="prep-time" className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    Prep Time (mins)
                                </Label>
                                <Input
                                    id="prep-time"
                                    type="number"
                                    min="0"
                                    value={recipe.timing?.prep || 0}
                                    onChange={(e) => handleTimingChange('prep', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cook-time" className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    Cook Time (mins)
                                </Label>
                                <Input
                                    id="cook-time"
                                    type="number"
                                    min="0"
                                    value={recipe.timing?.cook || 0}
                                    onChange={(e) => handleTimingChange('cook', e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Ingredients */}
                <Card className="border-2 border-border/50 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Utensils className="h-5 w-5 text-primary" />
                            Ingredients
                        </CardTitle>
                        <Button size="sm" variant="secondary" onClick={() => addItem('ingredients')}>
                            <Plus className="h-4 w-4 mr-1" /> Add Ingredient
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recipe.ingredients.map((ingredient, idx) => (
                                <div key={idx} className="flex gap-2 group">
                                    <Input
                                        value={ingredient}
                                        onChange={(e) => handleArrayChange('ingredients', idx, e.target.value)}
                                        placeholder={`Ingredient ${idx + 1}`}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeItem('ingredients', idx)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {recipe.ingredients.length === 0 && (
                                <p className="text-sm text-muted-foreground italic text-center py-4">No ingredients added yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Steps */}
                <Card className="border-2 border-border/50 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <ListOrdered className="h-5 w-5 text-primary" />
                            Instructions
                        </CardTitle>
                        <Button size="sm" variant="secondary" onClick={() => addItem('steps')}>
                            <Plus className="h-4 w-4 mr-1" /> Add Step
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={stepIds}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {recipe.steps.map((step, idx) => (
                                        <SortableStepItem
                                            key={stepIds[idx]}
                                            id={stepIds[idx]}
                                            step={step}
                                            index={idx}
                                            onChange={(value) => handleArrayChange('steps', idx, value)}
                                            onRemove={() => removeItem('steps', idx)}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                            {recipe.steps.length === 0 && (
                                <p className="text-sm text-muted-foreground italic text-center py-4">No steps added yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Techniques */}
                <Card className="border-2 border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tag className="h-5 w-5 text-primary" />
                            Techniques
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {recipe.techniques?.map((tech, idx) => (
                                <Badge key={idx} variant="secondary" className="pl-3 pr-1 py-1 gap-1">
                                    {tech}
                                    <button onClick={() => removeTechnique(idx)} className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2 max-w-sm">
                            <Input
                                value={newTechnique}
                                onChange={(e) => setNewTechnique(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnique())}
                                placeholder="Add a technique (e.g. Sauté)"
                            />
                            <Button type="button" variant="secondary" onClick={addTechnique} disabled={!newTechnique.trim()}>
                                Add
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
