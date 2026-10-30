import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'

import { ResponsiveImage } from '@/components/responsive-image'
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
            <p className="text-sm leading-4 font-medium tracking-[1.4px] text-foreground">
              Bem-vindo à Kurio
            </p>
            <h1
              id="hero-titulo"
              className="mt-2 text-[32px] leading-[1.6] font-bold text-foreground lg:text-[43px] lg:leading-[70px]"
            >
              SEJA DONO DO FUTURO <br className="max-lg:hidden" />
              DA ARTE DIGITAL
            </h1>
            <p className="mt-1 max-w-[557px] text-sm leading-6 text-muted-foreground">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
              digital rara, apoie artistas e tenha uma parte da cultura da internet.
            </p>
            <Link
              to="/"
              hash="catalogo"
              className="mt-8 inline-flex h-10 w-[140px] items-center justify-center rounded-md bg-primary text-base leading-5 font-bold text-primary-foreground uppercase transition-colors hover:bg-highlight"
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

      {/* Mobile (Figma "Hero Banner"): 366×190, 12px radius, 16px padding, 138px art + 58px inset. */}
      <section aria-labelledby="hero-titulo-mobile" className="px-6 pt-4 md:hidden">
        <div className="relative overflow-hidden rounded-[12px] bg-[radial-gradient(120%_140%_at_25%_20%,#8a5a35_0%,#5a3a22_45%,#2a1a12_100%)] p-4">
          <span
            aria-hidden="true"
            className="absolute -top-14 left-[124px] size-[248px] rounded-full bg-white/[0.04]"
          />
          <div className="relative flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-4 font-medium text-foreground">Bem-vindo à Kurio</p>
              <h1
                id="hero-titulo-mobile"
                className="mt-1.5 max-w-[190px] text-lg leading-[29px] font-bold text-foreground"
              >
                SEJA DONO DA CULTURA DIGITAL
              </h1>
              <p className="mt-1.5 text-xs leading-[18px] text-muted-foreground">
                Descubra NFTs selecionados de criadores do mundo todo.
              </p>
              <Link
                to="/"
                hash="catalogo"
                className="mt-1 inline-flex items-center gap-2 text-xs leading-[14px] font-bold text-highlight uppercase"
              >
                Explorar <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="relative size-[138px] shrink-0">
              <div className="size-full overflow-hidden rounded-[16px]">
                <ResponsiveImage
                  src={image}
                  alt={alt}
                  sizes="140px"
                  width={138}
                  height={138}
                  priority
                  className="size-full"
                />
              </div>
              {featured[1] && (
                <div className="absolute top-[88px] left-[14px] size-[58px] overflow-hidden rounded-[16px]">
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
            </div>
          </div>
          <Dots
            count={count}
            active={active}
            onSelect={setActive}
            className="absolute bottom-0.5 left-1/2 -translate-x-1/2"
          />
        </div>
      </section>
    </>
  )
}
