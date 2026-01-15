"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface User {
  id: string
  name: string
  role: string
  avatar?: string
}

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  users: User[]
  placeholder?: string
  disabled?: boolean
  className?: string
  onKeyDown?: (e: React.KeyboardEvent) => void
}

/**
 * Textarea with @mention autocomplete functionality
 */
export function MentionInput({
  value,
  onChange,
  users,
  placeholder,
  disabled,
  className,
  onKeyDown,
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionFilter, setSuggestionFilter] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Filter users based on current input after @
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(suggestionFilter.toLowerCase())
  )

  // Find the @ position for current mention
  const findMentionStart = useCallback((text: string, cursorPos: number): number => {
    let i = cursorPos - 1
    while (i >= 0) {
      if (text[i] === '@') return i
      if (text[i] === ' ' || text[i] === '\n') return -1
      i--
    }
    return -1
  }, [])

  // Handle text changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart
    setCursorPosition(cursorPos)
    onChange(newValue)

    // Check if we should show suggestions
    const mentionStart = findMentionStart(newValue, cursorPos)
    if (mentionStart >= 0) {
      const filter = newValue.substring(mentionStart + 1, cursorPos)
      setSuggestionFilter(filter)
      setShowSuggestions(true)
      setSelectedIndex(0)
    } else {
      setShowSuggestions(false)
    }
  }

  // Insert mention into text
  const insertMention = useCallback((user: User) => {
    const mentionStart = findMentionStart(value, cursorPosition)
    if (mentionStart >= 0) {
      const before = value.substring(0, mentionStart)
      const after = value.substring(cursorPosition)
      const newValue = `${before}@${user.name} ${after}`
      onChange(newValue)
      
      // Move cursor after mention
      const newCursorPos = mentionStart + user.name.length + 2
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = newCursorPos
          textareaRef.current.selectionEnd = newCursorPos
          textareaRef.current.focus()
        }
      }, 0)
    }
    setShowSuggestions(false)
  }, [value, cursorPosition, findMentionStart, onChange])

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredUsers.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        return
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        insertMention(filteredUsers[selectedIndex])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowSuggestions(false)
        return
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        insertMention(filteredUsers[selectedIndex])
        return
      }
    }
    
    // Pass through to parent handler
    onKeyDown?.(e)
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
      
      {/* Suggestions Dropdown */}
      {showSuggestions && filteredUsers.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute bottom-full left-0 mb-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden"
        >
          <div className="p-2 border-b border-slate-200 dark:border-slate-700">
            <p className="text-xs text-muted-foreground font-medium">
              Vermeld een teamlid
            </p>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredUsers.map((user, index) => (
              <button
                key={user.id}
                type="button"
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                  index === selectedIndex
                    ? "bg-amber-100 dark:bg-amber-900/30"
                    : "hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
                onClick={() => insertMention(user)}
              >
                <Avatar className="w-8 h-8">
                  {user.avatar && (
                    <AvatarImage src={user.avatar} alt={user.name} />
                  )}
                  <AvatarFallback className={cn(
                    "text-white text-sm font-bold",
                    user.role === 'admin' ? "bg-amber-500" : 
                    user.role === 'projectleider' ? "bg-purple-500" :
                    "bg-blue-500"
                  )}>
                    {user.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user.role === 'admin' ? 'Admin' : user.role === 'projectleider' ? 'Projectleider' : 'Engineer'}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <p className="text-xs text-muted-foreground">
              ↑↓ navigeren • Enter selecteren • Esc sluiten
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Renders text with highlighted @mentions
 */
export function MentionText({ text, className }: { text: string; className?: string }) {
  // Parse mentions in text (format: @Name)
  const parts = text.split(/(@\w+(?:\s\w+)?)/g)
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('@')) {
          return (
            <span
              key={index}
              className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1 rounded font-medium"
            >
              {part}
            </span>
          )
        }
        return part
      })}
    </span>
  )
}

/**
 * Extract mentioned usernames from text
 * Supports multi-word names (up to 4 words) and Unicode characters
 */
export function extractMentions(text: string): string[] {
  // Match @ followed by 1-4 words (supporting Unicode letters)
  // This handles names like "Jan de Vries" or "Maria van der Berg"
  const mentionRegex = /@([\p{L}\p{N}]+(?:\s[\p{L}\p{N}]+){0,3})/gu
  const mentions: string[] = []
  let match
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1].trim())
  }
  
  return mentions
}
