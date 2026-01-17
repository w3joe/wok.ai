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
        <header className="border-b bg-background sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2 text-xl font-semibold hover:opacity-80 transition-opacity">
                        <div className="bg-primary p-1.5 rounded-lg">
                            <ChefHat className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span>Wok.AI</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1">
                        <Link href="/recipes">
                            <Button variant="ghost" size="sm">Library</Button>
                        </Link>
                        <Link href="/record">
                            <Button variant="ghost" size="sm">Record Audio</Button>
                        </Link>
                        <Link href="/record-video">
                            <Button variant="ghost" size="sm">Capture Video</Button>
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-2">
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
                                            {user.email?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-52" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">My Account</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex gap-2">
                            <Link href="/login">
                                <Button variant="ghost" size="sm">Log In</Button>
                            </Link>
                            <Link href="/login">
                                <Button size="sm">Sign Up</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
