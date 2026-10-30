import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function UserAvatar({
  user,
  className,
}: {
  user: { displayName: string; avatarUrl: string | null }
  className?: string
}) {
  const initials = user.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
  return (
    <Avatar className={cn('bg-secondary', className)}>
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
      <AvatarFallback className="bg-secondary text-[10px] font-bold text-highlight">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
