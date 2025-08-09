export type MediaKind = "image" | "audio" | "video" | "document";
export type Unsubscribe = () => void;
export type TransportState = "idle" | "connecting" | "connected" | "closing" | "closed" | "error";
export type Channel = "sms" | "whatsapp" | "telegram";
export type WaResp = { messages: Array<{ id: string }> };
export type TwilioSendResp = { sid: string; status: string; date_created: string };
export type TgSendResp = { ok: boolean; result?: { message_id: number; date: number } };
export type XoxaEvents = {
    connected: void;
    disconnected: { reason?: string };
    error: { error: Error };
    message: { message: InboundMessage };
    state: { state: TransportState };
};
export interface XoxaConfig {
    appId: string;
    userAgent?: string;
    timeoutMs?: number;
    maxRetries?: number;
    backoffBaseMs?: number;
    backoffMaxMs?: number;
    debug?: boolean;
}

export interface TwilioSmsConfig {
    accountSid: string;
    authToken: string;
    baseUrl?: string;
    from?: string;
}

export interface TelegramConfig {
    botUsername?: string;
    botToken: string;
    baseUrl?: string;
}

export interface RequiredTransportConfig {
    baseUrl?: string;
    timeoutMs: number;
    headers: Record<string, string>;
    userAgent: string;
}

export interface MediaAttachment {
    kind: MediaKind;
    url: string;
    filename?: string;
    caption?: string;
    mimeType?: string;
}

export interface WhatsAppTextMessage extends OutboundMessage {
    channel: "whatsapp";
    body: string;
    previewUrl?: boolean;
}

export interface WhatsAppTemplateComponent {
    type: string;
    parameters: Array<{ type: string; text: string }>;
}

export interface WhatsAppTemplateMessage extends OutboundMessage {
    channel: "whatsapp";
    templateName: string;
    languageCode?: string;
    components?: WhatsAppTemplateComponent[];
}

export interface WhatsAppMediaMessage extends OutboundMessage {
    channel: "whatsapp";
    media: MediaAttachment[];
}

export type WhatsAppOutboundMessage = WhatsAppTextMessage | WhatsAppTemplateMessage | WhatsAppMediaMessage;

export type BaseOutboundMessage =
    | WhatsAppOutboundMessage
    | (OutboundMessage & { channel: "sms"; body: string })
    | (OutboundMessage & { channel: "telegram"; body: string });

export interface InboundMessage {
    channel?: Channel;
    id: string;
    from: string;
    to: string;
    body?: string;
    media?: MediaAttachment[];
    metadata?: Record<string, string | number | boolean>;
    receivedAt: string;
    subject?: string;
}

export type DeliveryStatus = "queued" | "sent" | "delivered" | "failed" | "unknown";

export interface DeliveryReceipt {
    channel?: Channel;
    messageId: string;
    status: DeliveryStatus;
    detail?: string;
    timestamp: string;
    providerMessageId?: string;
    raw?: unknown;
}

export interface SendOptions {
    timeoutMs?: number;
    retries?: number;
}

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

export interface OutboundMessage {
    from?: string;
    channel: Channel;
    to: string;
    body?: string;
    media?: MediaAttachment[];
    subject?: string;
    metadata?: Record<string, string | number | boolean>;
    dedupeKey?: string;
    createdAt?: string;
}
