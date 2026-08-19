import {
  Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Minus, MoreVertical, Plus, Printer, RotateCw } from 'lucide-react'
import { MenuDropdown, useMenuDropdown } from '@ui'
import type { MenuItem } from '@ui'
import { geometry, MM, SHEET_GAP, SHEET_PAD, SHEET_PAD_X } from './geometry'
import { paginate } from './paginate'
import type { Metrics, TableMetrics } from './paginate'
import TableFragment from './TableFragment'
import type { FlowItem, Sheet } from './types'
import type { Orientation, PageGeometry, PaperFormat } from './geometry'
import { stampUrl } from './watermark'
import type { WatermarkSpec } from './watermark'

/**
 * The report, laid out on sheets — on screen exactly as it comes out of the
 * printer.
 *
 * ## Why the console paginates rather than the browser
 *
 * Handing a long page to `window.print()` means the cut is decided by the
 * engine, after the operator has clicked, out of sight. The consequences were
 * real and were reported: tables split under a running footer, headings alone
 * at the foot of a sheet, and no way to state "page 2 sur 4" — the CSS that
 * would print a page counter (`@page { @bottom-center { content: counter(page) }}`)
 * is not implemented in this engine.
 *
 * So the layout happens here, in two passes:
 *
 *   1. **Measure.** Every block is rendered once, off-screen, at the exact width
 *      of the paper's content box, and its height read from the DOM — for a
 *      table, row by row. Twice, in fact: once portrait, once landscape, because
 *      a row is not the same height at 180 mm and at 267 mm.
 *   2. **Cut.** `paginate()` fills sheets with those heights and returns which
 *      rows land where.
 *
 * What the operator then sees is not a preview OF the print: it IS the print.
 * The same `Sheet[]` draws the screen and the paper, so a cut that looks wrong
 * is fixed before printing rather than discovered on it — by turning one sheet,
 * by turning the document, or by taking the cover off.
 *
 * ## The parts around the paper
 *
 *   • a rail of thumbnails, right, for a document nobody scrolls through twice;
 *   • a floating bar for the page counter, the zoom and the printer;
 *   • a control above each sheet that turns THAT sheet.
 *
 * All three are `no-print`: they are the tools around the document, not the
 * document.
 */

/**
 * Width of a thumbnail, in pixels — the same 104 as the drive viewer's rail
 * (`FilePreviewOverlay.tsx`), so a page list looks like a page list wherever the
 * product shows one. The rail itself is 150 there; here it is that plus the
 * padding, since the admin panel has no dark gutter to sit in.
 */
const THUMB_W = 104
const RAIL_W  = 150

