import * as sigstore from '../../types/sigstore';
import { x509Certificate } from '../../x509/cert';
import type { X509Certificate } from '@sigstore/bundle';
export declare function verifyChain(certificate: X509Certificate, certificateAuthorities: sigstore.CertificateAuthority[]): x509Certificate[];
