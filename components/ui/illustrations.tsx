import React from "react"
import { cn } from "@/lib/utils"

interface IllustrationProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

export function IsoInbox({ className, ...props }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full", className)}
      role="img"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M100 160L40 130V70L100 100L160 70V130L100 160Z"
        fill="var(--primary)"
        fillOpacity="0.1"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M100 100V160M40 130L100 100L160 130"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Stacked papers */}
      <path
        d="M100 90L50 65L110 35L160 60L100 90Z"
        fill="var(--card)"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M100 80L50 55L110 25L160 50L100 80Z"
        fill="var(--card)"
        stroke="var(--muted-foreground)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M110 110L150 90M110 120L140 105"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IsoBlueprint({ className, ...props }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full", className)}
      role="img"
      aria-hidden="true"
      {...props}
    >
      {/* Base platform */}
      <path
        d="M100 170L20 130V90L100 130L180 90V130L100 170Z"
        fill="var(--primary)"
        fillOpacity="0.05"
      />
      <path
        d="M100 130L20 90L100 50L180 90L100 130Z"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4 4"
      />
      {/* Rolled Blueprint */}
      <path
        d="M80 110C80 110 60 100 60 80C60 60 80 50 80 50"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect
        x="70"
        y="60"
        width="60"
        height="80"
        transform="rotate(-45 100 100)"
        fill="var(--card)"
        stroke="var(--primary)"
        strokeWidth="2"
      />
      {/* Decorative lines */}
      <path
        d="M100 50V30M180 90V70M20 90V70"
        stroke="var(--muted-foreground)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IsoTrophy({ className, ...props }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full", className)}
      role="img"
      aria-hidden="true"
      {...props}
    >
      {/* Podium */}
      <path
        d="M100 180L40 150V110L100 140L160 110V150L100 180Z"
        fill="var(--primary)"
        fillOpacity="0.1"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M100 140L40 110L100 80L160 110L100 140Z"
        fill="var(--card)"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Star/Trophy */}
      <path
        d="M100 100L110 80L130 80L115 65L120 45L100 60L80 45L85 65L70 80L90 80L100 100Z"
        fill="var(--accent)"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Glow effect lines */}
      <path
        d="M100 30V40M140 50L130 60M60 50L70 60"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IsoEmpty({ className, ...props }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full", className)}
      role="img"
      aria-hidden="true"
      {...props}
    >
      {/* Box interior */}
      <path
        d="M100 130L40 100V60L100 90L160 60V100L100 130Z"
        fill="var(--muted)"
        fillOpacity="0.3"
      />
      {/* Box exterior */}
      <path
        d="M100 170L40 140V100L100 130L160 100V140L100 170Z"
        fill="var(--card)"
        stroke="var(--muted-foreground)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M100 130V170M40 140L100 110L160 140"
        stroke="var(--muted-foreground)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Open flaps */}
      <path
        d="M40 100L100 70L160 100L100 130L40 100Z"
        stroke="var(--muted-foreground)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeDasharray="4 4"
      />
      <path
        d="M100 90L100 50"
        stroke="var(--muted-foreground)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
