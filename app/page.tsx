'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChefHat,
  Mic,
  BookOpen,
  Clock,
  ArrowRight,
  Video
} from 'lucide-react'
import { Header } from '@/components/Header'

interface Recipe {
  id: string
  title: string
  ingredients: string[]
  steps: string[]
  timing?: {
    prep?: number
    cook?: number
    total?: number
  }
  techniques?: string[]
  created_at: string
}

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRecipes()
  }, [])

  const fetchRecipes = async () => {
    try {
      const response = await fetch('/api/recipes?limit=3')
      if (!response.ok) throw new Error('Failed to fetch recipes')
      const data = await response.json()
      setRecipes(data.recipes || [])
    } catch (error) {
      console.error('Error fetching recipes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="border-b py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                Cook with your voice, not your hands
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Transform spoken recipes into structured guides. Record, organize, and cook with hands-free voice assistance.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/record">
                  <Button size="lg">
                    <Mic className="mr-2 h-4 w-4" />
                    Start Recording
                  </Button>
                </Link>
                <Link href="/recipes">
                  <Button size="lg" variant="outline">
                    View Library
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-20">
              <Card>
                <CardHeader className="text-center pb-2">
                  <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Mic className="h-6 w-6 text-foreground" />
                  </div>
                  <CardTitle className="text-lg">Voice Capture</CardTitle>
                  <CardDescription>
                    Narrate your cooking live. AI extracts ingredients and steps in real-time.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <Link href="/record">
                    <Button variant="secondary" className="w-full">
                      Try Voice
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-primary">
                <CardHeader className="text-center pb-2">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Video className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Video Intel</CardTitle>
                  <CardDescription>
                    Record video and let AI capture key moments automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <Link href="/record-video">
                    <Button className="w-full">
                      Capture Video
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center pb-2">
                  <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-6 w-6 text-foreground" />
                  </div>
                  <CardTitle className="text-lg">Smart Library</CardTitle>
                  <CardDescription>
                    Organize your recipes and access voice guidance while cooking.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <Link href="/recipes">
                    <Button variant="outline" className="w-full">
                      Browse Recipes
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Recent Recipes Section */}
            <div className="space-y-8">
              <div className="flex items-end justify-between border-b pb-4">
                <div>
                  <h2 className="text-2xl font-semibold mb-1">Recent Recipes</h2>
                  <p className="text-muted-foreground text-sm">Latest additions to your library</p>
                </div>
                <Link href="/recipes">
                  <Button variant="ghost" size="sm" className="text-primary">
                    View all
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {isLoading ? (
                <div className="grid md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-3">
                      <div className="h-40 bg-muted animate-pulse rounded-lg" />
                      <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              ) : recipes.length === 0 ? (
                <div className="border border-dashed rounded-lg py-16 text-center">
                  <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Your library is empty</h3>
                  <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                    Start your collection by recording your first recipe.
                  </p>
                  <Link href="/record">
                    <Button>Record Now</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  {recipes.map((recipe) => (
                    <Link key={recipe.id} href={`/cook/${recipe.id}`}>
                      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                        <div className="h-40 w-full bg-muted flex items-center justify-center">
                          <ChefHat className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg line-clamp-2">
                            {recipe.title}
                          </CardTitle>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {recipe.timing && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {recipe.timing.total || (recipe.timing.prep || 0) + (recipe.timing.cook || 0)} min
                              </span>
                            )}
                            <span>{recipe.steps.length} steps</span>
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold mb-3">
            <div className="bg-primary p-1.5 rounded-lg">
              <ChefHat className="h-5 w-5 text-primary-foreground" />
            </div>
            <span>Wok.AI</span>
          </Link>
          <p className="text-muted-foreground text-sm mb-4">
            Voice-first recipe management for home chefs.
          </p>
          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Wok.AI
          </div>
        </div>
      </footer>
    </div>
  )
}
