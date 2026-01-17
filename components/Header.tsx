'use client'

import Link from 'next/link'
import { ChefHat, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function Header() {
    const { user, signOut } = useAuth()

    return (
        <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2 text-2xl font-black hover:opacity-90 transition-all hover:scale-105 active:scale-95">
                        <div className="bg-primary p-1.5 rounded-xl shadow-lg shadow-primary/20">
                            <ChefHat className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <span className="tracking-tighter bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Wok.AI</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1">
                        <Link href="/recipes">
                            <Button variant="ghost" className="rounded-full px-4 hover:bg-primary/5 font-medium">Library</Button>
                        </Link>
                        <Link href="/record">
                            <Button variant="ghost" className="rounded-full px-4 hover:bg-primary/5 font-medium">Record Audio</Button>
                        </Link>
                        <Link href="/record-video">
                            <Button variant="ghost" className="rounded-full px-4 hover:bg-primary/5 font-medium">Capture Video</Button>
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden hover:ring-2 ring-primary/20 transition-all flex-shrink-0">
                                    <Avatar className="h-10 w-10 border border-border">
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                                            {user.email?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 rounded-2xl p-2" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal p-2">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-semibold leading-none">My Account</p>
                                        <p className="text-xs leading-none text-muted-foreground truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="my-1" />
                                <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer rounded-xl p-2 transition-colors">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span className="font-medium">Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex gap-2">
                            <Link href="/login">
                                <Button variant="ghost" className="rounded-full px-6 font-semibold">Log In</Button>
                            </Link>
                            <Link href="/login">
                                <Button className="rounded-full px-6 font-semibold shadow-lg shadow-primary/20">Sign Up</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
