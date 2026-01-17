export interface Timer {
  id: string
  label: string
  duration: number // in seconds
  remaining: number
  isActive: boolean
  isPaused: boolean
}

export class TimerManager {
  private timers: Map<string, Timer> = new Map()
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private onUpdateCallback?: (timers: Timer[]) => void
  private onCompleteCallback?: (timer: Timer) => void

  setOnUpdate(callback: (timers: Timer[]) => void) {
    this.onUpdateCallback = callback
  }

  setOnComplete(callback: (timer: Timer) => void) {
    this.onCompleteCallback = callback
  }

  createTimer(label: string, durationInMinutes: number): string {
    const id = `timer-${Date.now()}-${Math.random()}`
    const duration = durationInMinutes * 60
    
    const timer: Timer = {
      id,
      label,
      duration,
      remaining: duration,
      isActive: true,
      isPaused: false,
    }

    this.timers.set(id, timer)
    this.startTimer(id)
    this.notifyUpdate()

    return id
  }

  private startTimer(id: string) {
    const interval = setInterval(() => {
      const timer = this.timers.get(id)
      if (!timer || !timer.isActive || timer.isPaused) return

      timer.remaining -= 1

      if (timer.remaining <= 0) {
        timer.remaining = 0
        timer.isActive = false
        this.stopTimer(id)
        
        if (this.onCompleteCallback) {
          this.onCompleteCallback(timer)
        }
      }

      this.notifyUpdate()
    }, 1000)

    this.intervals.set(id, interval)
  }

  private stopTimer(id: string) {
    const interval = this.intervals.get(id)
    if (interval) {
      clearInterval(interval)
      this.intervals.delete(id)
    }
  }

  pauseTimer(id: string) {
    const timer = this.timers.get(id)
    if (timer) {
      timer.isPaused = true
      this.notifyUpdate()
    }
  }

  resumeTimer(id: string) {
    const timer = this.timers.get(id)
    if (timer) {
      timer.isPaused = false
      this.notifyUpdate()
    }
  }

  cancelTimer(id: string) {
    const timer = this.timers.get(id)
    if (timer) {
      timer.isActive = false
      this.stopTimer(id)
      this.timers.delete(id)
      this.notifyUpdate()
    }
  }

  getTimers(): Timer[] {
    return Array.from(this.timers.values())
  }

  private notifyUpdate() {
    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.getTimers())
    }
  }

  cleanup() {
    this.intervals.forEach((interval) => clearInterval(interval))
    this.intervals.clear()
    this.timers.clear()
  }
}
