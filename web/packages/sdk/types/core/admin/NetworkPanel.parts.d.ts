import type { NetworkPanel } from './NetworkPanel';
export declare function Part1({ askDelete, cert, t }: {
    askDelete: NetworkPanel['askDelete'];
    cert: NonNullable<NetworkPanel['cert']>;
    t: NonNullable<NetworkPanel['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ t }: {
    t: NonNullable<NetworkPanel['tr']>;
}): import("react").JSX.Element;
export declare function Part3({ t, certPem, setCertPem }: {
    t: NonNullable<NetworkPanel['tr']>;
    certPem: NonNullable<NetworkPanel['certPem']>;
    setCertPem: NonNullable<NetworkPanel['setCertPem']>;
}): import("react").JSX.Element;
export declare function Part4({ t, keyPem, setKeyPem }: {
    t: NonNullable<NetworkPanel['tr']>;
    keyPem: NonNullable<NetworkPanel['keyPem']>;
    setKeyPem: NonNullable<NetworkPanel['setKeyPem']>;
}): import("react").JSX.Element;
export declare function Part5({ upload, certPem, keyPem, t }: {
    upload: NonNullable<NetworkPanel['upload']>;
    certPem: NonNullable<NetworkPanel['certPem']>;
    keyPem: NonNullable<NetworkPanel['keyPem']>;
    t: NonNullable<NetworkPanel['tr']>;
}): import("react").JSX.Element;
export declare function Part6({ requestAcme, t }: {
    requestAcme: NonNullable<NetworkPanel['requestAcme']>;
    t: NonNullable<NetworkPanel['tr']>;
}): import("react").JSX.Element;
export declare function Part7({ askDelete, c, removeCert, t }: {
    askDelete: NetworkPanel['askDelete'];
    c: NonNullable<NetworkPanel['rows_history']>[number]['c'];
    removeCert: NonNullable<NetworkPanel['removeCert']>;
    t: NonNullable<NetworkPanel['tr']>;
}): import("react").JSX.Element;
