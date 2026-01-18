'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { RecipeEditor } from '@/components/RecipeEditor'
import { Header } from '@/components/Header'
import { Loader2 } from 'lucide-react'

export default function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const [recipe, setRecipe] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchRecipe()
    }, [resolvedParams.id])

    const fetchRecipe = async () => {
        try {
            const response = await fetch(`/api/recipes/${resolvedParams.id}`)
            if (!response.ok) throw new Error('Failed to fetch recipe')
            const data = await response.json()
            setRecipe(data.recipe)
        } catch (error) {
            console.error('Error fetching recipe:', error)
            alert('Failed to load recipe')
            router.back()
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async (updatedRecipe: any) => {
        try {
            const response = await fetch(`/api/recipes/${resolvedParams.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedRecipe),
            })

            if (!response.ok) throw new Error('Failed to update recipe')

            // Navigate back to the cook page after successful update
            router.push(`/cook/${resolvedParams.id}`)
            router.refresh()
        } catch (error) {
            console.error('Error updating recipe:', error)
            alert('Failed to update recipe. Please try again.')
        }
    }

    const handleCancel = () => {
        router.back()
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#fafafa] dark:bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">Loading editor...</p>
                </div>
            </div>
        )
    }

    if (!recipe) return null

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-black mb-8 text-center">Edit Recipe</h1>
                <RecipeEditor
                    initialRecipe={recipe}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            </main>
        </div>
    )
}
