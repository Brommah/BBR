"use client"

import { useEffect, useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { 
    FileText, 
    MessageSquare, 
    Save, 
    Search, 
    Home, 
    Inbox, 
    Settings,
    Keyboard,
    ArrowRight,
    Clock,
    User,
    Archive,
    CheckCircle,
    X
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Shortcut {
    key: string
    description: string
    icon: React.ReactNode
    action: () => void
    category: string
}

export function KeyboardShortcuts() {
    const [isOpen, setIsOpen] = useState(false)
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
    const router = useRouter()

    const shortcuts: Shortcut[] = [
        // Navigation
        { key: "g h", description: "Ga naar Dashboard", icon: <Home className="w-4 h-4" />, action: () => router.push("/"), category: "Navigatie" },
        { key: "g p", description: "Ga naar Pipeline", icon: <Inbox className="w-4 h-4" />, action: () => router.push("/pipeline"), category: "Navigatie" },
        { key: "g a", description: "Ga naar Admin", icon: <Settings className="w-4 h-4" />, action: () => router.push("/admin"), category: "Navigatie" },
        
        // Actions
        { key: "q", description: "Quick Quote genereren", icon: <FileText className="w-4 h-4" />, action: () => toast.info("Quick Quote - Selecteer eerst een lead"), category: "Acties" },
        { key: "n", description: "Nieuwe notitie", icon: <MessageSquare className="w-4 h-4" />, action: () => toast.info("Focus op notitie veld"), category: "Acties" },
        { key: "s", description: "Opslaan", icon: <Save className="w-4 h-4" />, action: () => toast.success("Wijzigingen opgeslagen"), category: "Acties" },
        { key: "a", description: "Toewijzen aan engineer", icon: <User className="w-4 h-4" />, action: () => toast.info("Selecteer engineer..."), category: "Acties" },
        
        // Lead Actions
        { key: "w", description: "Markeer als Gewonnen", icon: <CheckCircle className="w-4 h-4" />, action: () => toast.success("Lead gemarkeerd als Gewonnen"), category: "Lead Acties" },
        { key: "l", description: "Markeer als Verloren", icon: <X className="w-4 h-4" />, action: () => toast.info("Lead gemarkeerd als Verloren"), category: "Lead Acties" },
        { key: "e", description: "Archiveren", icon: <Archive className="w-4 h-4" />, action: () => toast.info("Lead gearchiveerd"), category: "Lead Acties" },
        
        // Other
        { key: "?", description: "Toon sneltoetsen", icon: <Keyboard className="w-4 h-4" />, action: () => setShowShortcutsHelp(true), category: "Overig" },
    ]

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Command/Ctrl + K for command palette
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
            e.preventDefault()
            setIsOpen(prev => !prev)
            return
        }

        // ? for shortcuts help
        if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
            e.preventDefault()
            setShowShortcutsHelp(true)
            return
        }

        // Don't trigger shortcuts when typing in inputs
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return
        }

        // Single key shortcuts
        const singleKeyShortcuts: Record<string, () => void> = {
            "q": () => toast.info("Quick Quote - Selecteer eerst een lead"),
            "n": () => toast.info("Nieuwe notitie - Open eerst een lead"),
            "w": () => toast.success("Lead gemarkeerd als Gewonnen"),
            "e": () => toast.info("Lead gearchiveerd"),
        }

        if (singleKeyShortcuts[e.key]) {
            e.preventDefault()
            singleKeyShortcuts[e.key]()
        }
    }, [])

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [handleKeyDown])

    const commandItems = [
        { id: "dashboard", label: "Ga naar Dashboard", icon: <Home className="w-4 h-4" />, action: () => { router.push("/"); setIsOpen(false) } },
        { id: "pipeline", label: "Ga naar Pipeline", icon: <Inbox className="w-4 h-4" />, action: () => { router.push("/pipeline"); setIsOpen(false) } },
        { id: "admin", label: "Ga naar Admin", icon: <Settings className="w-4 h-4" />, action: () => { router.push("/admin"); setIsOpen(false) } },
        { id: "quote", label: "Nieuwe Offerte", icon: <FileText className="w-4 h-4" />, action: () => { toast.info("Selecteer eerst een lead"); setIsOpen(false) } },
        { id: "shortcuts", label: "Toon Sneltoetsen", icon: <Keyboard className="w-4 h-4" />, action: () => { setShowShortcutsHelp(true); setIsOpen(false) } },
    ]

    const shortcutCategories = [...new Set(shortcuts.map(s => s.category))]

    return (
        <>
            {/* Command Palette */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="p-0 max-w-lg overflow-hidden">
                    <Command className="rounded-lg border-none">
                        <CommandInput placeholder="Zoek commando's..." />
                        <CommandList>
                            <CommandEmpty>Geen resultaten gevonden.</CommandEmpty>
                            <CommandGroup heading="Navigatie">
                                {commandItems.slice(0, 3).map((item) => (
                                    <CommandItem key={item.id} onSelect={item.action} className="cursor-pointer">
                                        {item.icon}
                                        <span className="ml-2">{item.label}</span>
                                        <ArrowRight className="ml-auto w-3 h-3 opacity-50" />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            <CommandSeparator />
                            <CommandGroup heading="Acties">
                                {commandItems.slice(3).map((item) => (
                                    <CommandItem key={item.id} onSelect={item.action} className="cursor-pointer">
                                        {item.icon}
                                        <span className="ml-2">{item.label}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                        <div className="border-t p-2 flex items-center justify-between text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900">
                            <span>Druk op <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border text-[10px] font-mono">?</kbd> voor alle sneltoetsen</span>
                            <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border text-[10px] font-mono">ESC</kbd> om te sluiten</span>
                        </div>
                    </Command>
                </DialogContent>
            </Dialog>

            {/* Shortcuts Help Dialog */}
            <Dialog open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Keyboard className="w-5 h-5" />
                            Sneltoetsen
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {/* Command Palette Shortcut */}
                        <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Search className="w-4 h-4" />
                                <span className="font-medium">Command Palette</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <kbd className="px-2 py-1 bg-white dark:bg-slate-900 rounded border text-xs font-mono">⌘</kbd>
                                <span className="text-muted-foreground">+</span>
                                <kbd className="px-2 py-1 bg-white dark:bg-slate-900 rounded border text-xs font-mono">K</kbd>
                            </div>
                        </div>

                        {/* Shortcuts by Category */}
                        {shortcutCategories.map((category) => (
                            <div key={category} className="space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{category}</h4>
                                <div className="space-y-1">
                                    {shortcuts
                                        .filter(s => s.category === category)
                                        .map((shortcut, i) => (
                                            <div key={i} className="flex items-center justify-between py-2 px-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    {shortcut.icon}
                                                    <span className="text-sm">{shortcut.description}</span>
                                                </div>
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {shortcut.key}
                                                </Badge>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ))}

                        <div className="pt-2 border-t text-xs text-muted-foreground text-center">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Tip: Gebruik <kbd className="px-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px]">j</kbd> en <kbd className="px-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px]">k</kbd> om door leads te navigeren
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
