import type { ReportModel } from './model';
import type { FlowItem } from './paged/types';
/**
 * The records behind the figure — who, when, what.
 *
 * ## Why a total and a curve are not a report
 *
 * "47 échecs de connexion" is a counter. The question it provokes — *which
 * accounts* — is the one an operator actually has to answer, and until this
 * section existed the document could not. A chart shows a shape, a breakdown
 * shows proportions; only a list of the underlying records lets somebody act,
 * and a report is written for somebody who was not in the room and cannot ask.
 *
 * ## What it prints, and what it never prints
 *
 * The columns are the server's, not this file's: it declares them per SOURCE
 * TABLE (`handlers/admin/detail.rs`) and this component renders whatever it is
 * handed. That is deliberate — a console inventing headings would eventually
 * name a column the server never meant to publish. No password, no token, no
 * hash and no fingerprint reaches this table, by construction on that side.
 *
 * ## The two sentences that keep it honest
 *
 *   • **How many, out of how many.** A list of 2 000 rows under a total of
 *     9 400 must say so, or it reads as the whole period.
 *   • **Why there is none.** A panel that describes a state, counts distinct
 *     values or reads an aggregated counter has no records to list. It says
 *     which of those it is, in one sentence, instead of leaving the reader to
 *     assume nothing happened.
 */
export declare function useDetailItem(model: ReportModel, total: number): FlowItem | null;
