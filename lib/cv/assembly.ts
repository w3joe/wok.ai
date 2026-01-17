/**
 * Assemble recipe from CV pipeline outputs
 * Combines scene detection, object detection, action recognition, and transcript
 */

import { SceneSegment } from './scene-detection'
import { CookingAction, extractTechniques } from './action-recognition'
import { ExtractedIngredient, TranscriptSegment, formatIngredient } from './transcript-parser'

export interface VisionDetectedObject {
  label: string
  confidence: number
  category: 'ingredient' | 'utensil' | 'cookware' | 'other'
  timestamp?: number
}

export interface CVAnalysisResult {
  scenes: SceneSegment[]
  visionObjects: VisionDetectedObject[]
  actions: CookingAction[]
  transcriptIngredients: ExtractedIngredient[]
  transcript: {
    fullText: string
    segments: TranscriptSegment[]
  }
  videoDuration: number
}

export interface AssembledRecipe {
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
  keyframes: Array<{
    timestamp: number
    dataUrl: string
  }>
}

// Ingredient categories from Vision API labels
const VISION_INGREDIENT_LABELS: Record<string, string> = {
  // Produce
  'vegetable': 'vegetable',
  'fruit': 'fruit',
  'apple': 'apple',
  'banana': 'banana',
  'orange': 'orange',
  'lemon': 'lemon',
  'lime': 'lime',
  'tomato': 'tomato',
  'onion': 'onion',
  'garlic': 'garlic',
  'carrot': 'carrot',
  'potato': 'potato',
  'broccoli': 'broccoli',
  'lettuce': 'lettuce',
  'cabbage': 'cabbage',
  'pepper': 'pepper',
  'chili pepper': 'chili',
  'mushroom': 'mushroom',
  'ginger': 'ginger',
  // Proteins
  'meat': 'meat',
  'beef': 'beef',
  'chicken': 'chicken',
  'pork': 'pork',
  'fish': 'fish',
  'seafood': 'seafood',
  'shrimp': 'shrimp',
  'egg': 'egg',
  'tofu': 'tofu',
  // Grains
  'rice': 'rice',
  'noodle': 'noodle',
  'pasta': 'pasta',
  'bread': 'bread',
  // Dairy
  'cheese': 'cheese',
  'milk': 'milk',
  'butter': 'butter',
  // Sauces
  'sauce': 'sauce',
  'condiment': 'condiment'
}

const UTENSIL_LABELS = [
  'knife', 'spoon', 'fork', 'spatula', 'ladle', 'whisk', 'tongs',
  'cutting board', 'bowl', 'plate', 'cup', 'glass'
]

const COOKWARE_LABELS = [
  'pan', 'pot', 'wok', 'skillet', 'saucepan', 'oven', 'stove',
  'microwave', 'blender', 'mixer', 'grill'
]

/**
 * Categorize a Vision API label
 */
export function categorizeVisionLabel(label: string): VisionDetectedObject['category'] {
  const lowerLabel = label.toLowerCase()

  if (VISION_INGREDIENT_LABELS[lowerLabel]) return 'ingredient'

  for (const utensil of UTENSIL_LABELS) {
    if (lowerLabel.includes(utensil)) return 'utensil'
  }

  for (const cookware of COOKWARE_LABELS) {
    if (lowerLabel.includes(cookware)) return 'cookware'
  }

  // Check for food-related terms
  const foodTerms = ['food', 'dish', 'meal', 'ingredient', 'produce', 'meat', 'vegetable', 'fruit']
  for (const term of foodTerms) {
    if (lowerLabel.includes(term)) return 'ingredient'
  }

  return 'other'
}

/**
 * Merge ingredients from Vision API and transcript
 */
function mergeIngredients(
  visionObjects: VisionDetectedObject[],
  transcriptIngredients: ExtractedIngredient[]
): string[] {
  const ingredientMap = new Map<string, {
    name: string
    quantity?: string
    unit?: string
    confidence: number
    hasQuantity: boolean
  }>()

  // Add transcript ingredients first (they have quantities)
  for (const ing of transcriptIngredients) {
    const key = ing.name.toLowerCase()
    ingredientMap.set(key, {
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      confidence: ing.confidence,
      hasQuantity: !!ing.quantity
    })
  }

  // Add Vision API ingredients (only if not already present)
  for (const obj of visionObjects) {
    if (obj.category !== 'ingredient') continue

    const label = VISION_INGREDIENT_LABELS[obj.label.toLowerCase()] || obj.label.toLowerCase()
    const key = label.toLowerCase()

    if (!ingredientMap.has(key)) {
      ingredientMap.set(key, {
        name: label,
        confidence: obj.confidence,
        hasQuantity: false
      })
    }
  }

  // Format ingredients
  const ingredients: string[] = []
  for (const [, ing] of ingredientMap) {
    if (ing.quantity && ing.unit) {
      ingredients.push(`${ing.quantity} ${ing.unit} ${ing.name}`)
    } else if (ing.quantity) {
      ingredients.push(`${ing.quantity} ${ing.name}`)
    } else {
      ingredients.push(ing.name)
    }
  }

  return ingredients
}

