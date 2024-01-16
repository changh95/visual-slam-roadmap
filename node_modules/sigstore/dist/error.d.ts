declare class BaseError extends Error {
    cause: any | undefined;
    constructor(message: string, cause?: any);
}
declare class ErrorWithCode<T extends string> extends BaseError {
    code: T;
    constructor({ code, message, cause, }: {
        code: T;
        message: string;
        cause?: any;
    });
}
export declare class VerificationError extends BaseError {
}
export declare class PolicyError extends BaseError {
}
type InternalErrorCode = 'TUF_FIND_TARGET_ERROR' | 'TUF_REFRESH_METADATA_ERROR' | 'TUF_DOWNLOAD_TARGET_ERROR' | 'TUF_READ_TARGET_ERROR';
export declare class InternalError extends ErrorWithCode<InternalErrorCode> {
}
type SignatureErrorCode = 'MISSING_SIGNATURE_ERROR' | 'MISSING_PUBLIC_KEY_ERROR';
export declare class SignatureError extends ErrorWithCode<SignatureErrorCode> {
}
export {};
