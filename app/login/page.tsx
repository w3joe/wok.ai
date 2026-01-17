import { AuthForm } from '@/components/auth/AuthForm'
import { ChefHat } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <Link href="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
                <ChefHat className="h-10 w-10 text-primary" />
                <span className="text-3xl font-bold">Wok.AI</span>
            </Link>

            <AuthForm />
        </div>
    )
}
