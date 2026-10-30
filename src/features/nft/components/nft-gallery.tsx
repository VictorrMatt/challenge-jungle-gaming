import { ZoomIn } from 'lucide-react'
import { useState } from 'react'

import { ResponsiveImage } from '@/components/responsive-image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { NftDetail } from '@/shared/contracts'

/** Desktop gallery: 4 thumbnails + framed main image with zoom dialog (Figma detail). */
export function NftGallery({ nft }: { nft: NftDetail }) {
  const [active, setActive] = useState(0)
  const current = nft.gallery[active] ?? nft.gallery[0]!

  return (
    <div className="grid grid-cols-[100px_444px] gap-7">
      <ul aria-label="Imagens do NFT" className="flex flex-col gap-4">
        {nft.gallery.map((image, index) => (
          <li key={index}>
            <button
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Ver imagem ${index + 1} de ${nft.gallery.length}`}
              aria-current={index === active ? 'true' : undefined}
              className={cn(
                'block size-[100px] overflow-hidden rounded-sm ring-offset-2 ring-offset-background transition',
                index === active ? 'ring-2 ring-primary' : 'opacity-80 hover:opacity-100',
              )}
            >
              <ResponsiveImage
                src={image.src}
                alt=""
                sizes="100px"
                width={100}
                height={100}
                className="size-full"
              />
            </button>
          </li>
        ))}
      </ul>

      <div className="relative grid size-[444px] place-items-center rounded-sm bg-card">
        <div className="size-[404px] overflow-hidden rounded-[20px]">
          <ResponsiveImage
            src={current.src}
            alt={current.alt}
            sizes="404px"
            width={404}
            height={404}
            priority
            className="size-full"
          />
        </div>
        <Dialog>
          <DialogTrigger
            className="absolute top-[18px] right-[14px] grid size-[30px] place-items-center rounded-full bg-background text-foreground hover:text-highlight"
            aria-label="Ampliar imagem"
          >
            <ZoomIn className="size-5" aria-hidden="true" />
          </DialogTrigger>
          <DialogContent className="max-w-[min(92vw,820px)] border-border bg-card p-4 sm:max-w-[min(92vw,820px)]">
            <DialogTitle className="sr-only">{nft.name}</DialogTitle>
            <DialogDescription className="sr-only">{current.alt}</DialogDescription>
            <ResponsiveImage
              src={current.src}
              alt={current.alt}
              sizes="820px"
              width={820}
              height={820}
              className="aspect-square w-full rounded-xl"
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
