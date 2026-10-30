import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

import { ResponsiveImage } from '@/components/responsive-image'

const PROMOS = [
  {
    id: 'lancamentos',
    title: 'Lançamentos gênesis de edição limitada',
    text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: '/images/banners/promo-genesis',
    alt: 'Arte do lançamento gênesis: macaco ilustrado com óculos e jaqueta verde',
    search: { tab: 'new' as const },
  },
  {
    id: 'criadores',
    title: 'Arte digital selecionada e muito mais',
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: '/images/banners/promo-curated',
    alt: 'Arte selecionada: gorila ilustrado com blazer creme',
    search: { categories: ['digital-art' as const] },
  },
]

export function HomePromos() {
  return (
    <section
      aria-label="Coleções em destaque"
      className="container-page mt-24 hidden md:block lg:mt-[100px]"
    >
      <ul className="grid gap-7 lg:grid-cols-2">
        {PROMOS.map((promo) => (
          <li key={promo.id} id={promo.id} className="scroll-mt-6">
            {/* 586×250 at full width (287px art = 49%); narrower cards shrink the art and grow
                in height instead of clipping the CTA. */}
            <article className="grid min-h-[250px] grid-cols-[49%_1fr] overflow-hidden rounded-[20px] bg-card">
              <ResponsiveImage
                src={promo.image}
                alt={promo.alt}
                sizes="(min-width: 1264px) 287px, 25vw"
                width={287}
                height={250}
                className="h-full min-h-[250px] w-full rounded-[20px]"
              />
              <div className="flex flex-col items-end px-5 pt-[38px] pb-[46px] text-right xl:pr-[30px] xl:pl-2">
                <h2 className="text-lg leading-[24px] font-bold text-foreground">{promo.title}</h2>
                <p className="mt-2 mb-6 text-sm leading-[24px] text-muted-foreground">
                  {promo.text}
                </p>
                <Link
                  to="/"
                  search={promo.search}
                  hash="catalogo"
                  className="mt-auto inline-flex h-10 w-[140px] shrink-0 items-center justify-center gap-1 rounded-sm bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-highlight"
                >
                  Explorar <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}

const POSTS = [
  {
    date: '12 de setembro',
    read: 6,
    title: 'Como funciona a propriedade de NFTs',
    text: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
  },
  {
    date: '13 de setembro',
    read: 2,
    title: '10 artistas digitais para acompanhar',
    text: 'Conheça criadores que moldam a cultura digital.',
  },
  {
    date: '15 de setembro',
    read: 3,
    title: 'Raridade, atributos e procedência',
    text: 'Entenda raridade, procedência, direitos autorais e utilidade.',
  },
  {
    date: '15 de setembro',
    read: 2,
    title: 'Como proteger sua carteira',
    text: 'Proteja sua carteira, seus ativos e sua identidade.',
  },
]

/** Editorial pages are out of scope: "Ler mais" says so instead of pretending to navigate. */
export function HomeJournal() {
  return (
    <section
      id="diario"
      aria-labelledby="diario-titulo"
      className="container-page mt-24 hidden scroll-mt-6 md:block lg:mt-[100px]"
    >
      <h2
        id="diario-titulo"
        className="text-center text-[28px] leading-[1.4] font-bold text-foreground"
      >
        Diário da Cunhagem
      </h2>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
      </p>
      <ul className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4 xl:grid-cols-[repeat(4,268px)]">
        {POSTS.map((post, index) => (
          <li key={post.title}>
            <article className="overflow-hidden rounded-md bg-card">
              <ResponsiveImage
                src={`/images/blog/blog-${index + 1}`}
                alt=""
                sizes="268px"
                width={268}
                height={180}
                className="aspect-[268/180] w-full"
              />
              <div className="px-4 pt-3 pb-4">
                <p className="text-xs leading-[1.4] text-muted-foreground">
                  {post.date} &nbsp;|&nbsp; Leitura de {post.read} min
                </p>
                <h3 className="mt-2 text-base leading-[1.3] font-bold text-foreground">
                  {post.title}
                </h3>
                <p className="mt-2 text-xs leading-[1.4] text-highlight/90">{post.text}</p>
                <button
                  type="button"
                  onClick={() =>
                    toast.info('Os artigos do Diário da Cunhagem estarão disponíveis em breve.', {
                      id: 'journal-soon',
                    })
                  }
                  className="mt-1.5 text-xs font-bold text-highlight hover:underline"
                >
                  Ler mais <span aria-hidden="true">→</span>
                  <span className="sr-only">sobre {post.title} (em breve)</span>
                </button>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
