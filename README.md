# Wok.AI - AI-Powered Recipe Capture & Voice Cooking Assistant

A Next.js application that transforms how recipes are created and followed. Record cooking videos or narrate recipes with voice, then cook hands-free with an AI voice assistant powered by ElevenLabs Conversational AI.

> **✨ Now featuring dual-mode video analysis: Gemini 2.5 Flash for full AI analysis or Computer Vision pipeline for minimal LLM usage!**

## Features

### 🎙️ Voice Recording Mode
Record recipes through voice narration as you cook:
- **Real-time transcription** using ElevenLabs Speech-to-Text API
- **AI-powered structuring** with Google Gemini Flash 2.5
- **Automatic extraction** of ingredients, steps, timing, and techniques
- **Review and edit** before publishing to your library

### 🎥 Video Recording Mode
Capture cooking videos with advanced AI analysis:
- **Record live** or **upload existing videos**
- **Multi-language support** (English, Chinese, Malay, Tamil, Indonesian, Thai)
- **Dual analysis modes:**
  - **Gemini AI Mode**: Full video understanding with visual + audio analysis
  - **CV Pipeline Mode**: Computer vision-based analysis with minimal LLM usage
    - Scene detection and keyframe extraction
    - Google Cloud Vision API for object/ingredient detection
    - MediaPipe hand tracking for cooking action recognition (chopping, stirring, mixing)
    - OpenAI Whisper for audio transcription
    - Intelligent recipe assembly from all sources
- **Visual key moments** extraction with timestamps
- **Frame-by-frame analysis** for critical cooking steps

### 🗣️ Voice Assistant for Cooking
Hands-free cooking guidance with conversational AI:
- **Natural voice commands**: "next step", "previous step", "repeat that"
- **Voice-activated timers**: "set timer for 10 minutes"
- **Ask questions mid-cooking**: Get instant answers about techniques, ingredients, or substitutions
- **Real-time step navigation** with audio feedback
- **Multiple simultaneous timers** with visual countdown and alerts
- **WebRTC support** for ultra-low latency (~100-200ms)
- **Client tools integration** for seamless UI updates

### 📚 Recipe Library
Organize and access your recipe collection:
- **Search functionality** with voice search support
- **Sort by**: Newest, Alphabetical, Cook Time
- **Recipe cards** with timing, step count, and techniques
- **Quick access** to any recipe for cooking

### 🔐 Authentication (Optional)
- **Supabase Auth** integration with email/password
- **User accounts** for private recipe collections
- **Public recipes** accessible without login
- **Row-level security** for data protection

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI & ML**:
  - **LLM**: Google Gemini Flash 2.5 (video analysis, recipe structuring)
  - **Speech-to-Text**: ElevenLabs API & OpenAI Whisper
  - **Conversational AI**: ElevenLabs Agents Platform with `@elevenlabs/react` SDK
  - **Computer Vision**: Google Cloud Vision API
  - **Action Recognition**: MediaPipe Hands (hand tracking)
- **Video Processing**: FFmpeg (server-side), Canvas API (client-side)
- **Package Manager**: pnpm

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schemas in order:
   - `supabase-schema.sql` - Main database schema
   - `supabase-auth-migration.sql` - Authentication tables
   - `supabase-fix-rls.sql` - Row-level security policies
3. Get your Supabase URL and anon key from Project Settings > API

### 3. Set Up ElevenLabs

