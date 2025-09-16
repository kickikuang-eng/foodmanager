"use client"

export default function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 4l8 14H4L12 4z" />
    </svg>
  )
}


