export type MarkdownImagePath = {
    raw: string;
    resolved: string;
    safeName: string;
};
export declare function getMarkdownCodeForImages(imagePaths: MarkdownImagePath[], html: string): string;
