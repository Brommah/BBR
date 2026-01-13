"use client"

import { useSyncExternalStore } from "react"
import { WalkthroughOverlay, WalkthroughTrigger } from "./walkthrough-overlay"
import { WelcomeDialog } from "./welcome-dialog"

/**
 * Hook to detect client-side hydration without setState in useEffect
 */
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

/**
 * WalkthroughProvider
 * 
 * Handles the rendering of the walkthrough system.
 * - Shows welcome dialog for new authenticated users
 * - Shows the walkthrough overlay when active
 * - Shows a trigger button after completion/skip
 */
export function WalkthroughProvider() {
  const hydrated = useHydrated()

  // Wait for client-side hydration before rendering
  if (!hydrated) return null

  return (
    <>
      <WelcomeDialog />
      <WalkthroughOverlay />
      <WalkthroughTrigger />
    </>
  )
}
