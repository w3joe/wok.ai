'use client'

import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useConversation } from '@elevenlabs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Volume2, VolumeX, Loader2, Mic, HelpCircle, FastForward, Rewind, RotateCcw } from 'lucide-react'

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

function getStepText(step: string | RecipeStep): string {
  if (typeof step === 'string') {
    return step
  }
  return `${step.instruction}. ${step.description}`
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

  const lastChangeSource = useRef<'user' | 'agent'>('user')
  const currentStepRef = useRef(currentStep)
  const onStepChangeRef = useRef(onStepChange)
  const onTimerRequestRef = useRef(onTimerRequest)
  const recipeRef = useRef(recipe)

  useEffect(() => {
    onStepChangeRef.current = onStepChange
    onTimerRequestRef.current = onTimerRequest
    recipeRef.current = recipe
    currentStepRef.current = currentStep
  }, [currentStep, onStepChange, onTimerRequest, recipe])

  const clientTools = useMemo(() => ({
    nextStep: () => {
      lastChangeSource.current = 'agent'
      const step = currentStepRef.current
      const r = recipeRef.current

      if (step < r.steps.length - 1) {
        const nextIndex = step + 1
        onStepChangeRef.current(nextIndex)
        return `Moved to step ${nextIndex + 1}. The instruction is: ${getStepText(r.steps[nextIndex])}`
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
        return `Moved to step ${prevIndex + 1}. The instruction is: ${getStepText(r.steps[prevIndex])}`
      }
      return 'Already at the first step'
    },
    repeatStep: () => {
      const step = currentStepRef.current
      const r = recipeRef.current
      onStepChangeRef.current(step)
      return `Current step ${step + 1}: ${getStepText(r.steps[step])}`
    },
    setTimer: ({ minutes }: { minutes: number }) => {
      onTimerRequestRef.current(minutes, `Step ${currentStepRef.current + 1}`)
      return `Timer set for ${minutes} minutes`
    },
    jumpToStep: (args: any) => {
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
        return `Moved to step ${stepNum}. The instruction is: ${getStepText(r.steps[targetIndex])}`
      }
      return `Step ${stepNum} does not exist.`
    },
  }), [])

  const recipePrompt = useMemo(() => {
    const ingredientsList = recipe.ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n')
    const stepsList = recipe.steps.map((step, i) => `Step ${i + 1}: ${getStepText(step)}`).join('\n')

    return `You are helping the user cook "${recipe.title}".

**Ingredients:**
${ingredientsList}

**Steps:**
${stepsList}

## Your Role:
- You help the user cook "${recipe.title}".
- Use "changeStep" to update the UI when the user moves between steps.
- Answer questions about ingredients and steps.

## How to Read Steps:
When reading or summarizing a step, always:
1. State the MAIN ACTION VERB clearly (e.g., "sauté", "chop", "simmer", "fold")
2. Mention the KEY INGREDIENTS involved in that step
3. Include any TIMING information (e.g., "for 2 minutes", "until golden")
4. Share the chef's TIPS and sensory cues from the description (e.g., "you'll know it's ready when it starts to sizzle")
5. Keep it conversational but informative - summarize, don't just read verbatim

Example: Instead of reading "Add garlic to pan. Cook until fragrant about 30 seconds, be careful not to burn it."
Say: "Now we're going to SAUTÉ the GARLIC - add it to your pan and cook for about 30 SECONDS until it becomes fragrant. The chef's tip here is to watch it carefully so it doesn't burn!"

## Tools:
- repeatStep(): Read current step again
- jumpToStep({ step: number }): Move to a specific step number.`
  }, [recipe.title, recipe.ingredients, recipe.steps])

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
      const response = await fetch('/api/conversation/signed-url')
      if (!response.ok) throw new Error('Could not get signed URL')
      const { signedUrl } = await response.json()

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

  const conversationRef = useRef(conversation)
  useEffect(() => {
    conversationRef.current = conversation
  }, [conversation])

  useEffect(() => {
    if (isActive && lastChangeSource.current === 'user') {
      conversationRef.current.sendUserMessage(`SYSTEM: User moved to step ${currentStep + 1}. Read this step: ${getStepText(recipe.steps[currentStep])}`)
    }
    lastChangeSource.current = 'user'
  }, [currentStep, isActive, recipe.steps])

  return (
    <div data-assistant-active={isActive}>
      <Card className={`transition-colors ${isActive ? 'border-primary' : ''}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <Mic className={`h-5 w-5 ${isActive && isSpeaking ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <h3 className="font-semibold">Voice Assistant</h3>
                <p className="text-xs text-muted-foreground">Hands-free cooking</p>
              </div>
            </div>
            {isActive && (
              <Badge variant={isSpeaking ? 'default' : 'secondary'}>
                {isSpeaking ? 'Speaking' : 'Listening'}
              </Badge>
            )}
          </div>

          <div className="space-y-4">
            <Button
              onClick={toggleConversation}
              disabled={isConnecting}
              className="w-full"
              variant={isActive ? "outline" : "default"}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : isActive ? (
                <>
                  <VolumeX className="mr-2 h-4 w-4" />
                  Stop Assistant
                </>
              ) : (
                <>
                  <Volume2 className="mr-2 h-4 w-4" />
                  Start Assistant
                </>
              )}
            </Button>

            {error && (
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {(transcript || agentResponse) && (
              <div className="space-y-3">
                {transcript && (
                  <div className="flex justify-end">
                    <div className="p-3 bg-muted rounded-lg max-w-[85%]">
                      <p className="text-xs text-muted-foreground mb-1">You</p>
                      <p className="text-sm">"{transcript}"</p>
                    </div>
                  </div>
                )}

                {agentResponse && (
                  <div className="flex justify-start">
                    <div className="p-3 bg-primary text-primary-foreground rounded-lg max-w-[85%]">
                      <p className="text-xs opacity-70 mb-1">Assistant</p>
                      <p className="text-sm">{agentResponse}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground mb-3">Voice commands</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: <FastForward className="h-3 w-3" />, label: "Next Step" },
                  { icon: <Rewind className="h-3 w-3" />, label: "Go Back" },
                  { icon: <RotateCcw className="h-3 w-3" />, label: "Repeat" },
                  { icon: <HelpCircle className="h-3 w-3" />, label: "Ask Question" },
                ].map((cmd, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
                    {cmd.icon}
                    <span>{cmd.label}</span>
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
