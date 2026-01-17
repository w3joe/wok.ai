# Wok.AI - Voice-Based Agentic Recipe App

A Next.js application that allows chefs to record recipes using voice and enables cooks to follow recipes with hands-free voice assistance powered by ElevenLabs Conversational AI.

> **✨ Now using official `@elevenlabs/react` SDK for improved performance and reliability!**

## Features

### 🎙️ Feature 1: Chef Recipe Recording
- Voice recording of cooking process
- Real-time speech-to-text transcription using ElevenLabs
- AI-powered recipe structuring with Gemini Flash 2.5
- Auto-extraction of ingredients, steps, timing, and techniques
- Review and publish to recipe library

### 🗣️ Feature 2: Voice Assistant for Cooking
- Hands-free voice navigation through recipe steps
- Voice commands: "next step", "previous step", "repeat that"
- Voice-activated timer setting
- Multiple simultaneous timers with alerts
- Ask questions mid-cooking with ElevenLabs Conversational AI
- Real-time step-by-step guidance
- **WebRTC support** for ultra-low latency (~100-200ms)
- **Client tools** for seamless UI integration

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui (Orange theme)
- **Database**: Supabase
- **Speech-to-Text**: ElevenLabs API
- **Conversational AI**: ElevenLabs Agents Platform (with `@elevenlabs/react` SDK)
- **LLM**: Google Gemini Flash 2.5
- **Package Manager**: pnpm

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
3. Get your Supabase URL and anon key from Project Settings > API

### 3. Set Up ElevenLabs

1. Sign up at [elevenlabs.io](https://elevenlabs.io)
2. Get your API key from your profile settings
3. **Create a conversational AI agent** (Required)
   - Go to [ElevenLabs Agents Dashboard](https://elevenlabs.io/app/agents)
   - Create a new agent
   - Configure client tools (see `SETUP_CHECKLIST.md` for details):
     - `nextStep` - Move to next recipe step
     - `previousStep` - Go back to previous step
     - `repeatStep` - Repeat current step
     - `setTimer` - Set a timer (parameter: `minutes` as number)
   - Save your agent and copy the agent ID

### 4. Set Up Google Gemini

1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 5. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# ElevenLabs (Server-side only for security)
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# ElevenLabs Agent (Optional - if using fixed agent ID)
ELEVENLABS_AGENT_ID=your_agent_id_from_elevenlabs

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key
```

**Note:** The API key is now server-side only (no `NEXT_PUBLIC_` prefix) for better security.

### 6. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Recording a Recipe

1. Click "Record Recipe" on the home page
2. Press the microphone button and start cooking
3. Narrate your recipe as you cook (ingredients, steps, techniques)
4. Press stop when finished
5. AI will structure your narration into a formatted recipe
6. Review and publish to the library

### Cooking with Voice Assistant

1. Select a recipe from the library
2. Click "Start Voice Assistant"
3. Use voice commands:
   - Say "next step" to move forward
   - Say "previous step" to go back
   - Say "repeat that" to hear the current step again
   - Say "set timer for X minutes" to start a timer
   - Ask questions about techniques or ingredients

## Project Structure

```
/app
  /api                  # API routes
    /transcribe         # ElevenLabs Speech-to-Text
    /structure-recipe   # Gemini recipe structuring
    /recipes            # Recipe CRUD operations
    /conversation       # Voice assistant config
  /record              # Chef recording page
  /cook/[id]           # Voice assistant cooking page
  page.tsx             # Home page with recipe library

/components
  /ui                  # shadcn/ui components
  VoiceRecorder.tsx    # Recording component
  RecipeReview.tsx     # Recipe review component
  VoiceAssistant.tsx   # Voice assistant component
  TimerDisplay.tsx     # Timer management component

/lib
  supabase.ts          # Supabase client
  timer-manager.ts     # Timer management system
  utils.ts             # Utility functions
```

## Voice Commands

- **"Next step"** / **"Next"** - Move to the next step
- **"Previous step"** / **"Back"** - Go to the previous step
- **"Repeat that"** / **"Repeat"** - Repeat the current step
- **"Set timer for X minutes"** - Start a timer (e.g., "Set timer for 10 minutes")
- **Questions** - Ask anything about the recipe, techniques, or ingredients

## Browser Permissions

The app requires:
- **Microphone access** for voice recording and voice commands
- **Notification permissions** (optional) for timer alerts

## Documentation

For detailed setup instructions, see **`SETUP_VOICE_ASSISTANT.md`**

## Performance

The voice assistant now uses the official ElevenLabs React SDK with:
- **WebRTC support** for ultra-low latency (~100-200ms vs ~300-500ms WebSocket)
- **46% less code** compared to custom implementation
- **Automatic error recovery** and reconnection
- **Better audio quality** with native WebRTC processing
- **Client tools** for seamless UI integration

## Notes

- The app works best in modern browsers (Chrome, Edge, Safari)
- For the best voice assistant experience, use in a quiet environment
- Timer alerts use browser audio or notifications
- All recipes are publicly accessible (no authentication)
- **HTTPS required** for microphone access in production
- **Client tools must be configured** in ElevenLabs dashboard (see `SETUP_CHECKLIST.md`)

## Future Enhancements

- User authentication and private recipes
- Recipe editing after publication
- Recipe search and filtering
- Social features (ratings, comments)
- Recipe collections and meal planning
- Integration with smart kitchen devices
- Multi-language support

## License

MIT
