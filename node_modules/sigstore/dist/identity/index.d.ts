import { IdentityProvider } from '@sigstore/sign';
/**
 * oauthProvider returns a new Provider instance which attempts to retrieve
 * an identity token from the configured OAuth2 issuer.
 *
 * @param issuer Base URL of the issuer
 * @param clientID Client ID for the issuer
 * @param clientSecret Client secret for the issuer (optional)
 * @returns {IdentityProvider}
 */
declare function oauthProvider(options: {
    issuer: string;
    clientID: string;
    clientSecret?: string;
    redirectURL?: string;
}): IdentityProvider;
declare const _default: {
    oauthProvider: typeof oauthProvider;
};
export default _default;
