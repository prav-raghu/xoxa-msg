import type { Channel, ISODateString } from "./global.type";

export type MediaKind = "image" | "audio" | "video" | "document";

export interface MediaAttachment {
    kind: MediaKind;
    url: string; // remote media URL
    filename?: string; // provider-dependent
    caption?: string; // optional text
    mimeType?: string; // strongly recommended for docs/video/audio
}

export interface OutboundMessage {
    from?: string;
    channel: Channel;
    to: string; // E.164 for SMS/WhatsApp, chat id/username for Telegram
    body?: string;
    media?: MediaAttachment[]; // 0..n
    subject?: string; // ignored by providers that don’t support it
    metadata?: Record<string, string | number | boolean>;
    dedupeKey?: string; // idempotency key (if supported by transport)
    createdAt?: ISODateString;
}

export interface InboundMessage {
    channel?: Channel;
    id: string;
    from: string;
    to: string;
    body?: string;
    media?: MediaAttachment[];
    metadata?: Record<string, string | number | boolean>;
    receivedAt: ISODateString;
    subject?: string;
}

export type DeliveryStatus = "queued" | "sent" | "delivered" | "failed" | "unknown";

export interface DeliveryReceipt {
    channel?: Channel;
    messageId: string;
    status: DeliveryStatus;
    detail?: string;
    timestamp: ISODateString;
    providerMessageId?: string;
    raw?: unknown; // provider raw payload (typed by transport)
}

export interface SendOptions {
    timeoutMs?: number;
    retries?: number;
}
