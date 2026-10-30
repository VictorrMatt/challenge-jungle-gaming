import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'

import { ResponsiveImage } from '@/components/responsive-image'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { featuredQueryOptions } from '../queries'

const HERO_BANNER = '/images/banners/hero'

function Dots({
  count,
  active,
  onSelect,
  className,
}: {
  count: number
  active: number
  onSelect: (index: number) => void
  className?: string
}) {
  return (
    <div role="group" aria-label="Destaques" className={cn('flex', className)}>
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(index)}
          aria-label={`Mostrar destaque ${index + 1} de ${count}`}
          aria-current={index === active ? 'true' : undefined}
          className="group grid size-6 place-items-center rounded-full"
        >
          {/* 8px dot as in Figma inside a 24px touch target (WCAG 2.5.8). */}
          <span
            aria-hidden="true"
            className={cn(
              'size-2 rounded-full bg-primary transition-opacity',
              index === active ? 'opacity-100' : 'opacity-60 group-hover:opacity-100',
            )}
          />
        </button>
      ))}
    </div>
  )
}

/**
 * Hero with the featured NFTs. Slides change only on user action (no autoplay → no motion
 * surprises and no layout work during LCP). The first slide uses the hero banner asset.
 */
export function HomeHero() {
  const { data } = useQuery(featuredQueryOptions())
  const [active, setActive] = useState(0)
  const featured = data?.items ?? []
  const slide = featured[active]
  const count = Math.max(featured.length, 3)
  const image = active === 0 || !slide ? HERO_BANNER : slide.image
  const alt = slide?.imageAlt ?? 'Arte em destaque da Kurio'

  return (
    <>
      {/* Desktop / tablet */}
      <section aria-labelledby="hero-titulo" className="container-page hidden pt-8 md:block">
        <div className="grid items-center gap-8 md:grid-cols-[1fr_minmax(0,320px)] lg:grid-cols-[600px_450px] lg:justify-between lg:gap-0 lg:pl-10">
          <div className="relative lg:h-[364px]">
            <p className="text-base leading-[1.4] tracking-[0.12em] text-foreground">
              Bem-vindo à Kurio
            </p>
            <h1
              id="hero-titulo"
              className="mt-3 text-[32px] leading-[1.6] font-bold tracking-[0.05em] text-foreground lg:mt-[6px] lg:text-[44px] lg:leading-[70px]"
            >
              SEJA DONO DO FUTURO DA ARTE DIGITAL
            </h1>
            <p className="mt-2 max-w-[560px] text-sm leading-[24px] text-muted-foreground">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
              digital rara, apoie artistas e tenha uma parte da cultura da internet.
            </p>
            <Link
              to="/"
              hash="catalogo"
              className="mt-8 inline-flex h-10 w-[140px] items-center justify-center rounded-sm bg-primary text-base font-bold text-primary-foreground uppercase transition-colors hover:bg-highlight"
            >
              Explorar
            </Link>
            <Dots
              count={count}
              active={active}
              onSelect={setActive}
              className="mt-10 lg:absolute lg:-right-2 lg:-bottom-2 lg:mt-0"
            />
          </div>
          <div className="aspect-square overflow-hidden rounded-[20px] lg:mt-0">
            <ResponsiveImage
              src={image}
              alt={alt}
              sizes="(min-width: 1024px) 450px, 320px"
              width={450}
              height={450}
              priority
              className="size-full"
            />
          </div>
        </div>
      </section>

      {/* Mobile */}
      <section aria-labelledby="hero-titulo-mobile" className="px-6 pt-4 md:hidden">
        <div className="relative min-h-[190px] overflow-hidden rounded-[24px] bg-[radial-gradient(120%_140%_at_25%_20%,#8a5a35_0%,#5a3a22_45%,#2a1a12_100%)] p-4 pb-7">
          <span
            aria-hidden="true"
            className="absolute -top-10 left-28 size-44 rounded-full bg-white/5"
          />
          <div className="relative z-10 max-w-[calc(100%-132px)] min-[400px]:max-w-[190px]">
            <p className="text-[11px] leading-tight font-bold text-foreground">Bem-vindo à Kurio</p>
            <h1
              id="hero-titulo-mobile"
              className="mt-2 text-[15px] leading-[1.5] font-bold tracking-[0.04em] text-foreground min-[400px]:text-[17px]"
            >
              SEJA DONO DA CULTURA DIGITAL
            </h1>
            <p className="mt-1 text-[12px] leading-[1.45] text-muted-foreground">
              Descubra NFTs selecionados de criadores do mundo todo.
            </p>
            <Link
              to="/"
              hash="catalogo"
              className="mt-1 inline-flex items-center gap-1 text-[12px] font-bold text-highlight uppercase"
            >
              Explorar <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="absolute top-2.5 right-3 size-[118px] overflow-hidden rounded-[18px] min-[400px]:size-[138px]">
            {data ? (
              <ResponsiveImage
                src={HERO_BANNER}
                alt={alt}
                sizes="140px"
                width={138}
                height={138}
                priority
                className="size-full"
              />
            ) : (
              <Skeleton className="size-full" />
            )}
          </div>
          {featured[1] && (
            <div className="absolute top-[88px] right-[92px] size-[52px] overflow-hidden rounded-xl border-2 border-card min-[400px]:top-[100px] min-[400px]:right-[100px] min-[400px]:size-[58px]">
              <ResponsiveImage
                src={featured[1].image}
                alt=""
                sizes="60px"
                width={58}
                height={58}
                className="size-full"
              />
            </div>
          )}
          <Dots
            count={count}
            active={active}
            onSelect={setActive}
            className="absolute bottom-2.5 left-1/2 -translate-x-1/2"
          />
        </div>
      </section>
    </>
  )
}
