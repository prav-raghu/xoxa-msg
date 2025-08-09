import { OutboundMessage } from "./global.type";

type BaseWA = Pick<OutboundMessage, "from" | "channel" | "to" | "body" | "media" | "subject" | "metadata" | "dedupeKey" | "createdAt"> & {
    channel: "whatsapp";
};

export type WAMediaKind = "image" | "audio" | "video" | "document";

export interface WAMedia {
    kind: WAMediaKind;
    url: string;
    caption?: string;
    filename?: string;
}

export interface WhatsAppTextMessage extends BaseWA {
    body: string;
    previewUrl?: boolean;
}

export interface WhatsAppTemplateComponent {
    type: string;
    parameters: Array<{ type: string; text: string }>;
}

export interface WhatsAppTemplateMessage extends BaseWA {
    templateName: string;
    languageCode?: string;
    components?: WhatsAppTemplateComponent[];
}

export interface WhatsAppMediaMessage extends BaseWA {
    media: WAMedia[];
}

export type WhatsAppOutboundMessage = WhatsAppTextMessage | WhatsAppTemplateMessage | WhatsAppMediaMessage;

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

export function isWATemplate(m: WhatsAppOutboundMessage): m is WhatsAppTemplateMessage {
    return "templateName" in m;
}
export function hasWAMedia(m: WhatsAppOutboundMessage): m is WhatsAppMediaMessage {
    return Array.isArray(m.media) && m.media.length > 0;
}
