/**
 * Extract ingredients and quantities from transcript text
 * Uses regex patterns - no LLM required
 */

export interface ExtractedIngredient {
  name: string
  quantity?: string
  unit?: string
  raw: string            // original matched text
  confidence: number
  source: 'transcript'
}

export interface TranscriptSegment {
  text: string
  startTime: number
  endTime: number
}

// Common cooking units
const UNITS = [
  'cup', 'cups', 'c',
  'tablespoon', 'tablespoons', 'tbsp', 'tbs', 'tb',
  'teaspoon', 'teaspoons', 'tsp', 'ts',
  'ounce', 'ounces', 'oz',
  'pound', 'pounds', 'lb', 'lbs',
  'gram', 'grams', 'g',
  'kilogram', 'kilograms', 'kg',
  'milliliter', 'milliliters', 'ml',
  'liter', 'liters', 'l',
  'pinch', 'pinches',
  'dash', 'dashes',
  'handful', 'handfuls',
  'bunch', 'bunches',
  'clove', 'cloves',
  'slice', 'slices',
  'piece', 'pieces',
  'can', 'cans',
  'package', 'packages', 'pkg',
  'head', 'heads',
  'stalk', 'stalks',
  'sprig', 'sprigs',
  'sheet', 'sheets'
]

// Common food items (for pattern matching)
const COMMON_INGREDIENTS = [
  // Proteins
  'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'prawn', 'prawns',
  'tofu', 'egg', 'eggs', 'bacon', 'sausage', 'lamb', 'duck', 'turkey',
  // Vegetables
  'onion', 'garlic', 'ginger', 'carrot', 'potato', 'tomato', 'pepper', 'chili', 'chilli',
  'broccoli', 'cabbage', 'spinach', 'lettuce', 'cucumber', 'celery', 'mushroom', 'mushrooms',
  'bok choy', 'bokchoy', 'bean sprout', 'bean sprouts', 'corn', 'peas', 'beans',
  'eggplant', 'zucchini', 'squash', 'pumpkin', 'kale', 'asparagus', 'cauliflower',
  'scallion', 'scallions', 'green onion', 'green onions', 'spring onion', 'leek',
  // Fruits
  'lemon', 'lime', 'orange', 'apple', 'banana', 'mango', 'pineapple', 'coconut',
  // Grains & Starches
  'rice', 'noodle', 'noodles', 'pasta', 'bread', 'flour', 'oats', 'quinoa',
  // Sauces & Seasonings
  'soy sauce', 'oyster sauce', 'fish sauce', 'hoisin', 'sesame oil', 'vinegar',
  'oil', 'olive oil', 'vegetable oil', 'coconut oil', 'butter', 'margarine',
  'salt', 'pepper', 'sugar', 'honey', 'syrup', 'ketchup', 'mayo', 'mayonnaise',
  'mustard', 'hot sauce', 'sriracha', 'chili oil', 'chilli oil',
  // Herbs & Spices
  'basil', 'cilantro', 'coriander', 'parsley', 'mint', 'thyme', 'rosemary', 'oregano',
  'cumin', 'paprika', 'turmeric', 'cinnamon', 'nutmeg', 'clove', 'bay leaf',
  'five spice', 'curry powder', 'garam masala', 'chili powder', 'cayenne',
  // Dairy
  'milk', 'cream', 'cheese', 'yogurt', 'yoghurt', 'sour cream',
  // Asian Ingredients
  'miso', 'dashi', 'sake', 'mirin', 'wasabi', 'nori', 'seaweed',
  'tamarind', 'lemongrass', 'galangal', 'kaffir lime', 'palm sugar',
  'sambal', 'belacan', 'shrimp paste',
  // Misc
  'stock', 'broth', 'water', 'wine', 'beer'
]

// Number words
const NUMBER_WORDS: Record<string, number> = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'half': 0.5, 'quarter': 0.25, 'a': 1, 'an': 1,
  'couple': 2, 'few': 3, 'several': 4, 'some': 2
}