export default function PagedPreview({
  items, format, orientation, cover, footer, revision, watermark, onToggleCover, onOrientation,
  bandHeight = 0,
}: {
  items:       FlowItem[]
  format:      PaperFormat
  /** The document's default. Individual sheets may be turned against it. */
  orientation: Orientation
  /** Front sheet, when the operator asked for one. Never numbered. */
  cover?:      React.ReactNode
  /** Running footer. `page`/`total` count every sheet, cover included. */
  footer:      (page: number, total: number) => React.ReactNode
  /** Changes when the document's CONTENT does, forcing a fresh measurement. */
  revision:    string
  /** The stamp across every sheet — text or picture. See `watermark.ts`. */
  watermark?:  WatermarkSpec
  /** Toggling the cover from the sheet's own context menu. */
  onToggleCover?: () => void
  /** Turning the WHOLE document from the same menu. */
  onOrientation?: (o: Orientation) => void
  /**
   * Height of the frozen band above the preview (breadcrumb + toolbar).
   *
   * The rail of thumbnails is pinned too — a page list that scrolls away with
   * the pages is a page list you have to leave the page to reach. It pins
   * DIRECTLY under the band: a sticky top is measured from the scrolling
   * ancestor's padding box (24 px here), hence the offset.
   */
  bandHeight?: number
}) {
  const { t } = useTranslation()
  const measureRef = useRef<HTMLDivElement>(null)
  const footerRef  = useRef<HTMLDivElement>(null)
  const frameRef   = useRef<HTMLDivElement>(null)
  const sheetRefs  = useRef<(HTMLElement | null)[]>([])

  const [sheets, setSheets] = useState<Sheet[]>([])
  /** Pinned column widths per orientation, then per table item — see `TableFragment`. */
  const [cols, setCols] = useState<Record<Orientation, Record<string, number[]>>>({
    portrait: {}, landscape: {},
  })
  /** Sheets turned against the document's default, by index (cover excluded). */
  const [flips, setFlips] = useState<Record<number, Orientation>>({})
  /** `null` = fit to the panel. A number is what the operator asked for. */
  const [zoomWanted, setZoomWanted] = useState<number | null>(null)
  const [fitZoom, setFitZoom] = useState(1)
  const [active, setActive] = useState(1)

  // Turning the whole document, changing the paper or changing the figures
  // makes per-sheet decisions meaningless: "the third sheet" is no longer the
  // same third sheet. Clearing them is the honest answer, and the alternative —
  // silently keeping a landscape flag on unrelated content — is not.
  useEffect(() => { setFlips({}) }, [orientation, format, revision])

  const orientOf = useCallback(
    (index: number): Orientation => flips[index] ?? orientation,
    [flips, orientation],
  )

  /** Geometry of both orientations, footer reserve included. Filled by `layout`. */
  const geos = useRef<Record<Orientation, PageGeometry>>({
    portrait:  geometry(format, 'portrait', 0),
    landscape: geometry(format, 'landscape', 0),
  })
  // Kept in a ref AND mirrored in state: the render needs the sizes, the
  // measuring pass writes them.
  const [geoTick, setGeoTick] = useState(0)

  /** Read the off-screen render at one width, and pin the table columns. */
  const measureAt = useCallback((root: HTMLElement, widthPx: number) => {
    root.style.width = `${widthPx}px`
    const metrics: Metrics = {}
    const widths: Record<string, number[]> = {}

    for (const item of items) {
      const el = root.querySelector<HTMLElement>(`[data-m="${CSS.escape(item.id)}"]`)
      if (!el) continue

      if (item.kind === 'atom') {
        metrics[item.id] = { height: el.getBoundingClientRect().height }
        continue
      }

      const block = el.querySelector<HTMLElement>('[data-paged-block]')
      const table = el.querySelector<HTMLElement>('[data-paged-table]')
      const head  = el.querySelector<HTMLElement>('[data-paged-head]')
      const body  = el.querySelector<HTMLElement>('[data-paged-body]')
      const foot  = el.querySelector<HTMLElement>('[data-paged-foot]')
      const note  = el.querySelector<HTMLElement>('[data-paged-note]')
      if (!block || !table || !head || !body) continue

      // ── Two readings, in this order, and the order is the point ────────────
      // First the columns lay themselves out from ALL the rows; those widths are
      // then PINNED on the table, and only after that are the row heights read.
      // Measuring rows under free columns and printing them under pinned ones
      // would be measuring a different table from the one that prints.
      const cw = Array.from(head.querySelectorAll('th, td'))
        .map(c => c.getBoundingClientRect().width)

      const colgroup = document.createElement('colgroup')
      for (const w of cw) {
        const col = document.createElement('col')
        col.style.width = `${w}px`
        colgroup.appendChild(col)
      }
      table.insertBefore(colgroup, table.firstChild)
      const freeLayout = table.style.tableLayout
      table.style.tableLayout = 'fixed'

      const b  = block.getBoundingClientRect()
      const tb = table.getBoundingClientRect()
      // The note carries a top margin; measuring from the table's bottom edge
      // takes margin and box together, which is what the cut has to account for.
      const noteH = note ? note.getBoundingClientRect().bottom - tb.bottom : 0

      const m: TableMetrics = {
        chromeTop:    tb.top - b.top,
        chromeBottom: b.bottom - (note ? note.getBoundingClientRect().bottom : tb.bottom),
        head:         head.getBoundingClientRect().height,
        foot:         foot ? foot.getBoundingClientRect().height : 0,
        note:         noteH,
        rows:         Array.from(body.children).map(r => r.getBoundingClientRect().height),
      }
      metrics[item.id] = m
      widths[item.id]  = cw

      // The measuring subtree is React's; hand it back as it was found.
      table.removeChild(colgroup)
      table.style.tableLayout = freeLayout
    }

    return { metrics, widths }
  }, [items])

  const layout = useCallback(() => {
    const root = measureRef.current
    if (!root) return

    // Height AND top margin: `getBoundingClientRect` returns the box alone, and
    // the footer's `margin-top` is 4 mm of the sheet the content will not get.
    // Reading only the box left the last sheet of a packed report six
    // millimetres over the edge — the exact defect this component exists to make
    // impossible.
    const footEl   = footerRef.current?.firstElementChild as HTMLElement | null
    const footerPx = footEl
      ? footEl.getBoundingClientRect().height + parseFloat(getComputedStyle(footEl).marginTop || '0')
      : 0

    const g: Record<Orientation, PageGeometry> = {
      portrait:  geometry(format, 'portrait',  footerPx),
      landscape: geometry(format, 'landscape', footerPx),
    }
    geos.current = g
    setGeoTick(k => k + 1)

    const p = measureAt(root, g.portrait.contentWidthPx)
    const l = measureAt(root, g.landscape.contentWidthPx)
    const packs = { portrait: p, landscape: l }

    setCols({ portrait: p.widths, landscape: l.widths })
    setSheets(paginate(items, index => {
      const o = flips[index] ?? orientation
      return { height: g[o].contentHeightPx, metrics: packs[o].metrics }
    }))
    // `items` is rebuilt on every render by design (it holds React nodes); the
    // revision string is what says the document changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision, format, orientation, flips, measureAt])

  useLayoutEffect(() => { layout() }, [layout])

  // Web fonts land after the first paint and change every height on the page.
  // Measuring before they do would cut the document for a font nobody sees.
  useEffect(() => {
    let alive = true
    document.fonts?.ready.then(() => { if (alive) layout() })
    return () => { alive = false }
  }, [layout])

  const total     = sheets.length + (cover ? 1 : 0)
  /** Orientation of the very first sheet — the page context the document opens in. */
  const firstOrientation: Orientation = cover ? orientation : orientOf(0)
  const widestMm  = Math.max(
    ...(cover ? [geos.current[orientation].widthMm] : []),
    ...sheets.map((_, i) => geos.current[orientOf(i)].widthMm),
    geos.current[orientation].widthMm,
  )

  // The sheet is a fixed number of millimetres wide; the panel it sits in is
  // not, so on a narrow window the stack is scaled down to fit.
  //
  // `transform`, NOT `zoom`. `zoom` re-runs layout at the reduced size: text
  // that fitted a cell at 100 % wraps at 94 %, rows grow, and the sheet
  // overflows the cut computed from an unscaled measurement (seen on landscape
  // A4: two millimetres over, on three sheets out of six). A transform scales
  // the painted result and changes no layout at all, so what is measured, what
  // is shown and what is printed stay the same document.
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const fit = () => {
      // Minus the gutters: they are inside the frame, and a sheet scaled to the
      // frame's full width would sit under the controls that live in them.
      const avail = frame.clientWidth - 2 * SHEET_PAD_X
      const wide  = widestMm * MM
      setFitZoom(avail > 0 && wide > avail ? avail / wide : 1)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(frame)
    return () => ro.disconnect()
  }, [widestMm, geoTick])

  const zoom = zoomWanted ?? fitZoom

  // Ctrl/⌘ + wheel zooms the SHEETS, the gesture everybody already knows from a
  // PDF viewer. Registered by hand rather than through `onWheel` because React
  // attaches wheel listeners passively at the root, and a passive listener may
  // not `preventDefault()` — without which the browser zooms the whole console
  // instead, chrome, sidebar and all.
  //
  // Multiplicative steps, not additive: from 30 % a fixed 10-point step is a
  // third of the document at a time, from 200 % it is nothing.
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const step = e.deltaY > 0 ? 1 / 1.12 : 1.12
      setZoomWanted(z => {
        const next = (z ?? fitZoom) * step
        return Math.min(3, Math.max(0.25, Math.round(next * 100) / 100))
      })
    }
    frame.addEventListener('wheel', onWheel, { passive: false })
    return () => frame.removeEventListener('wheel', onWheel)
  }, [fitZoom])

  /** Painted height of the stack — computed, not measured: every size is ours. */
  const stackPx = useMemo(() => {
    const heights = [
      ...(cover ? [geos.current[orientation].heightMm] : []),
      ...sheets.map((_, i) => geos.current[orientOf(i)].heightMm),
    ]
    return heights.reduce((a, h) => a + h * MM, 0)
      + Math.max(0, heights.length - 1) * SHEET_GAP
      + 2 * SHEET_PAD
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheets, cover, orientation, orientOf, geoTick])

  // Which sheet the operator is looking at — for the page counter and for the
  // thumbnail that lights up. The most visible one wins, so a sheet straddling
  // the fold does not flicker between two numbers.
  useEffect(() => {
    const els = sheetRefs.current.filter(Boolean) as HTMLElement[]
    if (els.length === 0) return
    const seen = new Map<Element, number>()
    const io = new IntersectionObserver(entries => {
      for (const e of entries) seen.set(e.target, e.intersectionRatio)
      let best = -1, bestI = 1
      els.forEach((el, i) => {
        const r = seen.get(el) ?? 0
        if (r > best) { best = r; bestI = i + 1 }
      })
      setActive(bestI)
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [sheets.length, cover])

  const goTo = (page: number) => {
    const el = sheetRefs.current[page - 1]
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const menu = useMenuDropdown()
  /** The sheet the menu was opened on, so "this sheet" means something. */
  const [menuSheet, setMenuSheet] = useState<number | null>(null)

  const menuItems: MenuItem[] = useMemo(() => {
    const s = menuSheet
    const o = s === null ? orientation : orientOf(s)
    const rows: MenuItem[] = [
      { type: 'label', text: t('admin.rep_menu_sheet', { page: (s ?? 0) + 1 + (cover ? 1 : 0) }) },
      {
        type: 'action', label: t(o === 'portrait' ? 'admin.rep_landscape' : 'admin.rep_portrait'),
        icon: <RotateCw size={14} />, disabled: s === null,
        onClick: () => { if (s !== null) setFlips(f => ({ ...f, [s]: o === 'portrait' ? 'landscape' : 'portrait' })) },
      },
      { type: 'separator' },
      {
        type: 'submenu', label: t('admin.rep_menu_document'),
        items: [
          { type: 'action', label: t('admin.rep_portrait'),  checked: orientation === 'portrait',
            onClick: () => onOrientation?.('portrait') },
          { type: 'action', label: t('admin.rep_landscape'), checked: orientation === 'landscape',
            onClick: () => onOrientation?.('landscape') },
          { type: 'separator' },
          { type: 'action', label: t('admin.rep_cover'), checked: !!cover, onClick: () => onToggleCover?.() },
        ],
      },
      { type: 'separator' },
      { type: 'action', label: t('admin.rep_zoom_in'),  icon: <Plus size={14} />,
        onClick: () => setZoomWanted(z => Math.min(3, Math.round(((z ?? fitZoom) + 0.1) * 100) / 100)) },
      { type: 'action', label: t('admin.rep_zoom_out'), icon: <Minus size={14} />,
        onClick: () => setZoomWanted(z => Math.max(0.25, Math.round(((z ?? fitZoom) - 0.1) * 100) / 100)) },
      { type: 'action', label: t('admin.rep_fit'), onClick: () => setZoomWanted(null) },
      { type: 'separator' },
      { type: 'action', label: t('admin.rep_print'), icon: <Printer size={14} />, onClick: () => window.print() },
    ]
    return rows
  }, [menuSheet, orientation, orientOf, cover, fitZoom, onOrientation, onToggleCover, t])

  const byId = new Map(items.map(i => [i.id, i]))

  /** The content of one sheet — drawn identically at full size and as a thumbnail. */
  const sheetContent = (sheet: Sheet, index: number) => (
    <div data-sheet-body>
      <div data-sheet-content>
        {sheet.placements.map((p, k) => {
          const item = byId.get(p.id)
          if (!item) return null
          if (p.kind === 'atom' || item.kind === 'atom') {
            // No wrapper: the blocks carry their own top margin, and an extra
            // box would either eat it or add to it — either way the sheet would
            // no longer match what was measured.
            return <Fragment key={k}>{item.kind === 'atom' ? item.node : null}</Fragment>
          }
          return (
            <TableFragment
              key={k}
              item={item}
              slice={{ from: p.from, to: p.to, continued: p.continued, last: p.last }}
              widths={cols[orientOf(index)][p.id]}
            />
          )
        })}
      </div>
      <div data-sheet-footer>{footer(index + 1 + (cover ? 1 : 0), total)}</div>
    </div>
  )

  // One URL per ORIENTATION, not per sheet: the SVG depends only on the paper,
  // and an inlined picture repeated on twenty-two `style` attributes would be
  // twenty-two copies of it in the DOM. The sheets read it from a custom
  // property set once on their container (`index.css` wires the two together).
  const stamps = useMemo(() => ({
    portrait:  watermark ? stampUrl(geos.current.portrait,  watermark) : undefined,
    landscape: watermark ? stampUrl(geos.current.landscape, watermark) : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [watermark, geoTick, format])

  const stampVars = {
    ['--kb-stamp-p' as string]: stamps.portrait  ?? 'none',
    ['--kb-stamp-l' as string]: stamps.landscape ?? 'none',
  } as React.CSSProperties

  const styleOf = (g: PageGeometry): React.CSSProperties => ({
    width:   `${g.widthMm}mm`,
    height:  `${g.heightMm}mm`,
    padding: `${g.marginMm}mm`,
  })

  /**
   * One page as a thumbnail — laid out like the drive viewer's rail: the number
   * ABOVE the page, the page a white card held by a ring rather than a border,
   * and the current one ringed in the accent colour.
   */
  const thumb = (page: number, g: PageGeometry, body: React.ReactNode, o: Orientation) => {
    const k = THUMB_W / (g.widthMm * MM)
    const on = active === page
    return (
      <div key={page} className="flex flex-col items-center gap-1">
        <span
          className={on ? 'text-primary' : 'text-text-tertiary'}
          style={{ fontSize: 'var(--kb-text-micro)' }}
        >
          {page}
        </span>
        <button
          type="button"
          onClick={() => goTo(page)}
          aria-current={on}
          className={`overflow-hidden rounded-md bg-white transition-shadow ${
            on ? 'ring-2 ring-primary' : 'ring-1 ring-border hover:ring-border-strong'
          }`}
          style={{ width: THUMB_W, height: g.heightMm * MM * k }}
        >
          {/* The sheet at true size, painted at `k`. Rendering the real thing
              rather than a placeholder is the point of a thumbnail rail: the
              operator recognises the page they want by its shape. */}
          <span
            data-admin-report
            data-sheet-face
            data-o={o}
            className="block origin-top-left"
            style={{ ...styleOf(g), transform: `scale(${k})`, display: 'block' }}
          >
            {body}
          </span>
        </button>
      </div>
    )
  }

  return (
    <>
      {/* The paper the browser is told to use, written from the same geometry
          the sheets are drawn with so the two cannot disagree.

          A mixed-orientation document has no single `@page size`: the sheets
          carry their own dimensions and the page box is told to follow them
          (`size: auto`), which is what lets sheet 3 come out landscape between
          two portrait ones.

          The half-millimetre off the printed height is not a fudge, it is the
          rounding: the engine's page box lands a fraction under the requested
          size (a proof of a four-sheet report came out on SIX pages, every other
          one a sliver of the sheet before it). Half a millimetre of slack
          absorbs it, and is invisible. */}
      <style>{`
        @page kb-portrait  { size: ${geos.current.portrait.widthMm}mm ${geos.current.portrait.heightMm}mm;  margin: 0; }
        @page kb-landscape { size: ${geos.current.landscape.widthMm}mm ${geos.current.landscape.heightMm}mm; margin: 0; }
        @page { size: ${geos.current[firstOrientation].widthMm}mm ${geos.current[firstOrientation].heightMm}mm; margin: 0; }
        @media print {
          /* The document STARTS in the first sheet's page context. Without this
             the root carries the unnamed page, the first sheet switches context,
             and switching forces a break — a blank sheet ahead of page 1, in the
             browser's default paper. Seen on a proof: five pages for four. */
          html, body { page: kb-${firstOrientation}; }
          [data-sheet][data-o="portrait"]  { page: kb-portrait; }
          [data-sheet][data-o="landscape"] { page: kb-landscape; }
          [data-sheet] { height: calc(var(--sheet-h) - 0.5mm) !important; }
        }
      `}</style>

      {/* ── Measuring pass. Laid out (so it has heights) but never shown, and
          never printed. Outside the scaled stack: a scaled measurement would cut
          the document for a paper size nobody asked for. ── */}
      <div className="no-print" aria-hidden style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <div ref={measureRef} data-admin-report data-paged-measure>
          {items.map(item => (
            <div key={item.id} data-m={item.id} style={{ display: 'flow-root' }}>
              {item.kind === 'atom' ? item.node : <TableFragment item={item} />}
            </div>
          ))}
        </div>
        <div ref={footerRef}>
          <div data-sheet-footer>{footer(1, 1)}</div>
        </div>
      </div>

      <div className="flex items-start gap-4">
        {/* ── The sheets ── */}
        <div
          ref={frameRef}
          data-sheets-frame
          className="min-w-0 flex-1"
          // The clamp exists only because a `transform` paints smaller without
          // shrinking its box. It is undone in print (`index.css`): a box with a
          // fixed height and `overflow: hidden` is monolithic to the paged
          // engine, which answered with a blank leading page.
          style={zoom !== 1 ? { height: stackPx * zoom, overflow: 'hidden' } : undefined}
        >
          <div
            data-sheets
            style={{
              ...stampVars,
              ...(zoom !== 1 ? { transform: `scale(${zoom})`, transformOrigin: 'top center' } : {}),
            }}
          >
            {cover && (
              <section
                data-sheet
                data-admin-report
                data-o={orientation}
                onContextMenu={e => { e.preventDefault(); setMenuSheet(null); menu.openAt(e.clientX, e.clientY) }}
                ref={el => { sheetRefs.current[0] = el }}
                style={{
                  ...styleOf(geos.current[orientation]),
                  ['--sheet-h' as string]: `${geos.current[orientation].heightMm}mm`,
                }}
              >
                {cover}
              </section>
            )}
            {sheets.map((sheet, s) => {
              const o = orientOf(s)
              const g = geos.current[o]
              const page = s + 1 + (cover ? 1 : 0)
              return (
                <div key={s} className="relative">
                  {/* ── The sheet's own controls, in a vertical gutter to its
                      RIGHT — on the dark ground, never on the paper. A chip
                      floating above the sheet read as part of the document and
                      pushed the first sheet down; a gutter belongs to the
                      workspace, which is what it is. Icon-only, because a
                      column of words at this width would wrap. ── */}
                  <div className="no-print absolute top-0 z-10 flex flex-col gap-1" style={{ right: -SHEET_PAD_X + 6 }}>
                    <button
                      type="button"
                      onClick={() => setFlips(f => ({
                        ...f,
                        [s]: (f[s] ?? orientation) === 'portrait' ? 'landscape' : 'portrait',
                      }))}
                      className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                      title={`${t('admin.rep_sheet_orientation')} — ${t(o === 'portrait' ? 'admin.rep_landscape' : 'admin.rep_portrait')}`}
                      aria-label={t('admin.rep_sheet_orientation')}
                    >
                      <RotateCw size={16} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={e => { setMenuSheet(s); menu.open(e) }}
                      className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                      title={t('admin.rep_menu_sheet', { page })}
                      aria-label={t('admin.rep_menu_sheet', { page })}
                    >
                      <MoreVertical size={16} aria-hidden />
                    </button>
                  </div>
                  <section
                    data-sheet
                    data-admin-report
                    data-o={o}
                    onContextMenu={e => { e.preventDefault(); setMenuSheet(s); menu.openAt(e.clientX, e.clientY) }}
                    ref={el => { sheetRefs.current[page - 1] = el }}
                    style={{ ...styleOf(g), ['--sheet-h' as string]: `${g.heightMm}mm` }}
                  >
                    {sheetContent(sheet, s)}
                  </section>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── The rail of thumbnails ── */}
        {total > 1 && (
          <aside
            className="no-print no-scrollbar sticky flex shrink-0 flex-col items-center gap-3 overflow-y-auto py-3"
            style={{
              ...stampVars,
              width: RAIL_W,
              // Pinned exactly where it already sits: the band, plus the 16 px
              // the toolbar leaves under itself, minus the panel's 24 px of top
              // padding (a sticky top is measured from the padding box). Any
              // other value makes the rail jump the instant it sticks — the
              // same defect the band itself had.
              top: bandHeight - 8,
              // 64 px of application header, the band, the same 16 px, and a
              // breath at the bottom: what is left is what the rail may occupy.
              maxHeight: `calc(100vh - ${64 + bandHeight + 16 + 24}px)`,
            }}
            aria-label={t('admin.rep_thumbnails')}
          >
            {cover && thumb(1, geos.current[orientation], cover, orientation)}
            {sheets.map((sheet, s) =>
              thumb(s + 1 + (cover ? 1 : 0), geos.current[orientOf(s)], sheetContent(sheet, s), orientOf(s)),
            )}
          </aside>
        )}
      </div>

      {menu.pos && (
        <MenuDropdown items={menuItems} pos={menu.pos} onClose={menu.close} />
      )}

      {/* ── The floating bar: where you are, how big, and the printer ── */}
      <div
        className="no-print fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[#202124]/95 px-4 py-2 text-white shadow-lg backdrop-blur"
        style={{ fontSize: 'var(--kb-text-body)' }}
      >
        <span className="flex items-center gap-2">
          {t('admin.rep_page_label')}
          <input
            type="text"
            inputMode="numeric"
            value={active}
            onChange={e => {
              const n = parseInt(e.currentTarget.value.replace(/\D/g, ''), 10)
              if (n >= 1 && n <= total) { setActive(n); goTo(n) }
            }}
            className="w-10 rounded border border-white/25 bg-white/10 px-1 py-0.5 text-center text-white outline-none focus:border-white/60"
            aria-label={t('admin.rep_page_label')}
          />
          <span className="text-white/70">/ {total}</span>
        </span>

        <span className="h-4 w-px bg-white/25" />

        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full p-1 hover:bg-white/15"
          title={t('admin.rep_print')}
        >
          <Printer size={16} aria-hidden />
        </button>

        <span className="h-4 w-px bg-white/25" />

        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoomWanted(Math.max(0.25, Math.round((zoom - 0.1) * 100) / 100))}
            className="rounded-full p-1 hover:bg-white/15"
            title={t('admin.rep_zoom_out')}
          >
            <Minus size={16} aria-hidden />
          </button>
          {/* Clicking the figure goes back to fitting the panel — the state the
              preview opens in, and the one an operator wants back after zooming
              in on a table. */}
          <button
            type="button"
            onClick={() => setZoomWanted(null)}
            className="min-w-14 rounded px-1 py-0.5 tabular-nums hover:bg-white/15"
            title={t('admin.rep_fit')}
          >
            {Math.round(zoom * 100)} %
          </button>
          <button
            type="button"
            onClick={() => setZoomWanted(Math.min(3, Math.round((zoom + 0.1) * 100) / 100))}
            className="rounded-full p-1 hover:bg-white/15"
            title={t('admin.rep_zoom_in')}
          >
            <Plus size={16} aria-hidden />
          </button>
        </span>
      </div>
    </>
  )
}
