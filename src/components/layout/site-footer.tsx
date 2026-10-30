import { Link } from '@tanstack/react-router'
import { useId, useState, type FormEvent, type ReactNode } from 'react'

import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
  YoutubeIcon,
} from '@/components/icons/brand-icons'
import { cn } from '@/lib/utils'

const FEATURES = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

/** Footer links: in-scope destinations navigate; out-of-scope pages are shown as "em breve". */
type FooterLink = { label: string; to?: string; search?: Record<string, unknown> }

const COLUMNS: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: 'Meu perfil',
    links: [
      { label: 'Meu perfil', to: '/perfil' },
      { label: 'Minha coleção', to: '/favoritos' },
      { label: 'Atividade' },
      { label: 'Estúdio do criador' },
      { label: 'Lista de interesse', to: '/favoritos' },
    ],
  },
  {
    title: 'Central de ajuda',
    links: [
      { label: 'Central de ajuda' },
      { label: 'Como comprar NFTs' },
      { label: 'Carteira e segurança' },
      { label: 'Política do mercado' },
      { label: 'Denunciar item' },
    ],
  },
  {
    title: 'Coleções',
    links: [
      { label: 'Arte digital', to: '/', search: { categories: ['digital-art'] } },
      { label: 'Fotografia', to: '/', search: { categories: ['photography'] } },
      { label: 'Música', to: '/', search: { categories: ['music'] } },
      { label: 'Arte 3D', to: '/', search: { categories: ['3d-art'] } },
      { label: 'Utilidade', to: '/', search: { categories: ['utility'] } },
    ],
  },
]

const SOCIAL = [
  { label: 'Facebook', Icon: FacebookIcon, href: 'https://facebook.com' },
  { label: 'Instagram', Icon: InstagramIcon, href: 'https://instagram.com' },
  { label: 'Twitter', Icon: TwitterIcon, href: 'https://twitter.com' },
  { label: 'LinkedIn', Icon: LinkedinIcon, href: 'https://linkedin.com' },
  { label: 'YouTube', Icon: YoutubeIcon, href: 'https://youtube.com' },
]

function Heading({ children }: { children: ReactNode }) {
  return <h2 className="mb-1 text-xl leading-[1.5] font-bold text-foreground">{children}</h2>
}

function Newsletter() {
  const inputId = useId()
  const messageId = useId()
  const [message, setMessage] = useState<string | null>(null)

  // Newsletter is out of scope: the form validates but clearly states it is not active.
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = new FormData(event.currentTarget).get('email')
    setMessage(
      typeof email === 'string' && /\S+@\S+\.\S+/.test(email)
        ? 'A newsletter ainda não está disponível nesta demonstração.'
        : 'Informe um e-mail válido.',
    )
  }

  return (
    <div>
      <h2 className="text-lg leading-[0.9] font-bold text-foreground">
        Antecipe-se ao próximo lançamento
      </h2>
      <form onSubmit={submit} noValidate className="mt-[22px] flex h-10 overflow-hidden rounded-md">
        <label htmlFor={inputId} className="sr-only">
          E-mail para a newsletter
        </label>
        <input
          id={inputId}
          name="email"
          type="email"
          placeholder="digite seu e-mail..."
          aria-describedby={message ? messageId : undefined}
          className="min-w-0 flex-1 bg-surface-strong px-3 text-base text-foreground outline-none placeholder:text-subtle-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        />
        <button
          type="submit"
          className="w-[85px] bg-primary text-xl font-bold text-primary-foreground hover:bg-highlight"
        >
          Enviar
        </button>
      </form>
      <p
        id={messageId}
        role="status"
        className={cn(
          'mt-4 text-sm leading-[1.6] text-muted-foreground',
          message && 'text-highlight',
        )}
      >
        {message ??
          'Receba lançamentos selecionados, histórias de criadores e novidades do mercado.'}
      </p>
    </div>
  )
}

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn('mt-24 md:mt-[100px]', className)}>
      <div className="container-page">
        <section
          aria-label="Por que a Kurio"
          className="grid gap-8 bg-card px-6 py-8 md:grid-cols-2 md:px-12 lg:grid-cols-[249fr_266fr_265fr_324fr] lg:gap-0"
        >
          {FEATURES.map((feature) => (
            <div
              key={feature.letter}
              className="lg:border-r lg:border-primary lg:pr-4 lg:not-first:pl-4"
            >
              <span
                aria-hidden="true"
                className="grid size-[74px] place-items-center rounded-full bg-primary text-2xl font-bold text-primary-foreground"
              >
                {feature.letter}
              </span>
              <h2 className="mt-[19px] text-lg leading-[1.4] font-bold text-foreground">
                {feature.title}
              </h2>
              <p className="mt-2 text-base leading-[1.4] text-muted-foreground">{feature.text}</p>
            </div>
          ))}
          <div className="lg:pl-4">
            <Newsletter />
          </div>
        </section>

        <div className="grid gap-3 bg-surface-strong px-6 py-6 text-base leading-[1.4] text-foreground sm:grid-cols-2 md:px-8 lg:h-[88px] lg:grid-cols-[303px_302px_303px_1fr] lg:items-center lg:py-0">
          <span className="font-bold tracking-[0.12em]">KURIO</span>
          <span>Feito para colecionadores, criadores e cultura</span>
          <a href="mailto:contato@email.com" className="hover:text-highlight">
            contato@email.com
          </a>
          <a href="tel:+551140028922" className="hover:text-highlight">
            +55 11 4002 8922
          </a>
        </div>

        <div className="grid gap-8 bg-card px-6 pt-10 pb-10 sm:grid-cols-2 md:px-8 lg:grid-cols-[303px_302px_303px_1fr] lg:gap-0">
          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <Heading>{column.title}</Heading>
              <ul className="space-y-0">
                {column.links.map((link) => (
                  <li key={link.label} className="text-base leading-[30px]">
                    {link.to ? (
                      <Link
                        to={link.to}
                        search={link.search as never}
                        className="text-foreground hover:text-highlight"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <span className="text-foreground/60" title="Em breve">
                        {link.label} <span className="sr-only">(em breve)</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div>
            <Heading>Redes sociais</Heading>
            <ul className="mt-3 flex gap-2.5">
              {SOCIAL.map(({ label, Icon, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${label} (abre em nova aba)`}
                    className="grid size-8 place-items-center rounded-sm border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Icon className="size-5" />
                  </a>
                </li>
              ))}
            </ul>
            <h2 className="mt-6 text-xl leading-[1.5] font-bold text-foreground">
              Carteiras compatíveis
            </h2>
            <WalletBadges className="mt-2" />
          </div>
        </div>
      </div>
      <p className="py-5 text-center text-base text-foreground">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}

export function WalletBadges({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        'inline-flex h-[26px] items-center gap-2 rounded-sm border border-primary/40 bg-surface-strong px-2.5 text-[9px] font-bold tracking-wide text-highlight uppercase',
        className,
      )}
    >
      <span>MetaMask</span>
      <span aria-hidden="true">•</span>
      <span>WalletConnect</span>
      <span aria-hidden="true">•</span>
      <span>Coinbase</span>
    </p>
  )
}