/**
 * Parse a quantity string into a number
 */
function parseQuantity(quantityStr: string): string {
  const cleaned = quantityStr.toLowerCase().trim()

  // Handle number words
  if (NUMBER_WORDS[cleaned] !== undefined) {
    return NUMBER_WORDS[cleaned].toString()
  }

  // Handle fractions like "1/2", "3/4"
  const fractionMatch = cleaned.match(/(\d+)\/(\d+)/)
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1])
    const denom = parseInt(fractionMatch[2])
    return (num / denom).toString()
  }

  // Handle mixed numbers like "1 1/2"
  const mixedMatch = cleaned.match(/(\d+)\s+(\d+)\/(\d+)/)
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1])
    const num = parseInt(mixedMatch[2])
    const denom = parseInt(mixedMatch[3])
    return (whole + num / denom).toString()
  }

  // Return as-is if it's a number
  if (/^\d+\.?\d*$/.test(cleaned)) {
    return cleaned
  }

  return quantityStr
}

/**
 * Extract ingredients from transcript text
 */
export function extractIngredientsFromText(text: string): ExtractedIngredient[] {
  const ingredients: ExtractedIngredient[] = []
  const normalizedText = text.toLowerCase()

  // Build regex pattern for units
  const unitPattern = UNITS.join('|')

  // Pattern 1: [quantity] [unit] of [ingredient]
  // e.g., "two tablespoons of soy sauce", "1 cup of rice"
  const pattern1 = new RegExp(
    `(\\d+(?:\\/\\d+)?|\\d+\\s+\\d+\\/\\d+|one|two|three|four|five|six|seven|eight|nine|ten|half|quarter|a|an|couple|few|several|some)\\s*(${unitPattern})s?\\s+(?:of\\s+)?([\\w\\s]+?)(?=\\.|,|\\band\\b|\\bthen\\b|$)`,
    'gi'
  )

  let match
  while ((match = pattern1.exec(normalizedText)) !== null) {
    const quantity = parseQuantity(match[1])
    const unit = match[2].toLowerCase()
    const name = match[3].trim()

    // Validate it's likely a food item
    if (isLikelyIngredient(name)) {
      ingredients.push({
        name: cleanIngredientName(name),
        quantity,
        unit: normalizeUnit(unit),
        raw: match[0],
        confidence: 0.8,
        source: 'transcript'
      })
    }
  }

  // Pattern 2: [quantity] [ingredient] (no unit)
  // e.g., "two eggs", "three carrots"
  const pattern2 = new RegExp(
    `(\\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|an|couple|few|several|some)\\s+(${COMMON_INGREDIENTS.join('|')})s?(?=\\.|,|\\band\\b|\\s|$)`,
    'gi'
  )

  while ((match = pattern2.exec(normalizedText)) !== null) {
    const quantity = parseQuantity(match[1])
    const name = match[2].toLowerCase()

    // Avoid duplicates
    if (!ingredients.some(i => i.name === name)) {
      ingredients.push({
        name: cleanIngredientName(name),
        quantity,
        raw: match[0],
        confidence: 0.85,
        source: 'transcript'
      })
    }
  }

  // Pattern 3: Direct ingredient mentions without quantity
  // e.g., "add the garlic", "with some ginger"
  for (const ingredient of COMMON_INGREDIENTS) {
    const regex = new RegExp(`\\b${ingredient}s?\\b`, 'gi')
    if (regex.test(normalizedText)) {
      if (!ingredients.some(i => i.name.includes(ingredient))) {
        ingredients.push({
          name: cleanIngredientName(ingredient),
          raw: ingredient,
          confidence: 0.6,
          source: 'transcript'
        })
      }
    }
  }

  return deduplicateIngredients(ingredients)
}

/**
 * Check if a word is likely an ingredient
 */
