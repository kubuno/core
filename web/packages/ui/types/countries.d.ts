export interface Country {
    iso2: string;
    dial: string;
    name: string;
}
/** 🇫🇷 flag emoji from an ISO-3166 alpha-2 code. */
export declare function flagEmoji(iso2: string): string;
export declare const COUNTRIES: Country[];
export declare function countryOf(iso2: string): Country | undefined;
