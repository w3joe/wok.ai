'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Timer as TimerType } from '@/lib/timer-manager'
import { Clock, Pause, Play, X } from 'lucide-react'

interface TimerDisplayProps {
  timers: TimerType[]
  onPause: (id: string) => void
  onResume: (id: string) => void
  onCancel: (id: string) => void
}

export function TimerDisplay({ timers, onPause, onResume, onCancel }: TimerDisplayProps) {
  if (timers.length === 0) return null

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Active Timers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {timers.map((timer) => (
            <div
              key={timer.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{timer.label}</span>
                  {timer.isPaused && (
                    <Badge variant="secondary" className="text-xs">
                      Paused
                    </Badge>
                  )}
                  {!timer.isActive && timer.remaining === 0 && (
                    <Badge variant="default" className="text-xs animate-pulse">
                      Done!
                    </Badge>
                  )}
                </div>
                <div className="text-2xl font-mono font-bold text-primary">
                  {formatTime(timer.remaining)}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {timer.isActive && !timer.isPaused && (
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => onPause(timer.id)}
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                )}
                {timer.isActive && timer.isPaused && (
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => onResume(timer.id)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onCancel(timer.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
