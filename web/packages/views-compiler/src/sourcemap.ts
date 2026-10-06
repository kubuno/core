/** A minimal source map v3 writer and reader (Base64 VLQ), for the generated view modules. */

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function vlq(value: number): string {
  let v = value < 0 ? (-value << 1) | 1 : value << 1
  let out = ''
  do {
    let digit = v & 31
    v >>>= 5
    if (v > 0) digit |= 32
    out += B64[digit]
  } while (v > 0)
  return out
}

/** One mapping: generated 0-based column → source 0-based line / column (single source). */
export interface Segment {
  col: number
  srcLine: number
  srcCol: number
}

export interface SourceMapV3 {
  version: 3
  file?: string
  sources: string[]
  sourcesContent?: (string | null)[]
  names: string[]
  mappings: string
}

/** Encodes per-line segment lists (all pointing into source 0). */
export function encodeMappings(lines: readonly (readonly Segment[])[]): string {
  let prevSrcLine = 0
  let prevSrcCol = 0
  let prevSource = 0
  return lines
    .map((segments) => {
      let prevCol = 0
      return [...segments]
        .sort((a, b) => a.col - b.col)
        .map((s) => {
          const out = vlq(s.col - prevCol) + vlq(0 - prevSource) + vlq(s.srcLine - prevSrcLine) + vlq(s.srcCol - prevSrcCol)
          prevCol = s.col
          prevSource = 0
          prevSrcLine = s.srcLine
          prevSrcCol = s.srcCol
          return out
        })
        .join(',')
    })
    .join(';')
}

/** Decodes `mappings` back into per-line segments (tests, debugging). */
export function decodeMappings(mappings: string): Segment[][] {
  const lines: Segment[][] = []
  let srcLine = 0
  let srcCol = 0
  for (const lineText of mappings.split(';')) {
    const line: Segment[] = []
    let col = 0
    for (const seg of lineText.split(',')) {
      if (!seg) continue
      const values: number[] = []
      let shift = 0
      let value = 0
      for (const ch of seg) {
        const digit = B64.indexOf(ch)
        value += (digit & 31) << shift
        if (digit & 32) {
          shift += 5
        } else {
          values.push(value & 1 ? -(value >>> 1) : value >>> 1)
          value = 0
          shift = 0
        }
      }
      col += values[0] ?? 0
      if (values.length >= 4) {
        srcLine += values[2]
        srcCol += values[3]
        line.push({ col, srcLine, srcCol })
      }
    }
    lines.push(line)
  }
  return lines
}
