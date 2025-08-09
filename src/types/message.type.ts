import type { Channel, ISODateString } from "./global.type";

export type MediaKind = "image" | "audio" | "video" | "document";

export interface MediaAttachment {
    kind: MediaKind;
    url: string; // remote media URL
    filename?: string; // provider-dependent
    caption?: string; // optional text
    mimeType?: string; // strongly recommended for docs/video/audio
}

/**
 * Base message fields shared by all channels.
 */
export interface BaseOutboundMessage {
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

/**
 * WhatsApp-specific message types
 */
export interface WhatsAppTextMessage extends BaseOutboundMessage {
    channel: "whatsapp";
    body: string;
    previewUrl?: boolean;
}

export interface WhatsAppTemplateComponent {
    type: string;
    parameters: Array<{ type: string; text: string }>;
}

export interface WhatsAppTemplateMessage extends BaseOutboundMessage {
    channel: "whatsapp";
    templateName: string;
    languageCode?: string;
    components?: WhatsAppTemplateComponent[];
}

export interface WhatsAppMediaMessage extends BaseOutboundMessage {
    channel: "whatsapp";
    media: MediaAttachment[]; // 1..n
}

/**
 * Union of all possible WhatsApp outbound messages
 */
export type WhatsAppOutboundMessage = WhatsAppTextMessage | WhatsAppTemplateMessage | WhatsAppMediaMessage;

/**
 * Generic outbound message union for all channels
 */
export type OutboundMessage =
    | WhatsAppOutboundMessage
    | (BaseOutboundMessage & { channel: "sms"; body: string })
    | (BaseOutboundMessage & { channel: "telegram"; body: string });

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

/**
 * WhatsApp API payload shape
 */
export type WhatsAppPayload =
    | {
          messaging_product: "whatsapp";
          to: string;
          type: "text";
          text: { body: string; preview_url?: boolean };
      }
    | {
          messaging_product: "whatsapp";
          to: string;
          type: "template";
          template: {
              name: string;
              language: { code: string };
              components?: WhatsAppTemplateComponent[];
          };
      }
    | {
          messaging_product: "whatsapp";
          to: string;
          type: "image" | "audio" | "video" | "document";
          [key: string]: unknown;
      };
