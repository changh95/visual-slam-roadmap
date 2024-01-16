import type { ArtifactVerificationOptions, PublicKey, TransparencyLogInstance } from '@sigstore/protobuf-specs';
import type { WithRequired } from './utility';
export { SubjectAlternativeNameType } from '@sigstore/protobuf-specs';
export type { ArtifactVerificationOptions, ArtifactVerificationOptions_CtlogOptions, ArtifactVerificationOptions_TlogOptions, CertificateAuthority, CertificateIdentities, CertificateIdentity, Envelope, ObjectIdentifierValuePair, PublicKey, SubjectAlternativeName, TransparencyLogInstance, TrustedRoot, } from '@sigstore/protobuf-specs';
export type RequiredArtifactVerificationOptions = WithRequired<ArtifactVerificationOptions, 'ctlogOptions' | 'tlogOptions'>;
export type CAArtifactVerificationOptions = WithRequired<ArtifactVerificationOptions, 'ctlogOptions'> & {
    signers?: Extract<ArtifactVerificationOptions['signers'], {
        $case: 'certificateIdentities';
    }>;
};
export declare function isCAVerificationOptions(options: ArtifactVerificationOptions): options is CAArtifactVerificationOptions;
export type ViableTransparencyLogInstance = TransparencyLogInstance & {
    logId: NonNullable<TransparencyLogInstance['logId']>;
    publicKey: WithRequired<PublicKey, 'rawBytes'>;
};
