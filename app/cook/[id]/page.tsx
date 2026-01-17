'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { VoiceAssistant } from '@/components/VoiceAssistant'
import { TimerDisplay } from '@/components/TimerDisplay'
import { TimerManager, Timer } from '@/lib/timer-manager'
import { ChefHat, ChevronLeft, ChevronRight, Clock, Check } from 'lucide-react'
import { Header } from '@/components/Header'

interface RecipeStep {
  instruction: string
  description: string
}

interface Recipe {
  id: string
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

// Helper functions to handle both old string format and new object format
function getStepInstruction(step: string | RecipeStep): string {
  if (typeof step === 'string') {
    return step
  }
  return step.instruction
}

function getStepDescription(step: string | RecipeStep): string | null {
  if (typeof step === 'string') {
    return null
  }
  return step.description
}

function getStepFullText(step: string | RecipeStep): string {
  if (typeof step === 'string') {
    return step
  }
  return `${step.instruction}. ${step.description}`
}

export default function CookPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [timers, setTimers] = useState<Timer[]>([])
  const [timerManager] = useState(() => new TimerManager())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRecipe()
  }, [resolvedParams.id])

  useEffect(() => {
    // Setup timer manager callbacks
    timerManager.setOnUpdate((updatedTimers) => {
      setTimers([...updatedTimers])
    })

    timerManager.setOnComplete((timer) => {
      // Play audio alert
      if (typeof window !== 'undefined' && 'Audio' in window) {
        const audio = new Audio('/timer-sound.mp3')
        audio.play().catch(() => {
          // Fallback to browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Timer Complete!', {
              body: `${timer.label} is done!`,
            })
          } else {
            alert(`Timer Complete: ${timer.label}`)
          }
        })
      }
    })

    return () => {
      timerManager.cleanup()
    }
  }, [timerManager])

  // scroll to top when step changes
  useEffect(() => {
    console.log('[CookPage] currentStep changed to:', currentStep)
    const element = document.getElementById('current-step-card')
    if (element) {
      // Small timeout to ensure DOM update is processed (though React is usually fast enough)
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [currentStep])

  const fetchRecipe = async () => {
    try {
      const response = await fetch(`/api/recipes/${resolvedParams.id}`)
      if (!response.ok) throw new Error('Failed to fetch recipe')
      const data = await response.json()
      setRecipe(data.recipe)
    } catch (error) {
      console.error('Error fetching recipe:', error)
      alert('Failed to load recipe')
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStepChange = useCallback((newStep: number) => {
    console.log('[CookPage] handleStepChange called with:', newStep)
    if (recipe && newStep >= 0 && newStep < recipe.steps.length) {
      // 1. Cancel any existing system speech immediately
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }

      console.log('[CookPage] Setting current step to:', newStep)
      setCurrentStep(newStep)

      // 2. Only speak using system voice if the ElevenLabs assistant isn't likely handling it
      // We check if it's not active to avoid double-voicing
      if ('speechSynthesis' in window && !document.querySelector('[data-assistant-active="true"]')) {
        const utterance = new SpeechSynthesisUtterance(
          `Step ${newStep + 1}: ${getStepFullText(recipe.steps[newStep])}`
        )
        speechSynthesis.speak(utterance)
      }
    } else {
      console.warn('[CookPage] Step change ignored. recipe exists?', !!recipe, 'valid step?', newStep >= 0 && newStep < (recipe?.steps?.length || 0))
    }
  }, [recipe])

  const handleTimerRequest = useCallback((minutes: number, label: string) => {
    timerManager.createTimer(label, minutes)
  }, [timerManager])

  const toggleStepComplete = (stepIndex: number) => {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex)
    } else {
      newCompleted.add(stepIndex)
    }
    setCompletedSteps(newCompleted)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading recipe...</p>
        </div>
      </div>
    )
  }

  if (!recipe) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-3">{recipe.title}</h1>
          <div className="flex gap-2">
            {recipe.timing && (
              <Badge variant="secondary">
                <Clock className="mr-1 h-3 w-3" />
                {recipe.timing.total || (recipe.timing.prep || 0) + (recipe.timing.cook || 0)} min
              </Badge>
            )}
            <Badge variant="secondary">
              {recipe.steps.length} steps
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Current Step */}
            <Card id="current-step-card" className="border-primary scroll-mt-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Step {currentStep + 1} of {recipe.steps.length}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStepComplete(currentStep)}
                  >
                    {completedSteps.has(currentStep) ? (
                      <Check className="h-5 w-5 text-primary" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed">
                  {getStepInstruction(recipe.steps[currentStep])}
                </p>
                {getStepDescription(recipe.steps[currentStep]) && (
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {getStepDescription(recipe.steps[currentStep])}
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => handleStepChange(currentStep - 1)}
                    disabled={currentStep === 0}
                    variant="outline"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    onClick={() => handleStepChange(currentStep + 1)}
                    disabled={currentStep === recipe.steps.length - 1}
                    className="flex-1"
                  >
                    Next Step
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* All Steps */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">All Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recipe.steps.map((step, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleStepChange(idx)}
                      className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-colors ${idx === currentStep
                        ? 'bg-primary/10 border border-primary'
                        : 'bg-muted/50 hover:bg-muted'
                        }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${completedSteps.has(idx)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-foreground border'
                          }`}
                      >
                        {completedSteps.has(idx) ? <Check className="h-3 w-3" /> : idx + 1}
                      </span>
                      <div>
                        <p className={`text-sm ${idx === currentStep ? 'font-medium' : ''}`}>
                          {getStepInstruction(step)}
                        </p>
                        {getStepDescription(step) && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {getStepDescription(step)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Voice Assistant */}
            <VoiceAssistant
              recipe={recipe}
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepChange={handleStepChange}
              onTimerRequest={handleTimerRequest}
            />

            {/* Timers */}
            <TimerDisplay
              timers={timers}
              onPause={(id) => timerManager.pauseTimer(id)}
              onResume={(id) => timerManager.resumeTimer(id)}
              onCancel={(id) => timerManager.cancelTimer(id)}
            />

            {/* Ingredients */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ingredients</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span>{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
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
          </div>
        </div>
      </main>
    </div>
  )
}
