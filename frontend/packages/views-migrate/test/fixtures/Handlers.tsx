/** Inline handlers: React's event type for an untyped parameter, and a handler given only under a condition. */
export function Handlers({ onDropFile, onOpen }: { onDropFile: (e: React.DragEvent<HTMLDivElement>) => void; onOpen?: (id: string) => void }) {
  return (
    <div onDrop={(e) => onDropFile(e)}>
      <button onClick={onOpen ? () => onOpen('a') : undefined}>open</button>
    </div>
  )
}
