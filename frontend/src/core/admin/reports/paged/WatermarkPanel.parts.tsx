/**
 * The parts of `WatermarkPanel.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { Image as ImageIcon, Trash2, Type } from "lucide-react"
import { AnchoredPopover, Button, Input, RangeSlider } from "@ui"
import { NO_WATERMARK } from "./watermark"
import type { WatermarkPanel } from './WatermarkPanel'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
        {label}
      </span>
      {children}
    </label>
  )
}
export { Field }

export function Part1({ anchorRef, value, setOpen, summary }: { anchorRef: NonNullable<WatermarkPanel['anchorRef']>; value: NonNullable<WatermarkPanel['props']['value']>; setOpen: NonNullable<WatermarkPanel['setOpen']>; summary: NonNullable<WatermarkPanel['summary']> }) {
  return (
    <span ref={anchorRef} className="inline-flex">
            <Button
              variant="secondary"
              icon={value.kind === 'image' ? <ImageIcon size={15} /> : <Type size={15} />}
              onClick={() => setOpen(o => !o)}
            >
              <span className="max-w-32 truncate">{summary}</span>
            </Button>
          </span>
  )
}

export function Part2({ anchorRef, open, setOpen, t, kinds, set, value, fileRef, pick, value_image, error, onChange }: { anchorRef: NonNullable<WatermarkPanel['anchorRef']>; open: NonNullable<WatermarkPanel['open']>; setOpen: NonNullable<WatermarkPanel['setOpen']>; t: NonNullable<WatermarkPanel['tr']>; kinds: NonNullable<WatermarkPanel['kinds']>; set: WatermarkPanel['set']; value: NonNullable<WatermarkPanel['props']['value']>; fileRef: NonNullable<WatermarkPanel['fileRef']>; pick: WatermarkPanel['pick']; value_image: string; error: NonNullable<WatermarkPanel['error']>; onChange: NonNullable<WatermarkPanel['props']['onChange']> }) {
  return (
    <AnchoredPopover anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} align="right">
            {/* `no-print`: the popover is rendered in a PORTAL, outside the toolbar
                that the print stylesheet hides — left alone it came out on page 1
                of the report, sliders and all. */}
            <div className="no-print w-80 rounded-xl border border-border bg-surface-0 p-4 shadow-lg">
              <p className="mb-3 text-text-primary" style={{ fontSize: 'var(--kb-text-heading)' }}>
                {t('admin.rep_watermark')}
              </p>
    
              {/* ── What kind ── */}
              <div className="mb-3 flex gap-1 rounded-lg bg-surface-1 p-1">
                {kinds.map(k => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => set({ kind: k.id })}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 transition-colors ${
                      value.kind === k.id ? 'bg-surface-0 text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                    }`}
                    style={{ fontSize: 'var(--kb-text-body)' }}
                  >
                    {k.icon}
                    {k.label}
                  </button>
                ))}
              </div>
    
              {value.kind === 'text' && (
                <Input
                  value={value.text}
                  onChange={e => set({ text: e.currentTarget.value })}
                  placeholder={t('admin.rep_wm_text_hint')}
                  aria-label={t('admin.rep_wm_text')}
                  className="mb-3 w-full"
                  autoFocus
                />
              )}
    
              {value.kind === 'image' && (
                <div className="mb-3">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { void pick(e.currentTarget.files?.[0]); e.currentTarget.value = '' }}
                  />
                  {value.image ? (
                    <div className="flex items-center gap-3 rounded-lg border border-border p-2">
                      {/* The checkerboard is not decoration: a logo is usually
                          transparent, and on a white card it would look opaque. */}
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded"
                        style={{
                          backgroundImage:
                            'linear-gradient(45deg,#eee 25%,transparent 25%,transparent 75%,#eee 75%),' +
                            'linear-gradient(45deg,#eee 25%,transparent 25%,transparent 75%,#eee 75%)',
                          backgroundSize: '10px 10px',
                          backgroundPosition: '0 0, 5px 5px',
                        }}
                      >
                        <img src={value_image} alt="" className="max-h-12 max-w-12 object-contain" />
                      </span>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="text-primary hover:underline"
                        style={{ fontSize: 'var(--kb-text-body)' }}
                      >
                        {t('admin.rep_wm_replace')}
                      </button>
                      <button
                        type="button"
                        onClick={() => set({ image: null })}
                        className="ml-auto rounded p-1 text-text-tertiary hover:bg-surface-1 hover:text-danger"
                        title={t('admin.rep_wm_remove')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ) : (
                    <Button variant="secondary" icon={<ImageIcon size={15} />} onClick={() => fileRef.current?.click()}>
                      {t('admin.rep_wm_choose')}
                    </Button>
                  )}
                  {error && (
                    <p className="mt-2 text-danger" style={{ fontSize: 'var(--kb-text-meta)' }}>{error}</p>
                  )}
                </div>
              )}
    
              {value.kind !== 'none' && (
                <div className="space-y-3 border-t border-border pt-3">
                  <Field label={t('admin.rep_wm_size')}>
                    <RangeSlider
                      value={value.scale} min={0.2} max={2} step={0.05}
                      onChange={v => set({ scale: v })}
                      format={v => `${Math.round(v * 100)} %`}
                    />
                  </Field>
                  <Field label={t('admin.rep_wm_opacity')}>
                    <RangeSlider
                      value={value.opacity} min={0.02} max={0.6} step={0.01}
                      onChange={v => set({ opacity: v })}
                      format={v => `${Math.round(v * 100)} %`}
                    />
                  </Field>
                  <Field label={t('admin.rep_wm_angle')}>
                    <RangeSlider
                      value={value.angle} min={-90} max={90} step={1}
                      onChange={v => set({ angle: v })}
                      format={v => `${v}°`}
                    />
                  </Field>
                </div>
              )}
    
              <div className="mt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => onChange(NO_WATERMARK)}
                  className="text-text-secondary hover:text-danger"
                  style={{ fontSize: 'var(--kb-text-body)' }}
                >
                  {t('admin.rep_wm_reset')}
                </button>
                <Button variant="primary" onClick={() => setOpen(false)}>
                  {t('common.done', { defaultValue: 'Terminé' })}
                </Button>
              </div>
            </div>
          </AnchoredPopover>
  )
}
