'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VoiceRecorder } from '@/components/VoiceRecorder'
import { RecipeReview } from '@/components/RecipeReview'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, ChefHat, Sparkles, Wand2 } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Badge } from '@/components/ui/badge'

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

export default function RecordPage() {
  const router = useRouter()
  const [transcript, setTranscript] = useState<string>('')
  const [recipe, setRecipe] = useState<RecipeData | null>(null)
  const [isStructuring, setIsStructuring] = useState(false)

  const handleTranscriptionComplete = async (text: string) => {
    setTranscript(text)
    setIsStructuring(true)

    try {
      const response = await fetch('/api/structure-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      })

      if (!response.ok) throw new Error('Failed to structure recipe')

      const data = await response.json()
      setRecipe(data.recipe)
    } catch (error) {
      console.error('Error structuring recipe:', error)
      alert('Failed to structure recipe. Please try again.')
      setTranscript('')
    } finally {
      setIsStructuring(false)
    }
  }

  const handlePublish = () => {
    router.push('/recipes')
  }

  const handleStartOver = () => {
    setTranscript('')
    setRecipe(null)
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-background">
      <Header />

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 px-4 py-1 bg-primary/10 text-primary border-none font-bold uppercase tracking-widest text-[10px]">
            Voice Capture
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Record Your Recipe</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto italic">
            Narrate your cooking process and watch as AI organizes everything into a professional format.
          </p>
        </div>

        <div className="relative">
          {!transcript && !isStructuring && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <VoiceRecorder onTranscriptionComplete={handleTranscriptionComplete} />
            </div>
          )}

          {isStructuring && (
            <Card className="rounded-[2.5rem] border-border/50 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 bg-white dark:bg-card">
              <div className="h-2 bg-primary/10 overflow-hidden">
                <div className="h-full bg-primary animate-progress-stripes w-full" />
              </div>
              <CardContent className="flex flex-col items-center gap-8 py-24 text-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                  <div className="relative h-24 w-24 bg-primary/10 rounded-3xl flex items-center justify-center">
                    <Wand2 className="h-12 w-12 text-primary animate-bounce fill-primary/10" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-3">Structuring Your Masterpiece</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto text-lg leading-relaxed">
                    AI is analyzing your culinary narration to identify ingredients, timing, and techniques...
                  </p>
                </div>
                <div className="flex items-center gap-2 px-6 py-2 bg-primary/5 rounded-full">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-bold text-primary uppercase tracking-widest">Processing</span>
                </div>
              </CardContent>
            </Card>
          )}

          {recipe && transcript && !isStructuring && (
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
              <RecipeReview
                recipe={recipe}
                transcript={transcript}
                onPublish={handlePublish}
                onStartOver={handleStartOver}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
