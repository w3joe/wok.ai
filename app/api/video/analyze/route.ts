import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { structureRecipeFromTranscript, RecipeStructure } from '@/lib/recipe-structure'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface KeyMoment {
    timestamp: number
    type: 'ingredient' | 'technique' | 'doneness' | 'general'
    label: string
    description: string
}

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY
        console.log('GEMINI_API_KEY configured:', apiKey ? `Yes (starts with ${apiKey.substring(0, 10)}...)` : 'No')

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Gemini API key not configured' },
                { status: 500 }
            )
        }

        // Accept video as form data
        const formData = await request.formData()
        const videoFile = formData.get('video') as File | null
        const language = (formData.get('language') as string) || 'en'

        if (!videoFile) {
            return NextResponse.json(
                { error: 'No video file provided' },
                { status: 400 }
            )
        }

        console.log('=== VIDEO ANALYSIS WITH GEMINI 2.5 FLASH ===')
        console.log('Video file:', videoFile.name)
        console.log('Video size:', videoFile.size, 'bytes')
        console.log('Video type:', videoFile.type)
        console.log('Language:', language)
        console.log('')

        // Convert video to base64
        const videoBuffer = await videoFile.arrayBuffer()
        const videoBase64 = Buffer.from(videoBuffer).toString('base64')
        console.log('Base64 size:', videoBase64.length, 'chars')

        // Use Gemini 2.5 Flash for video analysis
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        const promptText = `You are an expert chef analyzing a cooking video. Watch this video and:
1. Transcribe what is being said (narration or instructions).
   - IMPORTANT: IGNORE background music, lyrics, or random noise. Only transcribe speech related to the cooking or recipe instructions.
2. Describe what's happening visually
3. Extract a complete recipe with ingredients, steps, timing, and techniques

Language: ${language === 'en' ? 'English' : language === 'zh' ? 'Chinese' : language === 'ms' ? 'Malay' : 'English'}

Return your analysis as a JSON object (no markdown code blocks):
{
  "transcript": "Full transcription of the spoken instructions/narration",
  "visualDescription": "Description of what you see happening in the video",
  "recipe": {
    "title": "Name of the dish",
    "ingredients": ["ingredient 1 with quantity", "ingredient 2", ...],
    "steps": ["Step 1: detailed instruction", "Step 2: detailed instruction", ...],
    "timing": { "prep": 10, "cook": 20, "total": 30 },
    "techniques": ["technique 1", "technique 2", ...]
  },
  "keyMoments": [
    { "timestamp": 5, "type": "ingredient|technique|doneness|general", "label": "Short label", "description": "What's happening" }
  ]
}

Be thorough in your analysis. Return ONLY the JSON object.`

        console.log('PROMPT:')
        console.log(promptText.substring(0, 300) + '...')
        console.log('')
        console.log('Sending video to Gemini 2.5 Flash...')

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: videoFile.type || 'video/mp4',
                    data: videoBase64
                }
            },
            { text: promptText }
        ])

        const responseText = result.response.text().trim()
        console.log('')
        console.log('=== GEMINI RESPONSE ===')
        console.log('Response length:', responseText.length, 'chars')
        console.log('')
        console.log('RAW RESPONSE:')
        console.log(responseText)
        console.log('=== END RESPONSE ===')

        let analysisResult: {
            transcript: string
            visualDescription?: string
            recipe: RecipeStructure
            keyMoments: KeyMoment[]
        } = {
            transcript: '',
            visualDescription: '',
            recipe: { title: '', ingredients: [], steps: [], timing: { prep: 0, cook: 0, total: 0 }, techniques: [] },
            keyMoments: []
        }

        try {
            let jsonText = responseText
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '')
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '')
            }
            analysisResult = JSON.parse(jsonText)
            console.log('Parsed initial video analysis. Transcript length:', analysisResult.transcript?.length)

            // --- NEW: Re-structure using the dedicated voice flow logic ---
            if (analysisResult.transcript) {
                try {
                    console.log('Structuring recipe from transcript...')
                    const structuredRecipe = await structureRecipeFromTranscript(analysisResult.transcript)
                    console.log('Successfully structured recipe:', structuredRecipe.title)

                    // Only override if the structured recipe actually has content
                    if (structuredRecipe.steps && structuredRecipe.steps.length > 0) {
                        console.log(`Overriding video recipe with structured recipe (${structuredRecipe.steps.length} steps)`)
                        analysisResult.recipe = structuredRecipe
                    } else {
                        console.warn('Structured recipe has no steps, keeping original video analysis')
                    }
                } catch (structureError) {
                    console.error('Failed to strict-structure recipe, falling back to video analysis result:', structureError)
                    // Fallback is already in analysisResult.recipe, so we just log the warning
                }
            }
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', parseError)
            // Use raw response as transcript
            analysisResult.transcript = responseText
            analysisResult.recipe = {
                title: 'Analyzed Recipe',
                ingredients: [],
                steps: ['See transcript for details'],
                timing: { prep: 10, cook: 20, total: 30 },
                techniques: []
            }

            // Even if JSON parse failed, if we have text, we can try to structure it? 
            // Often if JSON fails, the text is the transcript. Let's try one more time if it looks like text.
            if (responseText.length > 50) {
                try {
                    const structuredRecipe = await structureRecipeFromTranscript(responseText)
                    analysisResult.recipe = structuredRecipe
                    analysisResult.transcript = responseText // Assume the whole text was the transcript
                } catch (e) {
                    console.log('Fallback structure failed too')
                }
            }
        }

        // Ensure keyMoments has fallback
        if (!analysisResult.keyMoments || analysisResult.keyMoments.length === 0) {
            analysisResult.keyMoments = [
                { timestamp: 5, type: 'general', label: 'Start', description: 'Beginning of video' },
                { timestamp: 30, type: 'general', label: 'Cooking', description: 'Main cooking' },
                { timestamp: 60, type: 'general', label: 'Finish', description: 'Recipe complete' }
            ]
        }

        return NextResponse.json({
            transcript: analysisResult.transcript,
            visualDescription: analysisResult.visualDescription || '',
            keyMoments: analysisResult.keyMoments,
            recipe: analysisResult.recipe,
            language,
            rawResponse: responseText // Include raw response for debugging
        })
    } catch (error: unknown) {
        console.error('Error analyzing video:', error)

        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.log('ERROR DETAILS:', errorMessage)

        if (errorMessage.includes('429') || errorMessage.includes('quota')) {
            return NextResponse.json(
                {
                    error: 'API rate limit reached. Please wait and try again.',
                    details: errorMessage
                },
                { status: 429 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to analyze video', details: errorMessage },
            { status: 500 }
        )
    }
}
