import { ImagePlus } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { errorMessage } from '@/lib/api/errors'
import { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES, type Profile } from '@/shared/contracts'

import { useAvatar } from '../hooks'

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(String(reader.result)))
    reader.addEventListener('error', () =>
      reject(reader.error ?? new Error('Falha ao ler a imagem')),
    )
    reader.readAsDataURL(file)
  })
}

/** Avatar upload (PNG/JPEG/WebP ≤ 1 MB) with client validation mirrored by the API. */
export function AvatarField({ profile }: { profile: Profile }) {
  const { upload, remove } = useAvatar()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const labelId = useId()
  const errorId = useId()
  const busy = upload.isPending || remove.isPending

  async function onFile(file: File | undefined) {
    setError(null)
    if (!file) return
    if (!(AVATAR_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError('Use uma imagem PNG, JPEG ou WebP.')
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setError('A imagem deve ter no máximo 1 MB.')
      return
    }
    const dataUrl = await readAsDataUrl(file)
    upload.mutate(dataUrl, {
      onSuccess: () => toast.success('Avatar atualizado.'),
      onError: (mutationError) => setError(errorMessage(mutationError)),
    })
  }

  return (
    <div role="group" aria-labelledby={labelId} aria-describedby={error ? errorId : undefined}>
      <p id={labelId} className="text-base text-foreground">
        Avatar
      </p>
      <div className="mt-2.5 flex items-center gap-6">
        <Avatar className="size-[50px] border border-input bg-secondary">
          {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="Seu avatar atual" />}
          <AvatarFallback className="bg-secondary text-highlight">
            <ImagePlus className="size-6" aria-hidden="true" />
            <span className="sr-only">Sem avatar</span>
          </AvatarFallback>
        </Avatar>
        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_MIME_TYPES.join(',')}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            void onFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="h-10 w-[98px] rounded-sm bg-primary text-sm font-bold text-primary-foreground hover:bg-highlight disabled:opacity-60"
        >
          {upload.isPending ? 'Enviando…' : 'Alterar'}
        </button>
        <button
          type="button"
          onClick={() =>
            remove.mutate(undefined, {
              onSuccess: () => toast.success('Avatar removido.'),
              onError: (mutationError) => setError(errorMessage(mutationError)),
            })
          }
          disabled={busy || !profile.avatarUrl}
          className="text-sm text-foreground hover:text-highlight disabled:opacity-50"
        >
          Remover
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
