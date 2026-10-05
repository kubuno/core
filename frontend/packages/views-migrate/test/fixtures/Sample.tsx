import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Check, Copy } from 'lucide-react'
import { Button, Input } from '@ui'

interface Item { id: string; label: string; done: boolean }

function Badge({ text }: { text: string }) {
  return <span className="rounded-full px-2 text-xs">{text}</span>
}

/** A sample screen exercising every conversion of the codemod. */
export function Sample({ title }: { title: string }) {
  const { t } = useTranslation()
  const [items, setItems] = useState<Item[]>([])
  const [name, setName] = useState('')
  const [copied, setCopied] = useState(false)
  const done = items.filter((i) => i.done).length

  const add = () => {
    setItems((prev) => [...prev, { id: String(prev.length), label: name, done: false }])
    setName('')
  }

  return (
    <div className="max-w-md space-y-4">
      <h2 className="text-lg font-medium text-text-primary">{title}</h2>
      <p className="text-sm text-text-secondary">{t('sample.count', { count: done, defaultValue: '{{count}} done' })}</p>
      <div className="flex items-center gap-2">
        <Input label={t('sample.name', { defaultValue: 'Nom' })} value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={add} disabled={!name}>{t('common.add')}</Button>
      </div>
      {items.length === 0 && <p className="text-xs text-text-tertiary">{t('sample.empty', { defaultValue: 'Rien' })}</p>}
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            {item.done ? <Check size={14} className="text-success" /> : null}
            <span className={item.done ? 'line-through' : ''}>{item.label}</span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setCopied(true)} title={t('sample.copy', { defaultValue: 'Copier' })}
        className="p-2 rounded-lg border border-border">
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
      <Link to="/settings" className="text-primary hover:underline">{t('sample.settings', { defaultValue: 'Réglages' })}</Link>
      <Badge text={title} />
      {copied && <Badge text={name} />}
    </div>
  )
}

// A side effect of importing the screen: kept after the class.
console.debug('sample loaded')
