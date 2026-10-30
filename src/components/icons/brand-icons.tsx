import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

/* Simplified brand marks used only as link/button glyphs (decorative: labels carry the name). */

export function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14 8h2.5V4.5H14c-2.5 0-4 1.6-4 4.1V11H7.5v3.5H10V21h3.6v-6.5h2.6l.4-3.5h-3V8.9c0-.6.2-.9.9-.9Z" />
    </svg>
  )
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      {...props}
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function TwitterIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M21.5 6.2c-.7.3-1.4.5-2.2.6.8-.5 1.4-1.2 1.7-2.1-.7.4-1.6.8-2.4.9a3.8 3.8 0 0 0-6.5 3.5A10.8 10.8 0 0 1 4.2 5.1a3.8 3.8 0 0 0 1.2 5.1c-.6 0-1.2-.2-1.7-.5 0 1.9 1.3 3.4 3 3.8-.6.2-1.2.2-1.7.1.5 1.5 1.9 2.6 3.6 2.6A7.7 7.7 0 0 1 2.5 18 10.8 10.8 0 0 0 19.1 8.9v-.5c.9-.6 1.6-1.3 2.4-2.2Z" />
    </svg>
  )
}

export function LinkedinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M4.5 9h3.3v10.5H4.5V9Zm1.7-5.2a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8ZM9.9 9h3.2v1.4h.1c.4-.8 1.5-1.7 3.1-1.7 3.3 0 3.9 2.2 3.9 5v5.8h-3.3v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7v5.2H9.9V9Z" />
    </svg>
  )
}

export function YoutubeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
    </svg>
  )
}

export function GoogleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8Z"
      />
      <path
        fill="#34A853"
        d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.9A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.8 14c-.2-.7-.4-1.3-.4-2s.1-1.4.4-2V7.1H2.1A11 11 0 0 0 1 12c0 1.8.4 3.4 1.1 4.9L5.8 14Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1L5.8 10C6.7 7.3 9.1 5.4 12 5.4Z"
      />
    </svg>
  )
}

export function FacebookColorIcon(props: IconProps) {
  return <FacebookIcon {...props} style={{ color: '#3b5999', ...props.style }} />
}

/** "Thank you" envelope from the order confirmation modal. */
export function ThankYouIllustration(props: IconProps) {
  return (
    <svg
      viewBox="0 0 68 82"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 34 34 58l31-24" strokeLinejoin="round" />
      <path d="M3 34v44h62V34" strokeLinejoin="round" />
      <path d="m3 78 24-22M65 78 41 56" />
      <path d="M11 40V8h46v32" strokeLinejoin="round" />
      <path d="M28 8c0-4 2.7-6 6-6s6 2 6 6" />
      <text
        x="34"
        y="22"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontSize="10"
        fontWeight="800"
        fontFamily="inherit"
      >
        THANK
      </text>
      <text
        x="34"
        y="33"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontSize="10"
        fontWeight="800"
        fontFamily="inherit"
      >
        YOU
      </text>
    </svg>
  )
}
