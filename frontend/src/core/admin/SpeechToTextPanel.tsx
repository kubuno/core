import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Button, Dropdown, Spinner, Toggle, Textarea, RangeSlider } from '@ui'
import { Mic, MicOff, Download, Trash2, Check, AlertCircle, ChevronDown, SlidersHorizontal } from 'lucide-react'

// ── Catalog contract (mirrors stt module GET /admin/catalog) ──────────────────
interface VoskModel { id: string; lang: string; label: string; size_mb: number; url: string }
interface WhisperModel { id: string; label: string; size_mb: number; url: string }
interface LangCfg {
  engine: string
  model: string
  enabled: boolean
  initial_prompt: string
  grammar: string
  normalize_numbers: boolean
  punctuation: boolean
  translate: boolean
  beam_size: number
  auto_detect: boolean
}
interface GlobalSettings { silence_ms: number; sound_threshold: number; profanity_filter: boolean }
interface DownloadStatus { state: string; received: number; total: number; error?: string | null }
interface Catalog {
  enabled: boolean
  settings: GlobalSettings
  config: Record<string, Partial<LangCfg>>
  downloads: Record<string, DownloadStatus> // key = "engine/model"
  installed: { vosk: string[]; whisper: string[] }
  languages: { code: string; label: string }[]
  vosk: VoskModel[]
  whisper: WhisperModel[]
}

const fmtMb = (mb: number) => (mb >= 1000 ? `${(mb / 1000).toFixed(1)} Go` : `${mb} Mo`)

// Fill in defaults for any per-language field absent from the stored config.
function effective(c: Partial<LangCfg> | undefined): LangCfg {
  return {
    engine: c?.engine || 'vosk',
    model: c?.model || '',
    enabled: c?.enabled ?? true,
    initial_prompt: c?.initial_prompt ?? '',
    grammar: c?.grammar ?? '',
    normalize_numbers: c?.normalize_numbers ?? false,
    punctuation: c?.punctuation ?? true,
    translate: c?.translate ?? false,
    beam_size: c?.beam_size ?? 1,
    auto_detect: c?.auto_detect ?? false,
  }
}