function isLikelyIngredient(word: string): boolean {
  const cleaned = word.toLowerCase().trim()

  // Check against known ingredients
  for (const ingredient of COMMON_INGREDIENTS) {
    if (cleaned.includes(ingredient)) return true
  }

  // Heuristics: food words often end in certain suffixes
  const foodSuffixes = ['sauce', 'oil', 'powder', 'paste', 'juice', 'leaf', 'leaves', 'seed', 'seeds']
  for (const suffix of foodSuffixes) {
    if (cleaned.endsWith(suffix)) return true
  }

  // Exclude common non-food words that might match patterns
  const excludeWords = [
    'minute', 'minutes', 'second', 'seconds', 'hour', 'hours',
    'heat', 'temperature', 'degree', 'degrees',
    'pan', 'pot', 'bowl', 'plate', 'wok', 'oven', 'stove',
    'knife', 'spoon', 'fork', 'spatula',
    'time', 'step', 'way', 'thing', 'side', 'part'
  ]

  for (const exclude of excludeWords) {
    if (cleaned === exclude || cleaned.endsWith(` ${exclude}`)) return false
  }

  return false
}

/**
 * Clean up ingredient name
 */
function cleanIngredientName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(the|some|fresh|dried|chopped|minced|sliced|diced|ground)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Normalize unit to standard form
 */
function normalizeUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    'c': 'cup',
    'tbsp': 'tablespoon', 'tbs': 'tablespoon', 'tb': 'tablespoon',
    'tsp': 'teaspoon', 'ts': 'teaspoon',
    'oz': 'ounce',
    'lb': 'pound', 'lbs': 'pound',
    'g': 'gram',
    'kg': 'kilogram',
    'ml': 'milliliter',
    'l': 'liter',
    'pkg': 'package'
  }

  const cleaned = unit.toLowerCase().replace(/s$/, '')
  return unitMap[cleaned] || cleaned
}

/**
 * Deduplicate ingredients, keeping the one with highest confidence
 */
function deduplicateIngredients(ingredients: ExtractedIngredient[]): ExtractedIngredient[] {
  const seen = new Map<string, ExtractedIngredient>()

  for (const ingredient of ingredients) {
    const key = ingredient.name.toLowerCase()
    const existing = seen.get(key)

    if (!existing || ingredient.confidence > existing.confidence) {
      // Merge quantity info if available
      if (existing?.quantity && !ingredient.quantity) {
        ingredient.quantity = existing.quantity
        ingredient.unit = existing.unit
      }
      seen.set(key, ingredient)
    }
  }

  return Array.from(seen.values())
}

/**
 * Extract ingredients with timestamps from segmented transcript
 */
export function extractIngredientsFromSegments(
  segments: TranscriptSegment[]
): Array<ExtractedIngredient & { timestamp: number }> {
  const results: Array<ExtractedIngredient & { timestamp: number }> = []

  for (const segment of segments) {
    const ingredients = extractIngredientsFromText(segment.text)
    for (const ingredient of ingredients) {
      results.push({
        ...ingredient,
        timestamp: segment.startTime
      })
    }
  }

  // Deduplicate across segments
  const seen = new Map<string, ExtractedIngredient & { timestamp: number }>()
  for (const item of results) {
    const key = item.name.toLowerCase()
    if (!seen.has(key) || item.confidence > seen.get(key)!.confidence) {
      seen.set(key, item)
    }
  }

  return Array.from(seen.values())
}

/**
 * Format ingredient for display
 */
export function formatIngredient(ingredient: ExtractedIngredient): string {
  const parts: string[] = []

  if (ingredient.quantity) {
    parts.push(ingredient.quantity)
  }

  if (ingredient.unit) {
    parts.push(ingredient.unit + (parseFloat(ingredient.quantity || '1') > 1 ? 's' : ''))
  }

  parts.push(ingredient.name)

  return parts.join(' ')
}
