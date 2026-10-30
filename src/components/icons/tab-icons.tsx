import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

/* Solid 20px glyphs for the mobile tab bar (Figma uses the filled icon style there). */

export function HomeSolidIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M10.62 2.53a2.2 2.2 0 0 1 2.76 0l7.1 5.66c.52.42.82 1.04.82 1.71v9.35A2.75 2.75 0 0 1 18.55 22H15.5a1 1 0 0 1-1-1v-4.25a1.25 1.25 0 0 0-1.25-1.25h-2.5a1.25 1.25 0 0 0-1.25 1.25V21a1 1 0 0 1-1 1H5.45a2.75 2.75 0 0 1-2.75-2.75V9.9c0-.67.3-1.3.82-1.71l7.1-5.66Z" />
    </svg>
  )
}

export function HeartSolidIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 21.2c-.3 0-.6-.1-.84-.28C7.9 18.5 2.5 14.36 2.5 8.98 2.5 6 4.78 3.6 7.6 3.6c1.74 0 3.26.86 4.4 2.3 1.14-1.44 2.66-2.3 4.4-2.3 2.82 0 5.1 2.4 5.1 5.38 0 5.38-5.4 9.52-8.66 11.94-.24.18-.54.28-.84.28Z" />
    </svg>
  )
}

export function UserSolidIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="12" cy="7.25" r="4.75" />
      <path d="M12 13.75c-4.6 0-8 2.17-8 5.06C4 20.6 5.42 21.5 12 21.5s8-.9 8-2.69c0-2.89-3.4-5.06-8-5.06Z" />
    </svg>
  )
}
