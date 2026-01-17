# Voice Assistant Setup Guide

Quick guide to set up the ElevenLabs voice assistant for Wok.AI.

## Prerequisites

1. ElevenLabs account with API access
2. Node.js and pnpm installed
3. Microphone-enabled device

## Step 1: Install Dependencies

Dependencies are already installed in `package.json`:
- `@11labs/react` - ElevenLabs React SDK
- `@elevenlabs/elevenlabs-js` - ElevenLabs JavaScript SDK (for server-side)

If needed, run:
```bash
pnpm install
```

## Step 2: Create ElevenLabs Agent

1. Go to [ElevenLabs Agents Platform](https://elevenlabs.io/app/agents)
2. Click "Create Agent"
3. Configure your agent:
   - **Name:** Wok.AI Cooking Assistant
   - **Voice:** Choose a friendly, clear voice
   - **Language:** English (or your preference)

### Configure Client Tools

Add these four client tools in the ElevenLabs UI:

#### Tool 1: nextStep
- **Name:** `nextStep`
- **Description:** Move to the next cooking step
- **Parameters:** None

#### Tool 2: previousStep
- **Name:** `previousStep`
- **Description:** Go back to the previous cooking step
- **Parameters:** None

#### Tool 3: repeatStep
- **Name:** `repeatStep`
- **Description:** Repeat the current cooking step
- **Parameters:** None

#### Tool 4: setTimer
- **Name:** `setTimer`
- **Description:** Set a cooking timer for a specified number of minutes
- **Parameters:**
  - `minutes` (number, required) - Number of minutes for the timer

### System Prompt (Optional)

You can add a system prompt to guide the agent:

```
You are a helpful cooking assistant. When users ask you to:
- Move forward in the recipe → Call the nextStep tool
- Go back → Call the previousStep tool
- Repeat instructions → Call the repeatStep tool
- Set a timer → Call the setTimer tool with the minutes parameter

For other questions, provide helpful cooking advice based on the recipe context you receive.
Be encouraging, concise, and supportive since the user is actively cooking.
```

4. Save your agent and copy the **Agent ID** (starts with `agent_`)

## Step 3: Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# ElevenLabs API Key (get from https://elevenlabs.io/app/settings/api-keys)
ELEVENLABS_API_KEY=your_api_key_here

# ElevenLabs Agent ID (from the agent you just created)
ELEVENLABS_AGENT_ID=agent_xxxxx
```

**Important:**
- Never commit `.env.local` to git
- Keep your API key secret
- The agent ID is safe to expose (it's public)

## Step 4: Test the Setup

1. Start the development server:
```bash
pnpm dev
```

2. Navigate to a recipe page (e.g., `/cook/[recipe-id]`)

3. Click "Start Voice Assistant"

4. Grant microphone permissions when prompted

5. Try saying:
   - "Next step"
   - "What ingredients do I need?"
   - "Set timer for 5 minutes"
   - "How do I dice an onion?"

## Troubleshooting

### "Failed to get agent ID"
- Check that `ELEVENLABS_AGENT_ID` is set in `.env.local`
- Restart the dev server after adding environment variables

### "Microphone permission denied"
- Check browser settings
- Ensure you're using HTTPS (required for microphone access)
- Try a different browser

### "Connection error occurred"
- Verify your API key is correct
- Check that the agent ID is valid
- Ensure you have internet connection

### Client tools not working
- Verify tool names in ElevenLabs UI match exactly:
  - `nextStep`, `previousStep`, `repeatStep`, `setTimer`
- Ensure `setTimer` has a `minutes` parameter of type `number`
- Check the agent's system prompt guides it to use tools

## Testing Checklist

- [ ] Voice assistant button appears on cook page
- [ ] Clicking button requests microphone permission
- [ ] Connection status shows "Listening" when active
- [ ] Saying "next step" advances to next step
- [ ] Saying "previous step" goes back
- [ ] Saying "set timer for 5 minutes" creates a timer
- [ ] Asking questions gets voice responses
- [ ] Transcripts appear in the UI
- [ ] Agent responses appear in the UI

## Production Deployment

### Environment Variables

Set these in your production environment (Vercel, Netlify, etc.):

```bash
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_AGENT_ID=agent_xxxxx
```

### HTTPS Required

Voice assistant requires HTTPS for microphone access. Most hosting platforms (Vercel, Netlify) provide HTTPS automatically.

### Performance

- WebRTC connection: ~100-200ms latency
- Initial connection: ~1-2 seconds
- Memory usage: ~50MB
- Works on desktop and mobile browsers

## Architecture Overview

```
User speaks → Microphone → @11labs/react SDK → WebRTC → ElevenLabs API
                                                              ↓
User hears ← Speaker ← @11labs/react SDK ← WebRTC ← ElevenLabs Agent
                            ↓
                    Client Tools Called
                            ↓
                    UI Updates (steps, timers)
```

## Next Steps

1. Customize the agent's voice and personality
2. Add more client tools for additional features
3. Improve the system prompt for better responses
4. Add analytics to track usage
5. Implement user feedback collection

## Resources

- [Full Implementation Guide](./VOICE_ASSISTANT_IMPLEMENTATION.md)
- [ElevenLabs Documentation](https://elevenlabs.io/docs)
- [React SDK Reference](https://elevenlabs.io/docs/conversational-ai/libraries/react)
- [Client Tools Guide](https://elevenlabs.io/docs/conversational-ai/client-tools)

## Support

For help:
1. Check the [Implementation Guide](./VOICE_ASSISTANT_IMPLEMENTATION.md)
2. Review browser console for errors
3. Test with ElevenLabs playground first
4. Contact ElevenLabs support if API issues persist
