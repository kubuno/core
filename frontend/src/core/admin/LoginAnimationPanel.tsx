import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Waves, RotateCcw } from 'lucide-react'
import { api } from '../api/client'
import { Button } from '@ui'
import LoginAnimationGL from '../auth/LoginAnimationGL'
import {
  animTuning, parseAnimParams, ANIM_DEFAULTS, ANIM_SLIDERS, type AnimParams,
} from '../auth/animTuning'

const SETTING_KEY = 'appearance.login_animation'

// Admin tuning of the login-page animation: live preview (same WebGL component
// as the login page) + sliders bound to the shared store, saved server-side in
// core.settings so every visitor gets the tuned values.
export default function LoginAnimationPanel() {
  const qc = useQueryClient()
  const [params, setParams] = useState<AnimParams>(animTuning.get())
  const [dirty, setDirty] = useState(false)

  // Seed the store from the saved server value on mount.
  const { data: saved } = useQuery({
    queryKey: ['admin', 'login-animation'],
    queryFn: () =>
      api.get<{ config: Record<string, unknown> }>('/config')
        .then((r) => parseAnimParams(r.data.config[SETTING_KEY])),
  })
  useEffect(() => {
    if (saved) { animTuning.set(saved); setDirty(false) }
  }, [saved])

  useEffect(() => animTuning.subscribe(() => setParams({ ...animTuning.get() })), [])

  const saveM = useMutation({
    mutationFn: () => api.patch('/admin/settings', { [SETTING_KEY]: animTuning.get() }),
    onSuccess: () => {
      setDirty(false)
      qc.invalidateQueries({ queryKey: ['public-config'] })
      qc.invalidateQueries({ queryKey: ['admin', 'login-animation'] })
    },
  })

  const onSlide = (key: keyof AnimParams, value: number) => {
    animTuning.set({ [key]: value })
    setDirty(true)
  }

  return (
    <div className="mt-10 max-w-3xl">
      <h2 className="text-lg font-medium flex items-center gap-2 mb-1">
        <Waves size={20} className="text-primary" /> Animation de la page de connexion
      </h2>
      <p className="text-sm text-text-secondary mb-4">
        Réglez le drapé animé en direct sur l'aperçu, puis enregistrez : les valeurs
        s'appliquent à tous les visiteurs de la page de connexion.
      </p>

      {/* Aperçu live — même composant WebGL que la page de connexion. */}
      <div
        className="relative w-full rounded-xl overflow-hidden border border-border mb-4"
        style={{ aspectRatio: '16/8', background: 'linear-gradient(160deg, #08174d 0%, #03091a 100%)' }}
      >
        <LoginAnimationGL />
        <span className="absolute top-3 left-3 text-xs text-white/50 select-none z-10">
          Aperçu — page de connexion
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-4">
        {ANIM_SLIDERS.map((s) => (
          <label key={s.key} className="block">
            <span className="flex justify-between text-xs text-text-secondary mb-1">
              <span>{s.label}</span>
              <span className="tabular-nums font-mono">
                {params[s.key].toFixed(s.step < 0.01 ? 4 : 2)}
                {params[s.key] !== ANIM_DEFAULTS[s.key] && <span className="text-primary"> •</span>}
              </span>
            </span>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={params[s.key]}
              onChange={(e) => onSlide(s.key, Number(e.target.value))}
              className="w-full h-1.5 accent-primary cursor-pointer"
            />
          </label>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={() => saveM.mutate()} loading={saveM.isPending} disabled={!dirty}>
          Enregistrer
        </Button>
        <Button
          variant="secondary"
          icon={<RotateCcw size={14} />}
          onClick={() => { animTuning.reset(); setDirty(true) }}
        >
          Valeurs par défaut
        </Button>
        {saveM.isSuccess && !dirty && (
          <span className="text-sm text-success">Enregistré — appliqué à la page de connexion.</span>
        )}
        {saveM.isError && (
          <span className="text-sm text-danger">Échec de l'enregistrement.</span>
        )}
      </div>
    </div>
  )
}
