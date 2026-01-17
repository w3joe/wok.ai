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
    Search,
    Mic,
    MicOff,
    ArrowUpDown
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
        <div className="min-h-screen bg-background">
            <Header />

            {/* Search Section */}
            <div className="border-b">
                <div className="container mx-auto px-4 py-12">
                    <h1 className="text-3xl font-bold mb-2 text-center">Recipe Library</h1>
                    <p className="text-muted-foreground text-center mb-8">
                        Search your voice-recorded recipes
                    </p>

                    <div className="max-w-xl mx-auto">
                        <div className="flex items-center gap-2 border rounded-lg p-2 bg-background">
                            <Search className="ml-2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search recipes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="border-0 focus-visible:ring-0"
                            />
                            <Button
                                size="icon"
                                variant={isListening ? "destructive" : "secondary"}
                                onClick={toggleListening}
                            >
                                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto">
                    {/* Header with count and sort */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-medium">
                                {searchQuery ? `Results for "${searchQuery}"` : 'All Recipes'}
                            </h2>
                            <Badge variant="secondary">{recipes.length}</Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-transparent border-none text-sm cursor-pointer"
                            >
                                <option value="newest">Newest</option>
                                <option value="alphabetical">A-Z</option>
                                <option value="time">Cook Time</option>
                            </select>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <RecipeCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : recipes.length === 0 ? (
                        <div className="text-center py-16 border border-dashed rounded-lg">
                            <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">No recipes found</h3>
                            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                                Try adjusting your search or record a new recipe.
                            </p>
                            <Link href="/record">
                                <Button>
                                    <Mic className="mr-2 h-4 w-4" />
                                    Record Recipe
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recipes.map((recipe) => (
                                <Link key={recipe.id} href={`/cook/${recipe.id}`}>
                                    <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                                        <CardHeader className="p-0">
                                            <div className="h-40 w-full bg-muted flex items-center justify-center">
                                                <ChefHat className="h-16 w-16 text-muted-foreground/30" />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            <CardTitle className="text-lg mb-3 line-clamp-2">
                                                {recipe.title}
                                            </CardTitle>

                                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {recipe.timing?.total || (recipe.timing?.prep || 0) + (recipe.timing?.cook || 0) || 15} min
                                                </span>
                                                <span>{recipe.steps.length} steps</span>
                                            </div>

                                            {recipe.techniques && recipe.techniques.length > 0 && (
                                                <div className="flex flex-wrap gap-1 pt-3 border-t">
                                                    {recipe.techniques.slice(0, 3).map((technique, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-xs">
                                                            {technique}
                                                        </Badge>
                                                    ))}
                                                    {recipe.techniques.length > 3 && (
                                                        <span className="text-xs text-muted-foreground">
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
