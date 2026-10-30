import { type ImgHTMLAttributes, useLayoutEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

/** Widths produced by `scripts/build-images.mjs`. Keep both lists in sync. */
const WIDTHS = [240, 480, 960] as const

type ResponsiveImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> & {
  /** Asset path without extension or width, e.g. `/images/nfts/emerald-ape`. */
  src: string
  alt: string
  /** CSS `sizes` hint, e.g. `(min-width: 1024px) 250px, 45vw`. */
  sizes: string
  /** Marks the image as the LCP candidate: eager load + high fetch priority. */
  priority?: boolean
}

function srcSet(base: string, format: 'avif' | 'webp') {
  return WIDTHS.map((width) => `${base}-${width}.${format} ${width}w`).join(', ')
}

/**
 * `<picture>` with AVIF/WebP renditions. Width/height must be provided (or the parent must
 * reserve the box with `aspect-ratio`) so the layout never shifts while images load.
 *
 * Lazy images that are not in the cache yet fade in once decoded instead of painting top-down;
 * cached and priority (LCP) images render immediately, untouched.
 */
export function ResponsiveImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
  onLoad,
  onError,
  ...props
}: ResponsiveImageProps) {
  const ref = useRef<HTMLImageElement>(null)
  const [phase, setPhase] = useState<'static' | 'loading' | 'revealed'>('static')

  // Runs before paint: an image still downloading starts transparent, so it never flashes.
  useLayoutEffect(() => {
    if (!priority && ref.current && !ref.current.complete) setPhase('loading')
  }, [priority])

  const reveal = () => setPhase((current) => (current === 'loading' ? 'revealed' : current))

  return (
    <picture className="contents">
      <source type="image/avif" srcSet={srcSet(src, 'avif')} sizes={sizes} className="hidden" />
      <source type="image/webp" srcSet={srcSet(src, 'webp')} sizes={sizes} className="hidden" />
      <img
        src={`${src}-480.webp`}
        alt={alt}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        ref={ref}
        onLoad={(event) => {
          reveal()
          onLoad?.(event)
        }}
        onError={(event) => {
          reveal()
          onError?.(event)
        }}
        className={cn(
          'object-cover',
          className,
          // After `className` so tailwind-merge keeps it over a caller's own opacity.
          phase === 'loading' && 'opacity-0',
          phase === 'revealed' && 'animate-image-in',
        )}
        {...props}
      />
    </picture>
  )
}
