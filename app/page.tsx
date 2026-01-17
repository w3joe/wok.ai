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
  Loader2,
  Sparkles,
  ArrowRight,
  Play,
  History,
  TrendingUp,
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
    <div className="min-h-screen bg-[#fafafa] dark:bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white dark:bg-card border-b pt-20 pb-24 md:pt-32 md:pb-40">
          {/* Abstract Background Elements */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-30" />

          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm font-semibold text-primary border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Sparkles className="mr-2 h-4 w-4" />
                AI-Powered Culinary Experience
              </Badge>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-1000">
                Cook with Your <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Voice</span>, Not Your Hands.
              </h1>
              <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000">
                Wok.AI transforms your spoken recipes into structured culinary masterpieces. Record, organize, and cook with hands-free guidance.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <Link href="/record">
                  <Button size="lg" className="rounded-full h-14 px-8 text-lg font-bold shadow-xl shadow-primary/25 hover:scale-105 transition-all">
                    <Mic className="mr-2 h-5 w-5" />
                    Start Recording
                  </Button>
                </Link>
                <Link href="/recipes">
                  <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg font-bold bg-white/50 backdrop-blur-sm hover:bg-white transition-all">
                    View Library
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-24">
          <div className="max-w-6xl mx-auto">
            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
              <Card className="group hover:shadow-2xl transition-all duration-500 border-border/50 rounded-3xl overflow-hidden bg-white dark:bg-card">
                <CardHeader className="pb-2 text-center pt-10">
                  <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                    <Mic className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-2xl font-bold mb-2">Voice Capture</CardTitle>
                  <CardDescription className="text-base">
                    Narrate your cooking live. Our AI extracts ingredients and steps in real-time.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-10 pt-4 px-10">
                  <Link href="/record">
                    <Button variant="secondary" className="w-full rounded-2xl font-bold h-12 hover:bg-primary hover:text-primary-foreground transition-colors group-hover:translate-y-[-2px]">
                      Try Voice
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-2xl transition-all duration-500 border-border/50 rounded-3xl overflow-hidden bg-white dark:bg-card relative ring-2 ring-primary/20">
                <div className="absolute top-4 right-4 focus-visible:ring">
                  <Badge className="bg-primary text-primary-foreground">Popular</Badge>
                </div>
                <CardHeader className="pb-2 text-center pt-10">
                  <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                    <Video className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-2xl font-bold mb-2">Video Intel</CardTitle>
                  <CardDescription className="text-base">
                    Record video and let AI snap photos of key moments automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-10 pt-4 px-10">
                  <Link href="/record-video">
                    <Button className="w-full rounded-2xl font-bold h-12 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
                      Capture Video
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-2xl transition-all duration-500 border-border/50 rounded-3xl overflow-hidden bg-white dark:bg-card">
                <CardHeader className="pb-2 text-center pt-10">
                  <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-2xl font-bold mb-2">Smart Library</CardTitle>
                  <CardDescription className="text-base">
                    Organize your culinary journey and access voice guidance while cooking.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-10 pt-4 px-10">
                  <Link href="/recipes">
                    <Button variant="outline" className="w-full rounded-2xl font-bold h-12 border-2 hover:bg-primary/5 transition-colors">
                      Browse Recipes
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Recent Recipes Section */}
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-8">
                <div>
                  <h2 className="text-4xl font-black mb-3">Recently Recorded</h2>
                  <p className="text-muted-foreground text-lg italic">The latest additions to your culinary archive</p>
                </div>
                <Link href="/recipes">
                  <Button variant="link" className="text-primary font-bold text-lg p-0 flex items-center gap-1 group">
                    Explore all recipes
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>

              {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-4">
                      <div className="h-48 bg-muted animate-pulse rounded-2xl" />
                      <div className="h-6 w-3/4 bg-muted animate-pulse rounded-lg" />
                      <div className="h-4 w-1/2 bg-muted animate-pulse rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : recipes.length === 0 ? (
                <div className="bg-white dark:bg-card border-2 border-dashed rounded-[2.5rem] py-24 text-center">
                  <div className="h-24 w-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8">
                    <History className="h-12 w-12 text-primary/40" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Your library is empty</h3>
                  <p className="text-muted-foreground text-lg mb-10 max-w-sm mx-auto">
                    Start your collection by recording your first recipe narrations today.
                  </p>
                  <Link href="/record">
                    <Button size="lg" className="rounded-2xl px-10 h-14 font-black shadow-lg shadow-primary/20">
                      Record Now
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {recipes.map((recipe) => (
                    <Link key={recipe.id} href={`/cook/${recipe.id}`}>
                      <Card className="group h-full overflow-hidden border-border/50 hover:border-primary/50 hover:shadow-2xl transition-all duration-500 cursor-pointer rounded-3xl bg-white dark:bg-card">
                        <div className="h-48 w-full bg-gradient-to-br from-primary/10 via-transparent to-primary/5 relative overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                            <ChefHat className="h-24 w-24 text-primary/20" />
                          </div>
                          <div className="absolute bottom-4 left-4">
                            {recipe.timing && (
                              <Badge className="bg-white/90 dark:bg-black/80 backdrop-blur-sm text-foreground border-none font-bold shadow-sm">
                                <Clock className="mr-1.5 h-3.5 w-3.5 text-primary" />
                                {recipe.timing.total || (recipe.timing.prep || 0) + (recipe.timing.cook || 0)} min
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardHeader className="p-8">
                          <CardTitle className="text-2xl font-black mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                            {recipe.title}
                          </CardTitle>
                          <div className="flex flex-wrap gap-2 mt-4">
                            {recipe.techniques?.slice(0, 2).map((tech, i) => (
                              <Badge key={i} variant="secondary" className="bg-primary/5 text-primary text-[10px] uppercase font-black tracking-widest px-2.5">
                                {tech}
                              </Badge>
                            ))}
                            <span className="text-sm text-muted-foreground font-medium flex-1 text-right italic">
                              {recipe.steps.length} steps
                            </span>
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
      <footer className="border-t bg-white dark:bg-card py-16">
        <div className="container mx-auto px-4 text-center">
          <Link href="/" className="flex items-center justify-center gap-2 text-3xl font-black mb-6">
            <div className="bg-primary p-2 rounded-2xl shadow-lg shadow-primary/20">
              <ChefHat className="h-8 w-8 text-white" />
            </div>
            <span>Wok.AI</span>
          </Link>
          <p className="text-muted-foreground mb-10 max-w-lg mx-auto italic">
            Empowering home chefs with artificial intelligence and voice-first technology.
          </p>
          <div className="text-sm font-medium text-muted-foreground/60 border-t pt-10">
            © {new Date().getFullYear()} Wok.AI — High Orbit Culinary Lab
          </div>
        </div>
      </footer>
    </div>
  )
}
