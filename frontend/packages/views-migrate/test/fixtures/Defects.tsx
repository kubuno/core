import { useState } from 'react'
import { Folder } from 'lucide-react'
import { listFolders } from './defects-types'

const SAMPLE = 'Sample'

const absUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : `${window.location.origin}${u}`)

function embedCss(urls: string[]): string {
  return urls.map((u) => `@font-face {
  src: url('${absUrl(u)}');
}`).join('\n')
}

/** The codemod defects found migrating drive (WEB-VIEWS §22.4), one element each. */
export function Defects({ used, quota, urls }: { used: string; quota: string; urls: string[] }) {
  const [open, setOpen] = useState(false)
  const [mobile] = useState(false)
  const [checked, setChecked] = useState(false)
  // 3. A getter typed `Folder[]` (this file's `Folder` is lucide's icon).
  const folders = listFolders(open)
  return (
    <div className="flex flex-col gap-2">
      <Folder size={16} />
      <p className="text-sm">{folders.length} {SAMPLE}</p>
      {/* 4. A part whose copied helper uses `absUrl` only inside a template literal. */}
      <pre className="text-xs">{embedCss(urls)}</pre>
      {/* 5. A static style next to a computed class. */}
      <div className={`flex items-end ${mobile ? 'px-1' : 'px-4'}`} style={{ background: '#fff' }} onClick={() => setOpen(!open)}>
        <span className="text-xs">x</span>
      </div>
      {/* 6. Three runs, three text nodes. */}
      <span className="text-xs tabular-nums whitespace-nowrap">{used} / {quota}</span>
      {/* 7. A checkbox inside its label. */}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        Remember me
      </label>
    </div>
  )
}
