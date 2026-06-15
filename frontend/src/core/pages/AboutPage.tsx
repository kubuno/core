import { Cloud, Shield, Zap, Package } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'

// lucide-react v1 a retiré les icônes de marque (dont Github). On rend donc le
// mark GitHub en SVG inline (currentColor → coloré par la classe text-*), comme
// le reste de l'app le fait déjà pour les logos de fournisseurs OAuth.
function GithubMark({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"
         className={className} aria-hidden="true">
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58
        0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76
        -1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1
        .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23
        -.12-.31-.54-1.53.12-3.19 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0
        2.05.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.19.77.84 1.24
        1.92 1.24 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.61-.02
        2.9-.02 3.29 0 .32.22.7.83.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z"/>
    </svg>
  )
}

export default function AboutPage() {
  const { t } = useTranslation()
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => fetch('/health').then(r => r.json()),
    staleTime: 60_000,
  })
  const { data: modulesData } = useQuery({
    queryKey: ['modules'],
    queryFn: () => api.get<{ modules: { module_id: string; base_url: string }[] }>('/modules').then(r => r.data),
  })

  const version: string = health?.version ?? '—'
  const modulesCount: number = modulesData?.modules.length ?? 0

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-medium text-text-primary mb-6">{t('about.title')}</h1>

      {/* Carte principale */}
      <div className="bg-white rounded-2xl border border-border p-8 mb-6 flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 rounded-3xl bg-primary-light flex items-center justify-center">
          <Cloud size={44} className="text-primary" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Kubuno</h2>
          <p className="text-sm text-text-tertiary mt-0.5">v{version}</p>
        </div>
        <p className="text-sm text-text-secondary max-w-md">
          {t('about.description')}
        </p>
      </div>

      {/* Infos techniques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { icon: Zap,     label: t('about.engine'),  value: 'Rust + Axum' },
          { icon: Shield,  label: t('about.license'), value: 'AGPLv3' },
          { icon: Package, label: t('about.modules'), value: String(modulesCount) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
            <Icon size={18} className="text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-text-tertiary">{label}</p>
              <p className="text-sm font-medium text-text-primary">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Liens */}
      <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
        <GithubMark size={18} className="text-text-secondary flex-shrink-0" />
        <div>
          <p className="text-xs text-text-tertiary mb-0.5">{t('about.source')}</p>
          <a
            href="https://github.com/kubuno/kubuno"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary hover:underline"
          >
            github.com/kubuno/kubuno
          </a>
        </div>
      </div>
    </div>
  )
}
