'use client'

import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useConversation } from '@elevenlabs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Volume2, VolumeX, Loader2, Mic, Sparkles, MessageSquare, HelpCircle, FastForward, Rewind, RotateCcw } from 'lucide-react'

interface Recipe {
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

interface VoiceAssistantProps {
  recipe: Recipe
  currentStep: number
  completedSteps: Set<number>
  onStepChange: (step: number) => void
  onTimerRequest: (minutes: number, label: string) => void
}

export function VoiceAssistant({ recipe, currentStep, completedSteps, onStepChange, onTimerRequest }: VoiceAssistantProps) {
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<string>('')
  const [agentResponse, setAgentResponse] = useState<string>('')

  // Refs to track state without triggering re-renders of the hook
  const lastChangeSource = useRef<'user' | 'agent'>('user')
  const currentStepRef = useRef(currentStep)
  const onStepChangeRef = useRef(onStepChange)
  const onTimerRequestRef = useRef(onTimerRequest)
  const recipeRef = useRef(recipe)

  // Keep refs in sync with props
  useEffect(() => {
    onStepChangeRef.current = onStepChange
    onTimerRequestRef.current = onTimerRequest
    recipeRef.current = recipe
    currentStepRef.current = currentStep
  }, [currentStep, onStepChange, onTimerRequest, recipe])

  // Define client tools that the agent can call
  const clientTools = useMemo(() => ({
    nextStep: () => {
      lastChangeSource.current = 'agent'
      const step = currentStepRef.current
      const r = recipeRef.current

      if (step < r.steps.length - 1) {
        const nextIndex = step + 1
        onStepChangeRef.current(nextIndex)
        return `Moved to step ${nextIndex + 1}. The instruction is: ${r.steps[nextIndex]}`
      }
      return 'Already at the last step'
    },
    previousStep: () => {
      lastChangeSource.current = 'agent'
      const step = currentStepRef.current
      const r = recipeRef.current

      if (step > 0) {
        const prevIndex = step - 1
        onStepChangeRef.current(prevIndex)
        return `Moved to step ${prevIndex + 1}. The instruction is: ${r.steps[prevIndex]}`
      }
      return 'Already at the first step'
    },
    repeatStep: () => {
      const step = currentStepRef.current
      const r = recipeRef.current
      onStepChangeRef.current(step)
      return `Current step ${step + 1}: ${r.steps[step]}`
    },
    setTimer: ({ minutes }: { minutes: number }) => {
      onTimerRequestRef.current(minutes, `Step ${currentStepRef.current + 1}`)
      return `Timer set for ${minutes} minutes`
    },
    changeStep: (args: any) => {
      let rawStep: any = undefined
      if (typeof args === 'number' || typeof args === 'string') {
        rawStep = args
      } else if (args && typeof args === 'object') {
        rawStep = args.step || args.stepNumber || args.stepIndex || args.number
      }

      const stepNum = parseInt(String(rawStep))
      if (isNaN(stepNum)) {
        return `Error: Could not determine step number`
      }

      const r = recipeRef.current
      const targetIndex = stepNum - 1

      if (targetIndex >= 0 && targetIndex < r.steps.length) {
        onStepChangeRef.current(targetIndex)
        return `Moved to step ${stepNum}. The instruction is: ${r.steps[targetIndex]}`
      }
      return `Step ${stepNum} does not exist.`
    },
  }), [])

  // Prompt configuration
  const recipePrompt = useMemo(() => {
    const ingredientsList = recipe.ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n')
    const stepsList = recipe.steps.map((step, i) => `Step ${i + 1}: ${step}`).join('\n')

    return `You are helping the user cook "${recipe.title}".

**Ingredients:**
${ingredientsList}

**Steps:**
${stepsList}

## Your Role:
- You help the user cook "${recipe.title}".
- Use "changeStep" to update the UI when the user moves between steps.
- Answer questions about ingredients and steps.

## Tools:
- repeatStep(): Read current step again
- changeStep({ step: number }): Move to a specific step number.`
  }, [recipe.title, recipe.ingredients, recipe.steps])

  // Memoize callbacks to prevent useConversation from reconnecting on every render
  const handleConnect = useCallback(() => {
    console.log('Voice assistant connected')
    setError(null)
  }, [])

  const handleDisconnect = useCallback(() => {
    console.log('Voice assistant disconnected')
  }, [])

  const handleError = useCallback((error: any) => {
    console.error('Conversation error:', error)
    setError(typeof error === 'string' ? error : (error as Error).message || 'Connection error occurred')
  }, [])

  const handleMessage = useCallback((message: any) => {
    if (message.type === 'user_transcript' || message.type === 'user_transcription') {
      const text = message.user_transcription?.text || message.message || ''
      if (text) setTranscript(text)
    }
    if (message.type === 'agent_response') {
      const text = message.agent_response || message.message || ''
      if (text) setAgentResponse(text)
    }
  }, [])

  const conversation = useConversation({
    clientTools,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError: handleError,
    onMessage: handleMessage
  })

  const startConversation = async () => {
    try {
      setError(null)
      // Get signed URL
      const response = await fetch('/api/conversation/signed-url')
      if (!response.ok) throw new Error('Could not get signed URL')
      const { signedUrl } = await response.json()

      // Start session with overrides
      await conversation.startSession({
        signedUrl,
        overrides: {
          agent: {
            prompt: { prompt: recipePrompt },
            firstMessage: `Hi! I'm your assistant for ${recipe.title}. You're on step ${currentStepRef.current + 1}. How can I help?`
          }
        }
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start')
    }
  }

  const stopConversation = async () => {
    await conversation.endSession()
  }

  const toggleConversation = async () => {
    if (conversation.status === 'connected') await stopConversation()
    else await startConversation()
  }

  const isActive = conversation.status === 'connected'
  const isConnecting = conversation.status === 'connecting'
  const isSpeaking = conversation.isSpeaking

  // Update effect for manual step changes
  // Store conversation in a ref to avoid dependency issues
  const conversationRef = useRef(conversation)
  useEffect(() => {
    conversationRef.current = conversation
  }, [conversation])

  useEffect(() => {
    if (isActive && lastChangeSource.current === 'user') {
      // Use ref to avoid triggering effect when conversation object changes
      conversationRef.current.sendUserMessage(`SYSTEM: User moved to step ${currentStep + 1}. Read this step: ${recipe.steps[currentStep]}`)
    }
    lastChangeSource.current = 'user'
  }, [currentStep, isActive, recipe.steps])

  return (
    <div data-assistant-active={isActive}>
      <Card className={`rounded-[2rem] overflow-hidden border-2 transition-all duration-500 shadow-lg ${isActive ? 'border-primary shadow-primary/20 bg-primary/5' : 'border-border/50 bg-white dark:bg-card'}`}>
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' : 'bg-muted text-muted-foreground'}`}>
                <Mic className={`h-6 w-6 ${isActive && isSpeaking ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <h3 className="text-xl font-black">AI Voice Assistant</h3>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Hands-free Cooking</p>
              </div>
            </div>
            {isActive && (
              <Badge variant="default" className={`bg-primary text-white border-none px-4 py-1.5 font-black uppercase tracking-widest text-[10px] rounded-full ${isSpeaking ? 'animate-pulse' : ''}`}>
                {isSpeaking ? 'Agent Speaking' : 'Listening...'}
              </Badge>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <Button
              onClick={toggleConversation}
              disabled={isConnecting}
              size="lg"
              className={`w-full rounded-2xl h-16 text-xl font-bold shadow-xl transition-all active:scale-95 ${isActive ? "bg-white text-destructive border-2 border-destructive/20 hover:bg-destructive/5 shadow-destructive/10" : "bg-primary text-white shadow-primary/30"}`}
              variant={isActive ? "outline" : "default"}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  Establishing Link...
                </>
              ) : isActive ? (
                <>
                  <VolumeX className="mr-3 h-6 w-6" />
                  Deactivate AI
                </>
              ) : (
                <>
                  <Volume2 className="mr-3 h-6 w-6" />
                  Activate AI Guide
                </>
              )}
            </Button>

            {error && (
              <div className="p-4 bg-destructive/10 rounded-2xl border-2 border-destructive/20 animate-in fade-in slide-in-from-top-2">
                <p className="text-sm text-destructive font-bold">
                  Error: {error}
                </p>
              </div>
            )}

            {(transcript || agentResponse) && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 transition-all duration-700">
                {transcript && (
                  <div className="flex gap-3 items-start justify-end">
                    <div className="p-4 bg-white/80 dark:bg-background/80 rounded-[1.5rem] rounded-tr-none shadow-sm border border-border/50 max-w-[85%]">
                      <p className="text-xs text-muted-foreground font-black uppercase tracking-tighter mb-1.5 flex items-center gap-1.5">
                        <MessageSquare className="h-3 w-3" /> You
                      </p>
                      <p className="text-sm font-medium italic">&quot;{transcript}&quot;</p>
                    </div>
                  </div>
                )}

                {agentResponse && (
                  <div className="flex gap-3 items-start">
                    <div className="p-4 bg-primary text-white rounded-[1.5rem] rounded-tl-none shadow-lg shadow-primary/20 max-w-[85%]">
                      <p className="text-xs text-white/60 font-black uppercase tracking-tighter mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 fill-white/20" /> Assistant
                      </p>
                      <p className="text-sm font-bold leading-relaxed">{agentResponse}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-border/50 pt-6">
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-4 text-center">Voice Command Guide</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <FastForward className="h-3.5 w-3.5" />, label: "Next Step" },
                  { icon: <Rewind className="h-3.5 w-3.5" />, label: "Go Back" },
                  { icon: <RotateCcw className="h-3.5 w-3.5" />, label: "Repeat Step" },
                  { icon: <HelpCircle className="h-3.5 w-3.5" />, label: "Any Question" },
                ].map((cmd, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/50 dark:bg-card/50 border border-border/50 transition-colors hover:bg-white dark:hover:bg-card">
                    <div className="text-primary">{cmd.icon}</div>
                    <span className="text-xs font-bold">{cmd.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
