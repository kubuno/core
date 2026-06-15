import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Globe, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES, setLanguage } from '../i18n'
import { useAuthStore } from '../store/authStore'
import { api } from '../api/client'
import type { User } from '../types'

export default function LanguagePicker({ compact = false, dark = false }: { compact?: boolean; dark?: boolean } = {}) {
  const { t, i18n } = useTranslation()
  const user       = useAuthStore(s => s.user)
  const updateUser = useAuthStore(s => s.updateUser)

  // Persiste la langue dans les préférences serveur de l'utilisateur (suit l'utilisateur
  // sur n'importe quel navigateur). Le cookie est géré par setLanguage().
  const persistUser = (lng: string) => {
    if (!user) return
    api.patch<{ user: User }>('/me', { preferences: { language: lng } })
      .then(({ data }) => { if (data?.user) updateUser({ preferences: data.user.preferences }) })
      .catch(() => { /* cookie assure déjà la persistance locale */ })
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={`${compact ? 'w-9 h-9' : 'w-12 h-12'} rounded-full flex items-center justify-center transition-colors focus:outline-none ${
            dark ? 'text-white/75 hover:bg-white/15 data-[state=open]:bg-white/15' : 'text-text-secondary hover:bg-surface-3 data-[state=open]:bg-surface-3'}`}
          aria-label={t('header.language')}
          title={t('header.language')}
        >
          <Globe size={compact ? 18 : 20} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="min-w-44 bg-white rounded-[5px] border border-border shadow-lg py-1 z-[9999]"
        >
          {LANGUAGES.map(l => (
            <DropdownMenu.Item
              key={l.code}
              onSelect={() => setLanguage(l.code, persistUser)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-text-primary
                         hover:bg-surface-1 cursor-pointer outline-none"
            >
              <span className="text-base leading-none">{l.flag}</span>
              <span className="flex-1">{l.label}</span>
              {i18n.language === l.code && <Check size={14} className="text-primary" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
