import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/recipes - Fetch all recipes
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : null
    const search = searchParams.get('search')

    let query = supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    if (limit) {
      query = query.limit(limit)
    }

    const { data: recipes, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch recipes', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ recipes: recipes || [] })
  } catch (error) {
    console.error('Error fetching recipes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/recipes - Create a new recipe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      ingredients,
      steps,
      timing,
      techniques,
      transcript
    } = body

    // Validate required fields
    if (!title || !ingredients || !steps) {
      return NextResponse.json(
        { error: 'Missing required fields: title, ingredients, steps' },
        { status: 400 }
      )
    }

    const { data: recipe, error } = await supabase
      .from('recipes')
      .insert({
        title,
        ingredients,
        steps,
        timing,
        techniques,
        transcript
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to create recipe', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ recipe }, { status: 201 })
  } catch (error) {
    console.error('Error creating recipe:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
