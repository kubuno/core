import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Cloud, AlertCircle } from 'lucide-react'
import { useLinkedAccountsStore } from '../store/linkedAccountsStore'
import { api } from '../api/client'
import { Button, Input } from '@ui'

interface Props {
  open: boolean
  onClose: () => void
}

export default function AddAccountModal({ open, onClose }: Props) {
  const { t } = useTranslation()
  const add = useLinkedAccountsStore((s) => s.add)

  const [instanceUrl, setInstanceUrl] = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [error, setError]             = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)

  const reset = () => {
    setInstanceUrl('')
    setEmail('')
    setPassword('')
    setError(null)
    setLoading(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const base = instanceUrl.trim().replace(/\/$/, '')
    if (!base) { setError(t('account.err_url')); return }
    if (!email.trim()) { setError(t('account.err_email')); return }
    if (!password) { setError(t('account.err_password')); return }

    setLoading(true)
    try {
      // Passe par le backend (proxy) pour éviter les erreurs CORS
      const res = await api.post('/linked-account/login', {
        instance_url: base,
        email: email.trim(),
        password,
      })

      const { access_token, user } = res.data as {
        access_token: string
        user: { id: string; email: string; display_name: string | null; avatar_url: string | null }
      }

      add({
        id:           `${base}:${user.id}`,
        instance_url: base,
        user_id:      user.id,
        email:        user.email,
        display_name: user.display_name,
        avatar_url:   user.avatar_url,
        access_token,
        added_at:     new Date().toISOString(),
      })

      handleClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string }; status?: number } })?.response?.data?.message
      if (msg) {
        setError(msg)
      } else {
        setError(t('account.err_unreachable'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     w-full max-w-sm bg-white rounded-xl shadow-xl z-50 p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Cloud size={20} className="text-primary" strokeWidth={1.5} />
              <Dialog.Title className="text-base font-semibold text-text-primary">
                {t('account.add_title')}
              </Dialog.Title>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center rounded-full text-text-tertiary
                         hover:bg-surface-2 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label={t('account.instance_url')}
              type="url"
              value={instanceUrl}
              onChange={(e) => setInstanceUrl(e.target.value)}
              placeholder="https://cloud.exemple.com"
              autoFocus
              className="bg-surface-1"
            />

            <Input
              label={t('register.email_label')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="bg-surface-1"
            />

            <Input
              label={t('login.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-surface-1"
            />

            {error && (
              <div className="flex items-start gap-2 text-xs text-danger bg-danger-light px-3 py-2 rounded">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-1">
              <Button type="button" variant="ghost" onClick={handleClose}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" loading={loading}>
                {loading ? t('login.verifying') : t('login.submit')}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
