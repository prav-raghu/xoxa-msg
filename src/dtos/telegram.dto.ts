import { MediaKind } from "../types/global.type";

export interface TelegramRequestDto {
    media?: MediaAttachment[];
    to:string;
    body: string;
}

export interface MediaAttachment {
    kind: MediaKind;
    url: string;
    filename?: string;
    caption?: string;
    mimeType?: string;
}

export interface TelegramResponseDto {
    ok(ok: any): unknown;
    result: any;
    description: string;
}
