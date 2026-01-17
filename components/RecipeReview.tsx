'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, ChefHat, Check, Loader2, Utensils, Play } from 'lucide-react'

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="bg-white dark:bg-card border border-border/50 px-8 py-12 rounded-[2.5rem] shadow-sm mb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black tracking-tight mb-4 leading-tight">{recipe.title}</h2>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {recipe.timing && (
              <Badge variant="secondary" className="bg-primary/5 text-primary border-none px-4 py-1.5 font-bold rounded-full">
                <Clock className="mr-2 h-4 w-4" />
                {recipe.timing.total || (recipe.timing.prep || 0) + (recipe.timing.cook || 0)} min
              </Badge>
            )}
            {recipe.techniques && recipe.techniques.length > 0 && (
              <Badge variant="secondary" className="bg-primary/5 text-primary border-none px-4 py-1.5 font-bold rounded-full">
                <ChefHat className="mr-2 h-4 w-4" />
                {recipe.techniques.length} Techniques
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-8">
          <Card className="rounded-[2rem] border-border/50 bg-white dark:bg-card overflow-hidden shadow-sm">
            <CardHeader className="bg-primary/5 py-4 px-6 border-b border-primary/10">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                Ingredients
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-4">
                {recipe.ingredients.map((ingredient, idx) => (
                  <li key={idx} className="flex items-start gap-3 group">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 group-hover:bg-primary transition-colors shrink-0">
                      <Check className="h-3 w-3 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-sm font-medium leading-relaxed">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {recipe.techniques && recipe.techniques.length > 0 && (
            <Card className="rounded-[2rem] border-border/50 bg-white dark:bg-card shadow-sm">
              <CardHeader className="py-4 px-6">
                <CardTitle className="text-lg font-bold">Key Techniques</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="flex flex-wrap gap-2">
                  {recipe.techniques.map((technique, idx) => (
                    <Badge key={idx} variant="outline" className="text-[10px] uppercase font-bold tracking-widest border-primary/20 bg-primary/5 text-primary px-3 rounded-full">
                      {technique}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-2 space-y-8">
          <Card className="rounded-[2rem] border-border/50 bg-white dark:bg-card shadow-sm">
            <CardHeader className="bg-primary/5 py-4 px-6 border-b border-primary/10">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Play className="h-5 w-5 text-primary fill-primary" />
                Step-by-Step Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <ol className="space-y-8">
                {recipe.steps.map((step, idx) => (
                  <li key={idx} className="flex gap-6 group">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-lg group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      {idx + 1}
                    </span>
                    <p className="pt-1.5 text-lg leading-relaxed font-medium">{step}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-12 pb-24 max-w-2xl mx-auto">
        <Button
          onClick={handlePublish}
          disabled={isPublishing}
          size="lg"
          className="flex-1 rounded-2xl h-14 text-xl font-bold shadow-xl shadow-primary/20 order-2 sm:order-1 transition-all hover:scale-[1.02] active:scale-95"
        >
          {isPublishing ? (
            <>
              <Loader2 className="mr-3 h-6 w-6 animate-spin" />
              Finalizing...
            </>
          ) : (
            <>
              <Check className="mr-3 h-6 w-6" />
              Save to My Library
            </>
          )}
        </Button>
        <Button
          onClick={onStartOver}
          disabled={isPublishing}
          variant="outline"
          size="lg"
          className="rounded-2xl h-14 text-xl font-bold border-2 hover:bg-destructive/5 hover:text-destructive hover:border-destructive transition-all order-1 sm:order-2 active:scale-95"
        >
          Discard & Start Over
        </Button>
      </div>
    </div>
  )
}