export default function SpeechToTextPanel() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: cat, isLoading, isError } = useQuery({
    queryKey: ['stt-catalog'],
    queryFn: () => api.get<Catalog>('/stt/admin/catalog').then((r) => r.data),
    // Poll while any download is in flight so progress bars advance live.
    refetchInterval: (q) => {
      const c = q.state.data as Catalog | undefined
      const active = c && Object.values(c.downloads).some((d) => d.state === 'downloading')
      return active ? 1000 : false
    },
  })

  // Invalidate BOTH the admin catalog AND the public status the topbar SearchBar
  // reads, so changes here take effect live (no page refresh needed).
  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['stt-catalog'] })
    qc.invalidateQueries({ queryKey: ['stt-status'] })
  }

  const setConfig = useMutation({
    mutationFn: (v: { lang: string } & Partial<LangCfg>) =>
      api.post('/stt/admin/config', v).then((r) => r.data),
    onSuccess: invalidateAll,
  })
  const download = useMutation({
    mutationFn: (v: { engine: string; model: string }) =>
      api.post('/stt/admin/models/download', v).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stt-catalog'] }),
  })
  const remove = useMutation({
    mutationFn: (v: { engine: string; model: string }) =>
      api.delete(`/stt/admin/models/${v.engine}/${v.model}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stt-catalog'] }),
  })
  const setEnabled = useMutation({
    mutationFn: (enabled: boolean) =>
      api.post('/stt/admin/enabled', { enabled }).then((r) => r.data),
    onMutate: async (enabled) => {
      await qc.cancelQueries({ queryKey: ['stt-catalog'] })
      const prev = qc.getQueryData<Catalog>(['stt-catalog'])
      if (prev) qc.setQueryData<Catalog>(['stt-catalog'], { ...prev, enabled })
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(['stt-catalog'], ctx.prev) },
    onSettled: invalidateAll,
  })
  const setSettings = useMutation({
    mutationFn: (v: Partial<GlobalSettings>) =>
      api.post('/stt/admin/settings', v).then((r) => r.data),
    onSuccess: invalidateAll,
  })

  // Patch a single language field (backend merges).
  const patchLang = (lang: string, patch: Partial<LangCfg>) => setConfig.mutate({ lang, ...patch })

  const installedSet = useMemo(() => {
    const s = new Set<string>()
    cat?.installed.vosk.forEach((id) => s.add(`vosk/${id}`))
    cat?.installed.whisper.forEach((id) => s.add(`whisper/${id}`))
    return s
  }, [cat])

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>
  if (isError || !cat)
    return <p className="text-sm text-danger py-8">{t('admin.stt_load_error', { defaultValue: 'Impossible de charger le catalogue STT.' })}</p>

  // Models available for an (engine, lang) pair. Whisper is multilingual → all models.
  const modelsFor = (engine: string, lang: string): { id: string; label: string; size_mb: number }[] =>
    engine === 'whisper' ? cat.whisper : cat.vosk.filter((m) => m.lang === lang)

  const enabled = cat.enabled

  return (
    <div>
      <div className="flex items-start gap-3 mb-4 p-4 bg-primary-light/50 rounded-xl">
        <Mic size={20} className="text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-text-secondary">
          {t('admin.stt_intro', {
            defaultValue:
              'Choisissez pour chaque langue le moteur de reconnaissance vocale (Vosk, léger et en temps réel ; Whisper, plus précis) et le modèle à utiliser. Les modèles sont téléchargés localement et fonctionnent hors-ligne.',
          })}
        </p>
      </div>

      {/* Global on/off switch */}
      <div className="flex items-center justify-between mb-3 p-4 bg-white rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: enabled ? '#1a73e81a' : '#5f636814' }}>
            {enabled ? <Mic size={18} className="text-primary" /> : <MicOff size={18} className="text-text-tertiary" />}
          </span>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {t('admin.stt_enable_title', { defaultValue: 'Reconnaissance vocale' })}
            </p>
            <p className="text-xs text-text-tertiary">
              {enabled
                ? t('admin.stt_enable_on', { defaultValue: 'Activée — le bouton micro est disponible dans la barre de recherche.' })
                : t('admin.stt_enable_off', { defaultValue: 'Désactivée — le bouton micro est masqué pour tous les utilisateurs.' })}
            </p>
          </div>
        </div>
        <Toggle checked={enabled} onChange={(e) => setEnabled.mutate(e.target.checked)} disabled={setEnabled.isPending} />
      </div>

      {/* Global capture/output settings */}
      <GlobalSettingsCard
        settings={cat.settings}
        disabled={!enabled}
        onSave={(patch) => setSettings.mutate(patch)}
      />

      <div className={`space-y-3 mt-6 transition-opacity ${enabled ? '' : 'opacity-50 pointer-events-none select-none'}`}
           aria-disabled={!enabled}>
        {cat.languages.map((lang, idx) => {
          const cfg = effective(cat.config[lang.code])
          const engine = cfg.engine
          const models = modelsFor(engine, lang.code)
          const model = cfg.model || models[0]?.id || ''
          const dlKey = `${engine}/${model}`
          const dl = cat.downloads[dlKey]
          const isInstalled = installedSet.has(dlKey)
          const isDownloading = dl?.state === 'downloading'
          const hasError = dl?.state === 'error'
          const isOpen = expanded === lang.code

          return (
            <div key={lang.code}
                 className={`rounded-xl border border-border p-4 ${idx % 2 === 1 ? 'bg-surface-1' : 'bg-white'} ${cfg.enabled ? '' : 'opacity-60'}`}>
              <div className="flex items-center gap-4 flex-wrap">
                {/* Name + per-language enable */}
                <div className="w-40 shrink-0 flex items-center gap-2.5">
                  <Toggle
                    checked={cfg.enabled}
                    onChange={(e) => patchLang(lang.code, { enabled: e.target.checked })}
                    aria-label={t('admin.stt_lang_enabled', { defaultValue: 'Langue activée' })}
                  />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{lang.label}</p>
                    <p className="text-xs text-text-tertiary uppercase">{lang.code}</p>
                  </div>
                </div>

                {/* Engine */}
                <div className="w-36">
                  <label className="text-xs text-text-tertiary block mb-1">
                    {t('admin.stt_engine', { defaultValue: 'Moteur' })}
                  </label>
                  <Dropdown
                    width="100%"
                    value={engine}
                    onChange={(v) => {
                      const first = modelsFor(v, lang.code)[0]?.id ?? ''
                      patchLang(lang.code, { engine: v, model: first })
                    }}
                    options={[{ value: 'vosk', label: 'Vosk' }, { value: 'whisper', label: 'Whisper' }]}
                  />
                </div>

                {/* Model */}
                <div className="flex-1 min-w-44">
                  <label className="text-xs text-text-tertiary block mb-1">
                    {t('admin.stt_model', { defaultValue: 'Modèle' })}
                  </label>
                  {models.length === 0 ? (
                    <p className="text-sm text-text-tertiary py-2">
                      {t('admin.stt_no_model', { defaultValue: 'Aucun modèle pour cette langue.' })}
                    </p>
                  ) : (
                    <Dropdown
                      width="100%"
                      value={model}
                      onChange={(v) => patchLang(lang.code, { model: v })}
                      options={models.map((m) => ({
                        value: m.id,
                        label: `${m.label} · ${fmtMb(m.size_mb)}${installedSet.has(`${engine}/${m.id}`) ? ' ✓' : ''}`,
                      }))}
                    />
                  )}
                </div>

                {/* Download / delete action */}
                <div className="shrink-0 self-end">
                  {!model ? null : isInstalled ? (
                    <Button variant="ghost" onClick={() => remove.mutate({ engine, model })} disabled={remove.isPending}
                            title={t('admin.stt_delete', { defaultValue: 'Supprimer le téléchargement' })}>
                      <Trash2 size={16} className="text-danger" />
                    </Button>
                  ) : isDownloading ? (
                    <div className="flex items-center gap-2 text-xs text-text-secondary w-40">
                      <Spinner size="sm" />
                      <span>{dl.total > 0 ? `${Math.round((dl.received / dl.total) * 100)}%`
                        : t('admin.stt_downloading', { defaultValue: 'Téléchargement…' })}</span>
                    </div>
                  ) : (
                    <Button variant="secondary" onClick={() => download.mutate({ engine, model })} disabled={download.isPending}>
                      <Download size={16} className="mr-1.5" />
                      {t('admin.stt_download', { defaultValue: 'Télécharger' })}
                    </Button>
                  )}
                </div>

                {/* Advanced toggle */}
                <button type="button" onClick={() => setExpanded(isOpen ? null : lang.code)}
                        className="shrink-0 self-end h-9 px-2.5 rounded-lg flex items-center gap-1.5 text-xs text-text-secondary hover:bg-surface-2 transition-colors"
                        title={t('admin.stt_advanced', { defaultValue: 'Options avancées' })}>
                  <SlidersHorizontal size={14} />
                  <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Status line */}
              {isInstalled && (
                <p className="text-xs text-success mt-2 flex items-center gap-1">
                  <Check size={13} /> {t('admin.stt_installed', { defaultValue: 'Modèle installé et prêt.' })}
                </p>
              )}
              {hasError && (
                <p className="text-xs text-danger mt-2 flex items-center gap-1">
                  <AlertCircle size={13} /> {dl?.error || t('admin.stt_dl_error', { defaultValue: 'Échec du téléchargement.' })}
                </p>
              )}
              {isDownloading && dl.total > 0 && (
                <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden mt-2">
                  <div className="h-full rounded-full bg-primary transition-all"
                       style={{ width: `${Math.round((dl.received / dl.total) * 100)}%` }} />
                </div>
              )}

              {/* Advanced per-language options */}
              {isOpen && (
                <AdvancedOptions
                  key={`${lang.code}-${engine}`}
                  cfg={cfg}
                  onPatch={(patch) => patchLang(lang.code, patch)}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Global settings (debounced sliders) ───────────────────────────────────────
function GlobalSettingsCard({
  settings, disabled, onSave,
}: { settings: GlobalSettings; disabled: boolean; onSave: (p: Partial<GlobalSettings>) => void }) {
  const { t } = useTranslation()
  const [silence, setSilence] = useState(settings.silence_ms)
  const [threshold, setThreshold] = useState(settings.sound_threshold)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep local sliders in sync when the server value changes elsewhere.
  useEffect(() => { setSilence(settings.silence_ms) }, [settings.silence_ms])
  useEffect(() => { setThreshold(settings.sound_threshold) }, [settings.sound_threshold])

  const debouncedSave = (patch: Partial<GlobalSettings>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => onSave(patch), 350)
  }
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

  return (
    <div className={`bg-white rounded-xl border border-border p-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <h3 className="text-sm font-medium text-text-primary mb-4">
        {t('admin.stt_global_settings', { defaultValue: 'Réglages généraux' })}
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
        <div>
          <label className="text-xs text-text-secondary block mb-1.5">
            {t('admin.stt_silence', { defaultValue: 'Arrêt automatique après un silence' })}
          </label>
          <RangeSlider
            variant="boxed" min={500} max={10000} step={250}
            value={silence}
            onChange={(v: number) => { setSilence(v); debouncedSave({ silence_ms: v }) }}
            format={(v: number) => `${(v / 1000).toFixed(1)} s`}
            minLabel="0,5 s" maxLabel="10 s"
          />
        </div>
        <div>
          <label className="text-xs text-text-secondary block mb-1.5">
            {t('admin.stt_threshold', { defaultValue: 'Sensibilité du micro (seuil de son)' })}
          </label>
          <RangeSlider
            variant="boxed" min={0} max={0.3} step={0.005}
            value={threshold}
            onChange={(v: number) => { setThreshold(v); debouncedSave({ sound_threshold: v }) }}
            format={(v: number) => v.toFixed(3)}
            minLabel="0" maxLabel="0,3"
          />
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div>
          <p className="text-sm text-text-primary">{t('admin.stt_profanity', { defaultValue: 'Filtrer les grossièretés' })}</p>
          <p className="text-xs text-text-tertiary">
            {t('admin.stt_profanity_hint', { defaultValue: 'Masque les mots vulgaires dans les transcriptions (fr/en).' })}
          </p>
        </div>
        <Toggle checked={settings.profanity_filter} onChange={(e) => onSave({ profanity_filter: e.target.checked })} />
      </div>
    </div>
  )
}

// ── Per-language advanced options ─────────────────────────────────────────────
function AdvancedOptions({ cfg, onPatch }: { cfg: LangCfg; onPatch: (p: Partial<LangCfg>) => void }) {
  const { t } = useTranslation()
  const isWhisper = cfg.engine === 'whisper'
  // Text fields commit on blur (avoid a request per keystroke).
  const [prompt, setPrompt] = useState(cfg.initial_prompt)
  const [grammar, setGrammar] = useState(cfg.grammar)

  const Row = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="text-sm text-text-primary">{title}</p>
        {hint && <p className="text-xs text-text-tertiary">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-1">
      <Row title={t('admin.stt_normalize', { defaultValue: 'Normaliser les nombres' })}
           hint={t('admin.stt_normalize_hint', { defaultValue: '« vingt-trois » → « 23 » (fr/en/es/de/it).' })}>
        <Toggle checked={cfg.normalize_numbers} onChange={(e) => onPatch({ normalize_numbers: e.target.checked })} />
      </Row>

      <Row title={t('admin.stt_punctuation', { defaultValue: 'Ponctuation automatique' })}
           hint={isWhisper
             ? t('admin.stt_punctuation_hint_w', { defaultValue: 'Conserve la ponctuation produite par Whisper.' })
             : t('admin.stt_punctuation_hint_v', { defaultValue: 'Vosk ne produit pas de ponctuation ; sans effet.' })}>
        <Toggle checked={cfg.punctuation} onChange={(e) => onPatch({ punctuation: e.target.checked })} />
      </Row>

      {isWhisper && (
        <>
          <Row title={t('admin.stt_translate', { defaultValue: 'Traduire en anglais' })}
               hint={t('admin.stt_translate_hint', { defaultValue: 'La dictée est restituée traduite en anglais.' })}>
            <Toggle checked={cfg.translate} onChange={(e) => onPatch({ translate: e.target.checked })} />
          </Row>

          <Row title={t('admin.stt_autodetect', { defaultValue: 'Détection automatique de la langue' })}
               hint={t('admin.stt_autodetect_hint', { defaultValue: 'Whisper devine la langue parlée.' })}>
            <Toggle checked={cfg.auto_detect} onChange={(e) => onPatch({ auto_detect: e.target.checked })} />
          </Row>

          <Row title={t('admin.stt_quality', { defaultValue: 'Qualité de reconnaissance' })}
               hint={t('admin.stt_quality_hint', { defaultValue: 'Plus précis = plus lent (recherche en faisceau).' })}>
            <Dropdown
              width="170px"
              value={String(cfg.beam_size)}
              onChange={(v) => onPatch({ beam_size: Number(v) })}
              options={[
                { value: '1', label: t('admin.stt_quality_fast', { defaultValue: 'Rapide (greedy)' }) },
                { value: '5', label: t('admin.stt_quality_accurate', { defaultValue: 'Précis (faisceau 5)' }) },
                { value: '8', label: t('admin.stt_quality_max', { defaultValue: 'Maximum (faisceau 8)' }) },
              ]}
            />
          </Row>

          <div className="py-2">
            <p className="text-sm text-text-primary mb-1.5">{t('admin.stt_prompt', { defaultValue: 'Vocabulaire / prompt initial' })}</p>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onBlur={() => { if (prompt !== cfg.initial_prompt) onPatch({ initial_prompt: prompt }) }}
              className="min-h-[64px] text-sm"
              placeholder={t('admin.stt_prompt_ph', { defaultValue: 'Noms propres, jargon… ex. : Kubuno, Drive, AGPLv3' })}
            />
            <p className="text-xs text-text-tertiary mt-1">
              {t('admin.stt_prompt_hint', { defaultValue: 'Oriente Whisper vers ce vocabulaire et son orthographe.' })}
            </p>
          </div>
        </>
      )}

      {!isWhisper && (
        <div className="py-2">
          <p className="text-sm text-text-primary mb-1.5">{t('admin.stt_grammar', { defaultValue: 'Grammaire / liste de mots' })}</p>
          <Textarea
            value={grammar}
            onChange={(e) => setGrammar(e.target.value)}
            onBlur={() => { if (grammar !== cfg.grammar) onPatch({ grammar }) }}
            className="min-h-[64px] text-sm"
            placeholder={t('admin.stt_grammar_ph', { defaultValue: 'Mots attendus, séparés par des virgules. Vide = reconnaissance libre.' })}
          />
          <p className="text-xs text-text-tertiary mt-1">
            {t('admin.stt_grammar_hint', { defaultValue: 'Restreint Vosk à ces mots — précision maximale pour des commandes courtes.' })}
          </p>
        </div>
      )}
    </div>
  )
}
