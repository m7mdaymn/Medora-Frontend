'use client'

import { usePatientAuthStore } from '@/store/usePatientAuthStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, UserCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ProfileSwitcher({ tenantSlug }: { tenantSlug: string }) {
  const authData = usePatientAuthStore((state) => state.tenants[tenantSlug])
  const setActiveProfile = usePatientAuthStore((state) => state.setActiveProfile)

  if (!authData?.user) return null

  const profiles = authData.user.profiles || []
  const activeProfileId = authData.activeProfileId
  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0]

  const handleProfileChange = (newProfileId: string) => {
    setActiveProfile(tenantSlug, newProfileId)
  }

  return (
    <DropdownMenu dir='rtl'>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex items-center gap-2 h-9 px-3 border border-border/40 bg-muted/20 hover:bg-muted/40 rounded-full transition-all'
        >
          <UserCircle2 className='w-4 h-4 text-primary' />
          <span className='text-xs font-bold truncate max-w-20'>{activeProfile?.name}</span>
          <ChevronDown className='w-3 h-3 text-muted-foreground' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48 p-1'>
        {profiles.map((profile) => (
          <DropdownMenuItem
            key={profile.id}
            onClick={() => handleProfileChange(profile.id)}
            className={`cursor-pointer text-xs font-bold rounded-md ${
              profile.id === activeProfileId ? 'bg-primary/10 text-primary' : ''
            }`}
          >
            {profile.name} {profile.isDefault && '(أنا)'}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
