'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Check, Loader2 } from 'lucide-react'

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

function getStepDescription(step: string | RecipeStep): string | null {
  if (typeof step === 'string') return null
  return step.description || null
}

interface RecipeReviewProps {
  recipe: RecipeData
  transcript: string
  onPublish: () => void
  onStartOver: () => void
}

export function RecipeReview({ recipe, transcript, onPublish, onStartOver }: RecipeReviewProps) {
  const [isPublishing, setIsPublishing] = useState(false)

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...recipe,
          transcript,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      })

      if (!response.ok) throw new Error('Failed to publish recipe')

      onPublish()
    } catch (error) {
      console.error('Error publishing recipe:', error)
      alert('Failed to publish recipe. Please try again.')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="border-b pb-6">
        <h2 className="text-2xl font-semibold mb-3">{recipe.title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {recipe.timing && (
            <Badge variant="secondary">
              <Clock className="mr-1.5 h-3 w-3" />
              {recipe.timing.total || (recipe.timing.prep || 0) + (recipe.timing.cook || 0)} min
            </Badge>
          )}
          {recipe.techniques && recipe.techniques.length > 0 && (
            <Badge variant="secondary">
              {recipe.techniques.length} techniques
            </Badge>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Ingredients */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ingredients</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {recipe.techniques && recipe.techniques.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Techniques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {recipe.techniques.map((technique, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {technique}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Steps */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {recipe.steps.map((step, idx) => (
                  <li key={idx} className="flex gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      {idx + 1}
                    </span>
                    <div className="pt-0.5">
                      <p className="text-sm">{getStepInstruction(step)}</p>
                      {getStepDescription(step) && (
                        <p className="mt-1 text-sm text-muted-foreground">{getStepDescription(step)}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
        <Button
          onClick={handlePublish}
          disabled={isPublishing}
          className="flex-1"
        >
          {isPublishing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Save to Library
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
