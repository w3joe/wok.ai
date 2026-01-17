'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    ChefHat,
    Clock,
    Loader2,
    Search,
    Mic,
    MicOff,
    Filter,
    ArrowUpDown,
    Sparkles,
    Utensils,
    Flame
} from 'lucide-react'
import { Header } from '@/components/Header'
import { RecipeCardSkeleton } from '@/components/RecipeCardSkeleton'

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
    difficulty?: 'easy' | 'medium' | 'hard'
    cuisine_type?: string
    created_at: string
}



export default function RecipesPage() {
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isListening, setIsListening] = useState(false)
    const [sortBy, setSortBy] = useState<'newest' | 'alphabetical' | 'time'>('newest')

    const recognitionRef = useRef<any>(null)

    const fetchRecipes = useCallback(async () => {
        try {
            setIsLoading(true)
            const params = new URLSearchParams()
            if (searchQuery) params.append('search', searchQuery)

            const response = await fetch(`/api/recipes?${params.toString()}`)
            if (!response.ok) throw new Error('Failed to fetch recipes')
            const data = await response.json()

            let filtered = data.recipes || []

            // Client-side sorting
            filtered.sort((a: Recipe, b: Recipe) => {
                if (sortBy === 'newest') {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                } else if (sortBy === 'alphabetical') {
                    return a.title.localeCompare(b.title)
                } else if (sortBy === 'time') {
                    const timeA = a.timing?.total || (a.timing?.prep || 0) + (a.timing?.cook || 0) || 0
                    const timeB = b.timing?.total || (b.timing?.prep || 0) + (b.timing?.cook || 0) || 0
                    return timeA - timeB
                }
                return 0
            })

            setRecipes(filtered)
        } catch (error) {
            console.error('Error fetching recipes:', error)
        } finally {
            setIsLoading(false)
        }
    }, [searchQuery, sortBy])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchRecipes()
        }, 300)

        return () => clearTimeout(timer)
    }, [fetchRecipes])

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Speech recognition is not supported in this browser.')
            return
        }

        const SpeechRecognition = (window as any).webkitSpeechRecognition
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onstart = () => setIsListening(true)
        recognitionRef.current.onend = () => setIsListening(false)
        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript
            setSearchQuery(transcript)
        }

        recognitionRef.current.start()
    }

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
        }
    }

    const toggleListening = () => {
        if (isListening) stopListening()
        else startListening()
    }

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-background">
            <Header />

            {/* Hero Section */}
            <div className="bg-white dark:bg-card border-b relative overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl opacity-50" />
                <div className="container mx-auto px-4 py-20 text-center relative">
                    <Badge variant="outline" className="mb-6 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary border-primary/20 bg-primary/5 shadow-sm">
                        <Sparkles className="mr-2 h-3.5 w-3.5" />
                        Culinary Archive
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-8 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent leading-tight">
                        Discover & Create
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12 italic leading-relaxed">
                        Search through your voice-recorded recipes or find inspiration for your next masterpiece.
                    </p>

                    <div className="max-w-2xl mx-auto relative group">
                        <div className="absolute -inset-1.5 bg-gradient-to-r from-primary/30 to-primary/10 rounded-[2rem] blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200"></div>
                        <div className="relative flex items-center bg-white dark:bg-background border-2 shadow-xl rounded-[1.5rem] p-2 focus-within:ring-4 ring-primary/10 transition-all">
                            <Search className="ml-4 h-6 w-6 text-muted-foreground" />
                            <Input
                                placeholder="Search recipes by name, ingredients, or techniques..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="border-0 focus-visible:ring-0 text-lg py-7 h-14 bg-transparent font-medium"
                            />
                            <Button
                                size="icon"
                                variant={isListening ? "destructive" : "secondary"}
                                className={`rounded-xl h-12 w-12 transition-all shadow-sm ${isListening ? 'animate-pulse scale-110' : 'hover:scale-105'}`}
                                onClick={toggleListening}
                            >
                                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-16">
                <div className="max-w-6xl mx-auto">
                    {/* Sorting */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16 border-b pb-8">
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl font-black">
                                {searchQuery ? `Results for "${searchQuery}"` : 'All Recipes'}
                            </h2>
                            <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-none font-bold">
                                {recipes.length}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-4 bg-white dark:bg-card px-6 py-2.5 rounded-2xl border shadow-sm">
                            <span className="text-xs font-black text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
                                <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
                                Sort By
                            </span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-transparent text-sm border-none focus:ring-0 cursor-pointer font-bold text-foreground uppercase tracking-wider"
                            >
                                <option value="newest">Newest First</option>
                                <option value="alphabetical">Title A-Z</option>
                                <option value="time">Cooking Time</option>
                            </select>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <RecipeCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : recipes.length === 0 ? (
                        <div className="text-center py-32 border-2 border-dashed rounded-[3rem] bg-white dark:bg-card shadow-inner">
                            <div className="h-24 w-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                                <Utensils className="h-12 w-12 text-primary/40" />
                            </div>
                            <h3 className="text-2xl font-black mb-3">No recipes found</h3>
                            <p className="text-muted-foreground mb-12 max-w-sm mx-auto italic leading-relaxed">
                                We couldn't find any recipes matching your criteria. Try adjusting your search query.
                            </p>
                            <Link href="/record">
                                <Button size="lg" className="rounded-2xl h-14 px-10 text-lg font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                                    <Mic className="mr-3 h-5 w-5" />
                                    Record New Recipe
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {recipes.map((recipe) => (
                                <Link key={recipe.id} href={`/cook/${recipe.id}`}>
                                    <Card className="group h-full overflow-hidden border-border/50 hover:border-primary/50 hover:shadow-2xl transition-all duration-500 cursor-pointer rounded-[2rem] bg-white dark:bg-card">
                                        <CardHeader className="p-0">
                                            <div className="h-52 w-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative overflow-hidden">
                                                <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-1000">
                                                    <ChefHat className="h-28 w-28 text-primary" />
                                                </div>
                                                {recipe.difficulty && (
                                                    <Badge className="absolute top-6 right-6 bg-white/95 dark:bg-black/80 backdrop-blur-md text-foreground border-none shadow-lg font-black uppercase text-[10px] tracking-widest px-3 py-1 scale-100 group-hover:scale-110 transition-transform">
                                                        {recipe.difficulty}
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-8">
                                            <CardTitle className="text-2xl font-black mb-4 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                                                {recipe.title}
                                            </CardTitle>

                                            <div className="flex items-center gap-5 text-sm font-bold text-muted-foreground mb-8">
                                                <div className="flex items-center gap-2 group/icon">
                                                    <div className="p-1.5 rounded-lg bg-primary/5 text-primary group-hover/icon:bg-primary group-hover/icon:text-white transition-colors">
                                                        <Clock className="h-4 w-4" />
                                                    </div>
                                                    {recipe.timing?.total || (recipe.timing?.prep || 0) + (recipe.timing?.cook || 0) || 15} min
                                                </div>
                                                <div className="flex items-center gap-2 group/icon">
                                                    <div className="p-1.5 rounded-lg bg-primary/5 text-primary group-hover/icon:bg-primary group-hover/icon:text-white transition-colors">
                                                        <Flame className="h-4 w-4" />
                                                    </div>
                                                    {recipe.steps.length} steps
                                                </div>
                                            </div>

                                            {recipe.techniques && recipe.techniques.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-6 border-t border-border/50">
                                                    {recipe.techniques.slice(0, 3).map((technique, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-[9px] uppercase tracking-[0.1em] bg-primary/5 text-primary border-none font-black px-2.5 py-1">
                                                            {technique}
                                                        </Badge>
                                                    ))}
                                                    {recipe.techniques.length > 3 && (
                                                        <span className="text-[10px] text-muted-foreground font-black bg-muted px-2 py-0.5 rounded-md">
                                                            +{recipe.techniques.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
