import { Link } from '@tanstack/react-router'
import { Heart, LogOut, MapPin, User as UserIcon } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLogout } from '@/features/auth/hooks'
import type { User } from '@/shared/contracts'

import { UserAvatar } from './user-avatar'

export function UserMenu({ user }: { user: User }) {
  const logout = useLogout()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-[35px] max-w-[160px] items-center gap-2 rounded-sm border border-primary px-2 text-sm font-bold text-highlight outline-none hover:bg-primary/10 focus-visible:ring-[3px] focus-visible:ring-ring/60"
        aria-label={`Conta de ${user.displayName}`}
      >
        <UserAvatar user={user} className="size-6" />
        <span className="truncate">{user.displayName}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
          {user.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/perfil">
            <UserIcon aria-hidden="true" /> Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/perfil/carteiras">
            <MapPin aria-hidden="true" /> Carteiras
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/favoritos">
            <Heart aria-hidden="true" /> Lista de interesse
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => logout.mutate()} disabled={logout.isPending}>
          <LogOut aria-hidden="true" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
