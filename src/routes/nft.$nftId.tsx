import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { Check, ChevronLeft, Mail, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { FavoriteHeart } from '@/components/commerce/favorite-heart'
import { QuantityStepper } from '@/components/commerce/quantity-stepper'
import { ErrorState } from '@/components/feedback/error-state'
import { NotFoundPage } from '@/components/feedback/not-found'
import { LinkedinIcon, TwitterIcon } from '@/components/icons/brand-icons'
import { ResponsiveImage } from '@/components/responsive-image'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAddToCart, useCart } from '@/features/cart/hooks'
import { nftDetailQueryOptions, relatedQueryOptions } from '@/features/catalog/queries'
import { useFavorites, useToggleFavorite } from '@/features/favorites/hooks'
import { EditionPicker } from '@/features/nft/components/edition-picker'
import { NftDetailSkeleton } from '@/features/nft/components/nft-detail-skeleton'
import { NftGallery } from '@/features/nft/components/nft-gallery'
import { RatingChip, RatingStars } from '@/features/nft/components/rating'
import { RelatedNfts } from '@/features/nft/components/related-nfts'
import { errorMessage, isApiClientError } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import { editionId, type EditionId, type NftDetail } from '@/shared/contracts'
import { formatEth, isEqual } from '@/shared/money/eth'

export const Route = createFileRoute('/nft/$nftId')({
  validateSearch: z.object({ edicao: editionId.optional().catch(undefined) }),
  loader: ({ context: { queryClient }, params }) => {
    void queryClient.prefetchQuery(nftDetailQueryOptions(params.nftId))
    void queryClient.prefetchQuery(relatedQueryOptions(params.nftId))
  },
  head: () => ({ meta: [{ title: 'Detalhes do NFT — Kurio' }] }),
  component: NftDetailPage,
})

const NETWORK_TEXT: Record<NftDetail['network'], string> = {
  ethereum: 'Cunhado na Ethereum com procedência imutável e metadados armazenados no IPFS.',
  polygon: 'Cunhado na Polygon com taxas baixas e metadados armazenados no IPFS.',
  solana: 'Cunhado na Solana com confirmação rápida e metadados armazenados no Arweave.',
}

const TAB_TRIGGER =
  'h-auto flex-none rounded-none border-0 px-0 pb-2 text-lg font-normal text-foreground shadow-none dark:text-foreground data-[state=active]:bg-transparent data-[state=active]:font-bold data-[state=active]:text-highlight data-[state=active]:shadow-[inset_0_-3px_0_var(--primary)] dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-highlight'

function defaultEdition(nft: NftDetail): EditionId | null {
  const preferred = nft.editions.find((edition) => edition.id === '1-50' && edition.available > 0)
  return (preferred ?? nft.editions.find((edition) => edition.available > 0))?.id ?? null
}

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const {
    data: nft,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery(nftDetailQueryOptions(nftId))

  if (isPending) return <NftDetailSkeleton />
  if (isError) {
    if (isApiClientError(error) && error.is('NOT_FOUND')) {
      return (
        <NotFoundPage
          title="NFT não encontrado"
          description="Este NFT não existe, foi removido ou o endereço está incorreto."
        />
      )
    }
    return (
      <div className="container-page py-16">
        <ErrorState
          title="Não foi possível carregar este NFT"
          description={errorMessage(error)}
          onRetry={() => void refetch()}
          retrying={isFetching}
        />
      </div>
    )
  }
  // Remount per NFT so local selection state never leaks between NFTs.
  return <NftDetailView key={nft.id} nft={nft} />
}

