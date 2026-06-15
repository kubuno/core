interface Props {
    title: string;
    icon: React.ReactNode;
    link?: string;
    linkLabel?: string;
    children: React.ReactNode;
    containerRef?: React.Ref<HTMLDivElement>;
}
export default function DashboardWidget({ title, icon, link, linkLabel, children, containerRef }: Props): import("react").JSX.Element;
export {};
