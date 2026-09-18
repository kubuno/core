import type { ReportModel } from './model';
/**
 * "En bref" — what the figures below actually say.
 *
 * ## Why a report needs it
 *
 * A page of correct tables can still leave its reader with nothing: the peak is
 * a row among ninety, the concentration is a column of percentages nobody adds
 * up, and "+129 %" means little without the two numbers it compares. This block
 * states the three or four things a reader would have worked out, in the order
 * they would have worked them out.
 *
 * ## Every sentence is COMPUTED
 *
 * Not one of them is written in advance and filled in. Each is derived from the
 * model — the peak from the series, the concentration from the breakdown, the
 * variation from the comparison window — and each carries the figure it is
 * derived from, so a reader can check it against the table below rather than
 * believe it. A sentence that could not be computed is simply absent; there is
 * no filler, and nothing is rounded into a claim the data does not support.
 *
 * That is also why there is no interpretation: the block says "le 4 août
 * concentre 27 % du total", never "activité anormale". The first is arithmetic,
 * the second is a judgement the document has no business making.
 */
export default function ReportSummary({ model }: {
    model: ReportModel;
}): import("react").JSX.Element | null;