function NftDetailView({ nft }: { nft: NftDetail }) {
  const navigate = useNavigate()
  const router = useRouter()
  const search = Route.useSearch()
  const cart = useCart()
  const addToCart = useAddToCart()
  const favorites = useFavorites()
  const favorite = useToggleFavorite()
  const [quantity, setQuantity] = useState(1)
  // Brief check-mark confirmation on the mobile add-to-cart button.
  const [justAdded, setJustAdded] = useState(false)
  // Prices seen when the page opened; realtime updates are compared against the selected edition.
  const [initialPrices] = useState<{ base: string; editions: Record<string, string> }>(() => ({
    base: nft.price,
    editions: Object.fromEntries(nft.editions.map((candidate) => [candidate.id, candidate.price])),
  }))

  const selectedId =
    search.edicao && nft.editions.some((edition) => edition.id === search.edicao)
      ? search.edicao
      : defaultEdition(nft)
  const edition = nft.editions.find((candidate) => candidate.id === selectedId) ?? null
  const inCart =
    cart.data?.items.find((item) => item.nftId === nft.id && item.editionId === selectedId)
      ?.quantity ?? 0
  const maxQuantity = edition
    ? Math.max(0, Math.min(edition.available, edition.maxPerOrder) - inCart)
    : 0
  const effectiveQuantity = Math.min(quantity, Math.max(maxQuantity, 1))
  const unavailable = !edition || edition.available === 0
  const isFavorite = favorites.data?.has(nft.id) ?? false
  const firstPrice = (edition && initialPrices.editions[edition.id]) ?? initialPrices.base
  const currentPrice = edition ? edition.price : nft.price
  const priceChanged = !isEqual(firstPrice, currentPrice)
  const shareUrl = typeof window === 'undefined' ? '' : window.location.href

  function selectEdition(id: EditionId) {
    setQuantity(1)
    void navigate({ to: '.', search: { edicao: id }, replace: true, resetScroll: false })
  }

  function add({ goToCart }: { goToCart: boolean }) {
    if (!edition || unavailable || maxQuantity === 0) return
    addToCart.mutate(
      { nftId: nft.id, editionId: edition.id, quantity: effectiveQuantity },
      {
        onSuccess: () => {
          toast.success(
            `${nft.name} (${edition.label}) × ${effectiveQuantity} adicionado ao carrinho.`,
            { id: 'cart-add' },
          )
          setQuantity(1)
          if (goToCart) {
            void navigate({ to: '/carrinho' })
          } else {
            setJustAdded(true)
            window.setTimeout(() => setJustAdded(false), 1600)
          }
        },
        onError: (mutationError) =>
          toast.error(errorMessage(mutationError, 'Não foi possível adicionar ao carrinho.')),
      },
    )
  }

  const availabilityHint = unavailable
    ? 'Esta edição está esgotada. Escolha outra edição.'
    : maxQuantity === 0
      ? `Você já tem o máximo disponível desta edição no carrinho (${inCart}).`
      : maxQuantity < 10
        ? `Máximo de ${maxQuantity} ${maxQuantity === 1 ? 'unidade disponível' : 'unidades disponíveis'} para você.`
        : null

  const buyDisabled = unavailable || maxQuantity === 0 || addToCart.isPending

  const details = (
    <dl className="space-y-0 text-base leading-[32px] text-muted-foreground">
      <div>
        <dt className="inline">ID do token: </dt>
        <dd className="inline">{nft.tokenId}</dd>
      </div>
      <div>
        <dt className="inline">Coleção: </dt>
        <dd className="inline">{nft.collection.name}</dd>
      </div>
      <div>
        <dt className="inline">Atributos: </dt>
        <dd className="inline">{nft.attributes.join(', ')}</dd>
      </div>
    </dl>
  )

  return (
    <article aria-labelledby="nft-titulo">
      {/* ------------------------------------------------------------------ Mobile hero */}
      <div className="relative md:hidden">
        <div className="absolute inset-x-0 top-0 z-10 flex justify-between px-6 pt-5">
          <button
            type="button"
            onClick={() =>
              router.history.length > 1 ? router.history.back() : void navigate({ to: '/' })
            }
            aria-label="Voltar"
            className="grid size-[34px] place-items-center rounded-full bg-background/70 text-foreground"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => favorite.toggle(nft.id, nft.name, !isFavorite)}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? 'Remover da lista de interesse' : 'Favoritar'}
            className="grid size-[34px] place-items-center rounded-full bg-background/70 text-foreground"
          >
            <FavoriteHeart active={isFavorite} className="size-5" />
          </button>
        </div>
        <div className="px-7 pt-16">
          <div className="aspect-[361/330] overflow-hidden rounded-[24px]">
            <ResponsiveImage
              src={nft.image}
              alt={nft.imageAlt}
              sizes="100vw"
              width={361}
              height={330}
              priority
              className="size-full"
            />
          </div>
        </div>
      </div>

      <div className="container-page max-md:-mt-6 max-md:rounded-t-[28px] max-md:bg-card max-md:pt-6 max-md:pb-48 md:pt-6">
        <nav aria-label="Trilha de navegação" className="hidden md:block">
          <ol className="flex gap-2 text-base leading-[1.4] font-bold text-foreground">
            <li>
              <Link to="/" className="hover:text-highlight">
                Início
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to="/" hash="catalogo" className="hover:text-highlight">
                Mercado
              </Link>
            </li>
          </ol>
        </nav>

        <div className="grid gap-8 md:mt-1.5 lg:grid-cols-[572px_1fr] lg:gap-[33px]">
          <div className="hidden lg:block">
            <NftGallery nft={nft} />
          </div>
          <div className="hidden overflow-hidden rounded-[20px] md:block lg:hidden">
            <ResponsiveImage
              src={nft.image}
              alt={nft.imageAlt}
              sizes="90vw"
              width={700}
              height={700}
              priority
              className="aspect-square w-full"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3 md:block">
              <h1
                id="nft-titulo"
                className="text-xl leading-[1.4] font-bold text-foreground md:text-[28px]"
              >
                {nft.name}
              </h1>
              <div className="md:hidden">
                <RatingChip average={nft.rating.average} count={nft.rating.count} />
              </div>
            </div>
            <div className="hidden items-center justify-between gap-4 border-b border-border-accent pb-1.5 md:mt-1 md:flex">
              <p className="text-[22px] leading-[1.5] font-bold text-highlight">
                <span className="sr-only">Preço: </span>
                {edition ? formatEth(edition.price) : formatEth(nft.price)}
              </p>
              <RatingStars average={nft.rating.average} count={nft.rating.count} />
            </div>

            <p
              role="status"
              aria-live="polite"
              className={cn('text-sm text-warning', priceChanged ? 'mt-2' : 'sr-only')}
            >
              {priceChanged
                ? `Preço atualizado em tempo real: ${formatEth(firstPrice)} → ${formatEth(currentPrice)}.`
                : ''}
            </p>

            <h2 className="mt-4 hidden text-sm leading-[1.4] font-bold text-foreground md:block">
              Sobre este NFT:
            </h2>
            <p className="mt-3 text-sm leading-[24px] text-muted-foreground md:mt-2">
              {nft.description}
            </p>

            <EditionPicker
              editions={nft.editions}
              value={selectedId}
              onChange={selectEdition}
              className="mt-3 md:mt-2"
            />

            {/* Desktop buy row */}
            <div className="mt-5 hidden items-center justify-between gap-4 md:flex">
              <QuantityStepper
                value={effectiveQuantity}
                max={Math.max(maxQuantity, 1)}
                onChange={setQuantity}
                disabled={buyDisabled}
                label="Quantidade de edições"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => add({ goToCart: true })}
                  disabled={buyDisabled}
                  className="w-[130px] uppercase"
                >
                  {addToCart.isPending ? 'Adicionando…' : 'Comprar'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => favorite.toggle(nft.id, nft.name, !isFavorite)}
                  aria-pressed={isFavorite}
                  className="w-[130px] font-normal"
                >
                  <FavoriteHeart active={isFavorite} className="size-5" />
                  {isFavorite ? 'Favoritado' : 'Favoritar'}
                </Button>
              </div>
            </div>
            {availabilityHint && <p className="mt-2 text-sm text-warning">{availabilityHint}</p>}

            <div className="mt-4">{details}</div>

            <div className="mt-1 hidden items-center gap-3 md:flex">
              <p className="text-base font-bold text-foreground">Compartilhar este NFT:</p>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Compartilhar no LinkedIn (abre em nova aba)"
                className="text-foreground hover:text-highlight"
              >
                <LinkedinIcon className="size-5" />
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(nft.name)}&body=${encodeURIComponent(shareUrl)}`}
                aria-label="Compartilhar por e-mail"
                className="text-foreground hover:text-highlight"
              >
                <Mail className="size-5" aria-hidden="true" />
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(nft.name)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Compartilhar no Twitter (abre em nova aba)"
                className="text-foreground hover:text-highlight"
              >
                <TwitterIcon className="size-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Tabs: details + reviews */}
        <Tabs defaultValue="detalhes" className="mt-12 hidden md:mt-[86px] md:flex">
          <TabsList className="h-auto w-full justify-start gap-8 rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger value="detalhes" className={TAB_TRIGGER}>
              Detalhes do NFT
            </TabsTrigger>
            <TabsTrigger value="avaliacoes" className={TAB_TRIGGER}>
              Avaliações de colecionadores ({nft.rating.count})
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="detalhes"
            className="pt-3 text-sm leading-[24px] text-muted-foreground"
          >
            {nft.story.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="mb-6">
                {paragraph}
              </p>
            ))}
            <h3 className="font-bold text-foreground">Rede:</h3>
            <p className="mb-3">{NETWORK_TEXT[nft.network]}</p>
            <h3 className="font-bold text-foreground">Contrato:</h3>
            <p className="mb-3">
              Direitos autorais do criador: {nft.creator.royaltyBps / 100}% nas vendas secundárias,
              pagos automaticamente pelos mercados compatíveis.
            </p>
            <h3 className="font-bold text-foreground">Direitos autorais:</h3>
            <p>
              {nft.contract.address} • Contrato inteligente {nft.contract.standard} verificado.
            </p>
          </TabsContent>
          <TabsContent value="avaliacoes" className="pt-3">
            <ul className="space-y-4">
              {nft.reviews.map((review) => (
                <li key={review.id} className="rounded-sm bg-card p-4">
                  <p className="font-bold text-foreground">
                    {review.author}{' '}
                    <span className="font-normal text-highlight">— {review.rating}/5</span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>

        <div className="hidden md:block">
          <RelatedNfts nftId={nft.id} title="Mais desta coleção" />
        </div>
      </div>

      {/* ------------------------------------------------------------------ Mobile buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 rounded-t-[28px] bg-[#1d120e] px-6 pt-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(0,0,0,0.4)] md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-base text-muted-foreground" aria-hidden="true">
              Qtd.
            </span>
            <QuantityStepper
              variant="compact"
              value={effectiveQuantity}
              max={Math.max(maxQuantity, 1)}
              onChange={setQuantity}
              disabled={buyDisabled}
              label="Quantidade de edições"
            />
          </div>
          <p className="text-xl font-bold text-highlight">
            <span className="sr-only">Preço unitário: </span>
            {edition ? formatEth(edition.price) : formatEth(nft.price)}
          </p>
        </div>
        <div className="mt-4 flex gap-3">
          <Button
            variant="gradient"
            size="xl"
            className="flex-1"
            onClick={() => add({ goToCart: true })}
            disabled={buyDisabled}
          >
            {addToCart.isPending ? 'Adicionando…' : 'Comprar NFT'}
          </Button>
          <Button
            variant="secondary"
            size="icon-lg"
            className="size-[60px] rounded-full border-border bg-card text-highlight"
            onClick={() => add({ goToCart: false })}
            disabled={buyDisabled}
            aria-label="Adicionar ao carrinho"
          >
            {justAdded ? (
              <Check className="animate-pop" aria-hidden="true" />
            ) : (
              <ShoppingCart aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    </article>
  )
}
