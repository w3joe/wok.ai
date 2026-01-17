import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface AssembledRecipe {
  title: string
  ingredients: string[]
  steps: Array<{
    instruction: string
    description: string
    timestamp?: number
  }>
  timing: {
    prep: number
    cook: number
    total: number
  }
  techniques: string[]
}

// Initialize Gemini client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  return new GoogleGenerativeAI(apiKey)
}

const POLISH_PROMPT = `You are a recipe editor. Your task is to polish and improve a recipe that was automatically extracted from a cooking video using computer vision and speech recognition.

The recipe data below was assembled from:
- Visual object detection (ingredients seen in the video)
- Speech transcription (what the cook said)
- Action recognition (cooking techniques detected)

Your job is to:
1. Create a clear, appetizing recipe title that describes the dish
2. Clean up the ingredients list:
   - Fix any obvious OCR or transcription errors
   - Add reasonable quantities if missing (e.g., "1 tablespoon" instead of just "oil")
   - Remove non-ingredient items
3. Improve the step instructions:
   - Make them clear and actionable
   - Combine or split steps if needed for clarity
   - Preserve the chef's tips from the descriptions
4. Verify the techniques list makes sense for this dish

IMPORTANT:
- Keep the recipe authentic to what was shown in the video
- Don't add ingredients or steps that weren't detected
- Preserve any timing information
- Keep descriptions conversational but informative

Return your response as a JSON object with this exact structure:
{
  "title": "Recipe Title",
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
  "steps": [
    { "instruction": "Brief action", "description": "Detailed explanation with tips" }
  ],
  "techniques": ["technique1", "technique2"]
}

Do NOT include any markdown formatting or code blocks. Return ONLY the JSON object.`

export async function POST(request: NextRequest) {
  try {
    const recipe: AssembledRecipe = await request.json()

    if (!recipe.title || !recipe.ingredients || !recipe.steps) {
      return NextResponse.json(
        { error: 'Invalid recipe data' },
        { status: 400 }
      )
    }

    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const recipeData = JSON.stringify({
      title: recipe.title,
      ingredients: recipe.ingredients,
      steps: recipe.steps.map(s => ({
        instruction: s.instruction,
        description: s.description
      })),
      techniques: recipe.techniques
    }, null, 2)

    const result = await model.generateContent([
      { text: POLISH_PROMPT },
      { text: `\nRecipe to polish:\n${recipeData}` }
    ])

    const response = result.response.text()

    // Parse JSON response
    let polished
    try {
      // Remove any markdown code blocks if present
      let jsonStr = response
      if (jsonStr.includes('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```\n?/g, '')
      }
      polished = JSON.parse(jsonStr.trim())
    } catch (parseError) {
      console.error('Failed to parse LLM response:', response)
      // Return original recipe if parsing fails
      return NextResponse.json({
        title: recipe.title,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        techniques: recipe.techniques,
        _polished: false
      })
    }

    // Merge with original timing (LLM shouldn't change timing)
    return NextResponse.json({
      title: polished.title || recipe.title,
      ingredients: polished.ingredients || recipe.ingredients,
      steps: polished.steps?.map((s: any, i: number) => ({
        instruction: s.instruction,
        description: s.description,
        timestamp: recipe.steps[i]?.timestamp
      })) || recipe.steps,
      techniques: polished.techniques || recipe.techniques,
      timing: recipe.timing,
      _polished: true
    })

  } catch (error) {
    console.error('Recipe polish error:', error)

    const message = error instanceof Error ? error.message : 'Recipe polish failed'

    if (message.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        { error: 'Gemini API not configured' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
