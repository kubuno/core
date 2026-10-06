import { type ConnectionProbe } from "./types";
import type { LdapSection } from './LdapSection';
declare function RawDetail({ text }: {
    text: string;
}): import("react").JSX.Element;
export { RawDetail };
declare function MappingSummary({ mapping, t, }: {
    mapping: NonNullable<ConnectionProbe['sample_mapping']>;
    t: (k: string, o?: Record<string, unknown>) => string;
}): import("react").JSX.Element;
export { MappingSummary };
export declare function Part1({ t }: {
    t: NonNullable<LdapSection['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ list, probe, authProbe, report, editing, form, setForm, submit, setEditing, updateM, t, onDelete, probing, setProbe, testM, syncM, trial, setTrial, testAuthM }: {
    list: NonNullable<LdapSection['list']>;
    probe: NonNullable<LdapSection['probe']>;
    authProbe: NonNullable<LdapSection['authProbe']>;
    report: NonNullable<LdapSection['report']>;
    editing: LdapSection['editing'];
    form: NonNullable<LdapSection['form']>;
    setForm: NonNullable<LdapSection['setForm']>;
    submit: LdapSection['submit'];
    setEditing: NonNullable<LdapSection['setEditing']>;
    updateM: NonNullable<LdapSection['updateM']>;
    t: NonNullable<LdapSection['tr']>;
    onDelete: LdapSection['onDelete'];
    probing: LdapSection['probing'];
    setProbe: NonNullable<LdapSection['setProbe']>;
    testM: NonNullable<LdapSection['testM']>;
    syncM: NonNullable<LdapSection['syncM']>;
    trial: NonNullable<LdapSection['trial']>;
    setTrial: NonNullable<LdapSection['setTrial']>;
    testAuthM: NonNullable<LdapSection['testAuthM']>;
}): import("react").JSX.Element;
