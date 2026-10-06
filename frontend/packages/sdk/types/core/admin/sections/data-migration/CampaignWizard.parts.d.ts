import type { CampaignWizard } from './CampaignWizard';
declare function FieldLabel({ children }: {
    children: React.ReactNode;
}): import("react").JSX.Element;
export { FieldLabel };
export declare function Part1({ steps, step, setStep, t }: {
    steps: NonNullable<CampaignWizard['steps']>;
    step: NonNullable<CampaignWizard['step']>;
    setStep: NonNullable<CampaignWizard['setStep']>;
    t: NonNullable<CampaignWizard['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ service, s, setService }: {
    service: NonNullable<CampaignWizard['service']>;
    s: NonNullable<CampaignWizard['rows_services']>[number]['s'];
    setService: NonNullable<CampaignWizard['setService']>;
}): import("react").JSX.Element;
export declare function Part3({ t, name, setName }: {
    t: NonNullable<CampaignWizard['tr']>;
    name: NonNullable<CampaignWizard['name']>;
    setName: NonNullable<CampaignWizard['setName']>;
}): import("react").JSX.Element;
export declare function Part4({ t, port, setPort }: {
    t: NonNullable<CampaignWizard['tr']>;
    port: NonNullable<CampaignWizard['port']>;
    setPort: NonNullable<CampaignWizard['setPort']>;
}): import("react").JSX.Element;
export declare function Part5({ t }: {
    t: NonNullable<CampaignWizard['tr']>;
}): import("react").JSX.Element;
export declare function Part6({ t }: {
    t: NonNullable<CampaignWizard['tr']>;
}): import("react").JSX.Element;
export declare function Part7({ bulk, setBulk }: {
    bulk: NonNullable<CampaignWizard['bulk']>;
    setBulk: NonNullable<CampaignWizard['setBulk']>;
}): import("react").JSX.Element;
export declare function Part8({ t }: {
    t: NonNullable<CampaignWizard['tr']>;
}): import("react").JSX.Element;
export declare function Part9({ t, since, setSince }: {
    t: NonNullable<CampaignWizard['tr']>;
    since: NonNullable<CampaignWizard['since']>;
    setSince: NonNullable<CampaignWizard['setSince']>;
}): import("react").JSX.Element;
export declare function Part10({ t }: {
    t: NonNullable<CampaignWizard['tr']>;
}): import("react").JSX.Element;
