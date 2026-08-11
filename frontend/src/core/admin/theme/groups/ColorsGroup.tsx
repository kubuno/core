function Swatch({ varName, label }: { varName: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-10 h-10 rounded-lg border border-border"
        style={{ background: `var(${varName})` }}
      />
      <span className="text-[10px] text-text-tertiary">{label}</span>
    </div>
  )
}

/** Raw palette of the previewed theme, read straight from its CSS variables. */
export default function ColorsGroup() {
  return (
    <div className="flex flex-wrap gap-3">
      <Swatch varName="--color-primary" label="primary" />
      <Swatch varName="--color-surface-0" label="surface" />
      <Swatch varName="--color-surface-2" label="surface-2" />
      <Swatch varName="--color-text-primary" label="texte" />
      <Swatch varName="--color-border" label="bordure" />
      <Swatch varName="--color-danger" label="danger" />
      <Swatch varName="--color-success" label="succès" />
      <Swatch varName="--color-warning" label="alerte" />
    </div>
  )
}