1. Sign up at [elevenlabs.io](https://elevenlabs.io)
2. Get your API key from your profile settings
3. **Create a conversational AI agent** (Required for voice assistant):
   - Go to [ElevenLabs Agents Dashboard](https://elevenlabs.io/app/agents)
   - Create a new agent with a clear, friendly voice
   - Configure **client tools** (see `SETUP_VOICE_ASSISTANT.md` for details):
     - `nextStep` - Move to next recipe step
     - `previousStep` - Go back to previous step
     - `repeatStep` - Repeat current step
     - `setTimer` - Set a timer (parameter: `minutes` as number)
   - Copy your agent ID

### 4. Set Up Google Gemini

1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Enable the Gemini API for your project

### 5. Set Up Google Cloud Vision (Optional - for CV Pipeline)

1. Create a project at [Google Cloud Console](https://console.cloud.google.com)
2. Enable the Cloud Vision API
3. Create a service account and download the JSON key
4. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable

### 6. Set Up OpenAI Whisper (Optional - for CV Pipeline)

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to environment variables

### 7. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# ElevenLabs (Server-side only for security)
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_agent_id_from_elevenlabs

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Google Cloud Vision (Optional - for CV Pipeline)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
# Or use the key directly:
GOOGLE_CLOUD_VISION_KEY=your_vision_api_key

# OpenAI Whisper (Optional - for CV Pipeline audio transcription)
OPENAI_API_KEY=your_openai_api_key
```

**Security Notes:**
- Never commit `.env.local` to git
- API keys are server-side only (no `NEXT_PUBLIC_` prefix)
- The agent ID can be exposed client-side

### 8. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Recording a Recipe (Voice Mode)

1. Click **"Start Recording"** on the home page or navigate to `/record`
2. Press the microphone button and start cooking
3. Narrate your recipe as you cook (mention ingredients, steps, techniques, timing)
4. Press stop when finished
5. AI will structure your narration into a formatted recipe
6. Review, edit if needed, and publish to your library

### Recording a Recipe (Video Mode)

1. Navigate to **"Video Intel"** or `/record-video`
2. Choose your input method:
   - **Upload Video**: Select an existing cooking video
   - **Record Live**: Use your camera to record a new video
3. Select the **language** spoken in the video
4. Choose **analysis mode**:
   - **Gemini AI**: Full LLM-powered video understanding (faster, more accurate)
   - **CV Pipeline**: Computer vision + minimal LLM (more detailed technical analysis)
5. Click **"Analyze Video"** and wait for processing
6. Review the extracted recipe, transcript, and key moments
7. Edit if needed and publish

### Cooking with Voice Assistant

1. Select a recipe from your library
2. Click **"Start Voice Assistant"** on the recipe page
3. Grant microphone permissions when prompted
4. Use voice commands:
   - **"Next step"** / **"Next"** - Move forward
   - **"Previous step"** / **"Back"** - Go back
   - **"Repeat that"** / **"Repeat"** - Hear current step again
   - **"Set timer for X minutes"** - Start a timer
   - **Ask questions** - "How do I dice an onion?", "What can I substitute for soy sauce?"
5. View step-by-step instructions, ingredients, and active timers
6. Mark steps as complete by clicking the checkbox

## Project Structure

```
/app
  /api                      # API routes
    /audio/transcribe       # ElevenLabs Speech-to-Text
    /video/analyze          # Gemini video analysis
    /video/extract-frames   # Frame extraction
    /vision/analyze         # Google Cloud Vision API
    /structure-recipe       # Recipe structuring with Gemini
    /recipe/polish          # Recipe refinement
    /recipes                # Recipe CRUD operations
    /conversation/agent     # Voice assistant config
  /record                   # Voice recording page
  /record-video             # Video recording page
  /recipes                  # Recipe library page
  /cook/[id]                # Voice assistant cooking page
  /login                    # Authentication page
  page.tsx                  # Home page

/components
  /ui                       # shadcn/ui components
  /auth                     # Authentication components
  VoiceRecorder.tsx         # Voice recording component
  VideoRecorder.tsx         # Video recording component
  VideoUploader.tsx         # Video upload component
  VideoReview.tsx           # Video review & editing
  RecipeReview.tsx          # Recipe review component
  VoiceAssistant.tsx        # Voice assistant component
  TimerDisplay.tsx          # Timer management component
  TranscriptEditor.tsx      # Video analysis component
  Header.tsx                # Navigation header

/lib
  /cv                       # Computer vision pipeline
    pipeline.ts             # CV orchestrator
    scene-detection.ts      # Scene change detection
    action-recognition.ts   # Hand tracking & action classification
    transcript-parser.ts    # Audio transcription parsing
    assembly.ts             # Recipe assembly from CV data
  supabase.ts               # Supabase client
  timer-manager.ts          # Timer management system
  recipe-structure.ts       # Recipe structuring logic
  utils.ts                  # Utility functions

/context
  AuthContext.tsx           # Authentication context provider
```

## Voice Commands

### Navigation
- **"Next step"** / **"Next"** - Move to the next step
- **"Previous step"** / **"Back"** / **"Go back"** - Go to the previous step
- **"Repeat that"** / **"Repeat"** / **"Say that again"** - Repeat the current step

### Timers
- **"Set timer for X minutes"** - Start a timer (e.g., "Set timer for 10 minutes")
- **"Set a 5 minute timer"** - Alternative phrasing
- Timers run in the background with visual countdown
- Audio alert when timer completes

### Questions
- **"What ingredients do I need?"**
- **"How do I [technique]?"** - e.g., "How do I julienne carrots?"
- **"What can I substitute for [ingredient]?"**
- **"Why do we [action]?"** - e.g., "Why do we rest the meat?"
- Ask anything about cooking techniques, ingredients, or the recipe

## Browser Requirements

### Required Permissions
- **Microphone access** - For voice recording and voice commands
- **Camera access** (optional) - For live video recording
- **Notification permissions** (optional) - For timer alerts

### Supported Browsers
- **Chrome/Edge** (recommended) - Full support for all features
- **Safari** - Supported with some limitations on WebRTC
- **Firefox** - Supported with some limitations on speech recognition

### HTTPS Required
- Microphone and camera access require HTTPS in production
- Development on `localhost` works without HTTPS

## Performance

### Voice Assistant
- **WebRTC latency**: ~100-200ms (vs ~300-500ms WebSocket)
- **Initial connection**: ~1-2 seconds
- **Memory usage**: ~50MB
- **46% less code** compared to custom implementation
- **Automatic error recovery** and reconnection

### Video Analysis
- **Gemini AI Mode**: 
  - Processing time: ~30-60 seconds for 5-minute video
  - Accuracy: High for both visual and audio analysis
  - Best for: General recipe extraction
  
- **CV Pipeline Mode**:
  - Processing time: ~2-3 minutes for 5-minute video
  - Accuracy: High for technical details
  - Best for: Detailed action recognition and timing analysis

## Documentation

- **[SETUP_VOICE_ASSISTANT.md](./SETUP_VOICE_ASSISTANT.md)** - Detailed voice assistant setup guide
- **[supabase-schema.sql](./supabase-schema.sql)** - Database schema
- **[supabase-auth-migration.sql](./supabase-auth-migration.sql)** - Authentication setup
- **[supabase-fix-rls.sql](./supabase-fix-rls.sql)** - Row-level security policies

## Features in Detail

### Computer Vision Pipeline

The CV pipeline provides detailed analysis without heavy LLM usage:

1. **Scene Detection**: Analyzes video frames to detect scene changes and extract keyframes
2. **Object Detection**: Uses Google Cloud Vision API to identify ingredients and cooking tools
3. **Action Recognition**: MediaPipe hand tracking to detect cooking actions:
   - Chopping/Cutting
   - Stirring/Mixing
   - Pouring
   - Flipping
   - Seasoning
4. **Audio Transcription**: OpenAI Whisper for accurate speech-to-text
5. **Recipe Assembly**: Combines all data sources to generate structured recipes

### Voice Assistant Architecture

```
User speaks → Microphone → @elevenlabs/react SDK → WebRTC → ElevenLabs API
                                                                  ↓
User hears ← Speaker ← @elevenlabs/react SDK ← WebRTC ← ElevenLabs Agent
                            ↓
                    Client Tools Called
                            ↓
                    UI Updates (steps, timers)
```

### Timer Management

- **Multiple simultaneous timers** with unique labels
- **Visual countdown** with progress bars
- **Pause/Resume/Cancel** functionality
- **Audio alerts** when timers complete
- **Browser notifications** as fallback
- **Persistent across page navigation**

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in project settings
4. Deploy

### Environment Variables for Production

Set all environment variables from `.env.local` in your hosting platform's settings.

### HTTPS Configuration

HTTPS is automatically provided by Vercel, Netlify, and other modern hosting platforms.

## Future Enhancements

- [ ] Recipe editing after publication
- [ ] Advanced search with filters (cuisine, difficulty, dietary restrictions)
- [ ] Social features (ratings, comments, sharing)
- [ ] Recipe collections and meal planning
- [ ] Integration with smart kitchen devices
- [ ] More language support for video analysis
- [ ] Ingredient substitution suggestions
- [ ] Nutritional information calculation
- [ ] Shopping list generation
- [ ] Recipe scaling (adjust servings)
- [ ] Export recipes to PDF
- [ ] Recipe import from URLs

## Troubleshooting

### Voice Assistant Issues

**"Failed to get agent ID"**
- Check that `ELEVENLABS_AGENT_ID` is set in `.env.local`
- Restart the dev server after adding environment variables

**"Microphone permission denied"**
- Check browser settings and grant microphone access
- Ensure you're using HTTPS (or localhost for development)

**Client tools not working**
- Verify tool names in ElevenLabs dashboard match exactly
- Ensure `setTimer` has a `minutes` parameter of type `number`
- Check the agent's system prompt guides it to use tools

### Video Analysis Issues

**"Video analysis failed"**
- Check video format (MP4, WebM supported)
- Ensure video file size is under 50MB
- Verify `GEMINI_API_KEY` is set correctly

**CV Pipeline errors**
- Ensure Google Cloud Vision API is enabled
- Check `GOOGLE_APPLICATION_CREDENTIALS` path is correct
- Verify OpenAI API key for Whisper transcription

### Database Issues

**"Failed to fetch recipes"**
- Check Supabase connection settings
- Verify RLS policies are set up correctly
- Run `supabase-fix-rls.sql` if needed

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

---

**Built with ❤️ for home chefs who love technology**
