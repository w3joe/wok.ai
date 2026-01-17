
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface RecipeStructure {
    title: string
    ingredients: string[]
    steps: string[]
    timing: {
        prep: number
        cook: number
        total: number
    }
    techniques: string[]
}

export async function structureRecipeFromTranscript(transcript: string): Promise<RecipeStructure> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `You are a recipe structuring assistant. Analyze the following recipe narration and extract structured information.

Recipe narration:
${transcript}

Extract and return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just the JSON):
{
  "title": "Recipe name",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "steps": ["step 1", "step 2", ...],
  "timing": {
    "prep": minutes as number,
    "cook": minutes as number,
    "total": minutes as number
  },
  "techniques": ["technique 1", "technique 2", ...]
}

Rules:
- Extract a clear, concise title
- List all ingredients with quantities
- Break down into clear, numbered steps
- Extract timing information (prep, cook, total in minutes)
- Identify cooking techniques mentioned (e.g., "sauté", "boil", "dice")
- Return ONLY the JSON object, no other text`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // Clean up the response - remove markdown code blocks if present
    let jsonText = responseText.trim()
    if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }

    // Parse the JSON response
    const recipe = JSON.parse(jsonText)

    // Validate the structure
    if (!recipe.title || !recipe.ingredients || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0 ||
        !recipe.steps || !Array.isArray(recipe.steps) || recipe.steps.length === 0) {
        throw new Error('Invalid recipe structure returned by AI: missing or empty ingredients/steps')
    }

    return recipe
}
