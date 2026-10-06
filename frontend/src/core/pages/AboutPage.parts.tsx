/**
 * The parts of `AboutPage.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { Cloud, Shield, Zap, Package } from "lucide-react"
import type { AboutPage } from './AboutPage'

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
export { GithubMark }

export function Part1() {
  return (
    <Cloud size={44} className="text-primary" strokeWidth={1.5} />
  )
}

export function Part2({ t, modulesCount }: { t: NonNullable<AboutPage['tr']>; modulesCount: NonNullable<AboutPage['modulesCount']> }) {
  return (
    <>{[
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
            ))}</>
  )
}

export function Part3() {
  return (
    <a
                href="https://github.com/kubuno/kubuno"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary hover:underline"
              >
                github.com/kubuno/kubuno
              </a>
  )
}
