/** Shared password strength heuristic — used by the sign-up form and the forced
 *  password change screen so both show the exact same meter. */
export interface PasswordStrength {
    score: number;
    /** i18n key describing the score. */
    key: string;
    color: string;
}
export declare function passwordStrength(password: string): PasswordStrength;
