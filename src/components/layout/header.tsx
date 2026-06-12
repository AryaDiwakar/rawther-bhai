"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { signOut, useSession } from "next-auth/react"
import { format } from "date-fns"
import { Sun, Moon, Bell, Menu, Search, Command, LogOut, User, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"

interface HeaderProps {
  onMenuClick?: () => void
  sidebarCollapsed: boolean
  onSidebarToggle: () => void
  onCommandPaletteOpen?: () => void
}

export function Header({
  sidebarCollapsed,
  onSidebarToggle,
}: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "RB"

  const userName = session?.user?.name ?? "Admin"
  const userEmail = session?.user?.email ?? "admin@rawther.com"

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex items-center gap-2 lg:hidden">
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetTrigger className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0" showCloseButton={false}>
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <Sidebar
              collapsed={false}
              onToggle={() => setMobileSidebarOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden items-center gap-2 lg:flex">
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          onClick={onSidebarToggle}
        >
          <Menu className="size-4" />
        </Button>
      </div>

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:gap-4">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 size-3.5 text-muted-foreground" />
          <button
            onClick={() => {
              const event = new KeyboardEvent("keydown", {
                key: "k",
                metaKey: true,
                bubbles: true,
              })
              document.dispatchEvent(event)
            }}
            className="flex h-8 w-64 items-center gap-2 rounded-lg border bg-muted/50 px-3 text-xs text-muted-foreground transition-colors hover:bg-muted"
          >
            Search pages...
            <kbd className="ml-auto flex items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/70">
              <Command className="size-2.5" />
              K
            </kbd>
          </button>
        </div>
      </div>

      <div className="hidden text-xs text-muted-foreground sm:block">
        {format(currentTime, "EEE, MMM d • h:mm a")}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative text-muted-foreground"
        >
          <Bell className="size-4" />
          <Badge
            variant="destructive"
            className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full p-0 text-[8px]"
          >
            3
          </Badge>
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-sm transition-colors hover:bg-muted/50">
          <Avatar size="sm">
            <AvatarFallback className="text-[10px]">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left md:block">
            <p className="text-xs font-medium leading-tight">{userName}</p>
            <p className="text-[10px] leading-tight text-muted-foreground">
              {userEmail}
            </p>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col">
              <span className="text-sm font-medium">{userName}</span>
              <span className="text-xs text-muted-foreground">{userEmail}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => {}}>
              <User className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => {}}>
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="size-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
