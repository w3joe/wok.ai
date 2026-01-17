'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Utensils } from 'lucide-react'

interface RecipeMetadata {
    cuisineType: string
    difficulty: 'easy' | 'medium' | 'hard'
    language: string
}

interface RecipeMetadataFormProps {
    metadata: RecipeMetadata
    onChange: (metadata: RecipeMetadata) => void
}

const CUISINE_TYPES = [
    'Singaporean',
    'Malaysian',
    'Chinese',
    'Indian',
    'Indonesian',
    'Thai',
    'Vietnamese',
    'Japanese',
    'Korean',
    'Western',
    'Fusion',
    'Other'
]

const DIFFICULTIES: Array<{ value: 'easy' | 'medium' | 'hard'; label: string }> = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
]

export function RecipeMetadataForm({ metadata, onChange }: RecipeMetadataFormProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Utensils className="h-5 w-5" />
                    Recipe Details
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Cuisine Type */}
                <div className="space-y-2">
                    <Label htmlFor="cuisine">Cuisine Type</Label>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        {CUISINE_TYPES.map((cuisine) => (
                            <Button
                                key={cuisine}
                                type="button"
                                size="sm"
                                variant={metadata.cuisineType === cuisine ? 'default' : 'outline'}
                                onClick={() => onChange({ ...metadata, cuisineType: cuisine })}
                            >
                                {cuisine}
                            </Button>
                        ))}
                    </div>
                    {!CUISINE_TYPES.includes(metadata.cuisineType) && metadata.cuisineType && (
                        <Input
                            value={metadata.cuisineType}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...metadata, cuisineType: e.target.value })}
                            placeholder="Custom cuisine type"
                            className="mt-2"
                        />
                    )}
                </div>

                {/* Difficulty */}
                <div className="space-y-2">
                    <Label>Difficulty Level</Label>
                    <div className="flex gap-2">
                        {DIFFICULTIES.map((diff) => (
                            <Button
                                key={diff.value}
                                type="button"
                                variant={metadata.difficulty === diff.value ? 'default' : 'outline'}
                                onClick={() => onChange({ ...metadata, difficulty: diff.value })}
                                className="flex-1"
                            >
                                {diff.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