/**
 * Generate steps from scenes and actions
 */
function generateSteps(
  scenes: SceneSegment[],
  actions: CookingAction[],
  transcript: { segments: TranscriptSegment[] }
): AssembledRecipe['steps'] {
  const steps: AssembledRecipe['steps'] = []

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]

    // Find actions in this scene
    const sceneActions = actions.filter(
      a => a.startTime >= scene.startTime && a.startTime < scene.endTime
    )

    // Find transcript segments in this scene
    const sceneTranscript = transcript.segments.filter(
      s => s.startTime >= scene.startTime && s.endTime <= scene.endTime
    )

    // Build instruction from actions
    let instruction = ''
    if (sceneActions.length > 0) {
      const actionNames = [...new Set(sceneActions.map(a => a.action))]
      instruction = actionNames.map(a => capitalizeFirst(a)).join(', ')
    } else {
      instruction = `Step ${i + 1}`
    }

    // Build description from transcript
    const description = sceneTranscript.map(s => s.text).join(' ').trim()

    steps.push({
      instruction,
      description: description || `Continue with ${instruction.toLowerCase()}`,
      timestamp: scene.keyframeTimestamp
    })
  }

  return steps
}

/**
 * Calculate timing from scenes and actions
 */
function calculateTiming(
  scenes: SceneSegment[],
  actions: CookingAction[],
  videoDuration: number
): AssembledRecipe['timing'] {
  // Find first cooking action (non-prep)
  const cookingActions = ['frying', 'stirring', 'pouring', 'mixing']
  const firstCookingAction = actions.find(a => cookingActions.includes(a.action))

  let prepTime = 0
  let cookTime = 0

  if (firstCookingAction) {
    prepTime = Math.round(firstCookingAction.startTime / 60)
    cookTime = Math.round((videoDuration - firstCookingAction.startTime) / 60)
  } else {
    // Default: assume first half is prep, second half is cooking
    prepTime = Math.round(videoDuration / 120)
    cookTime = Math.round(videoDuration / 120)
  }

  // Minimum 1 minute for each phase
  prepTime = Math.max(prepTime, 1)
  cookTime = Math.max(cookTime, 1)

  return {
    prep: prepTime,
    cook: cookTime,
    total: prepTime + cookTime
  }
}

/**
 * Generate a recipe title from ingredients and actions
 */
function generateTitle(
  ingredients: string[],
  actions: CookingAction[]
): string {
  // Find main ingredients (first 2-3)
  const mainIngredients = ingredients
    .slice(0, 3)
    .map(i => {
      // Extract just the ingredient name (without quantity/unit)
      const parts = i.split(' ')
      return parts[parts.length - 1]
    })
    .filter(i => i.length > 2)

  // Find main cooking technique
  const techniques = extractTechniques(actions)
  const mainTechnique = techniques[0] || 'cooked'

  if (mainIngredients.length === 0) {
    return `${capitalizeFirst(mainTechnique)} Dish`
  }

  if (mainIngredients.length === 1) {
    return `${capitalizeFirst(mainTechnique)} ${capitalizeFirst(mainIngredients[0])}`
  }

  const ingredientPart = mainIngredients
    .map(capitalizeFirst)
    .slice(0, 2)
    .join(' and ')

  return `${capitalizeFirst(mainTechnique)} ${ingredientPart}`
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Assemble recipe from CV analysis results
 */
export function assembleRecipe(data: CVAnalysisResult): AssembledRecipe {
  // Merge ingredients from both sources
  const ingredients = mergeIngredients(data.visionObjects, data.transcriptIngredients)

  // Generate steps from scenes, actions, and transcript
  const steps = generateSteps(data.scenes, data.actions, data.transcript)

  // Calculate timing
  const timing = calculateTiming(data.scenes, data.actions, data.videoDuration)

  // Extract techniques
  const techniques = extractTechniques(data.actions)

  // Generate title
  const title = generateTitle(ingredients, data.actions)

  // Collect keyframes
  const keyframes = data.scenes.map(s => ({
    timestamp: s.keyframeTimestamp,
    dataUrl: s.keyframeDataUrl
  }))

  return {
    title,
    ingredients,
    steps,
    timing,
    techniques,
    keyframes
  }
}

/**
 * Convert assembled recipe to the RecipeStructure format used by the app
 */
export function toRecipeStructure(assembled: AssembledRecipe): {
  title: string
  ingredients: string[]
  steps: Array<{ instruction: string; description: string }>
  timing: { prep: number; cook: number; total: number }
  techniques: string[]
} {
  return {
    title: assembled.title,
    ingredients: assembled.ingredients,
    steps: assembled.steps.map(s => ({
      instruction: s.instruction,
      description: s.description
    })),
    timing: assembled.timing,
    techniques: assembled.techniques
  }
}
