import type { RequiredTransportConfig, XoxaConfig, Unsubscribe, TransportState, ISODateString, WaResp } from "../types/global.type";
import type {
    InboundMessage,
    DeliveryReceipt,
    WhatsAppMediaMessage,
    WhatsAppTemplateMessage,
    WhatsAppTextMessage,
    WhatsAppPayload,
    WhatsAppOutboundMessage,
} from "../types/message.type";
import type { Transport } from "../interfaces/transport.interface";
import { HttpClient } from "../utilities/http-client";

export interface WhatsAppCloudConfig {
    phoneNumberId: string;
    baseUrl?: string; // e.g., https://graph.facebook.com/v22.0
    accessToken: string;
}

export class WhatsAppTransport implements Transport {
    public readonly channel = "whatsapp" as const;
    private state: TransportState = "idle";
    private onMsg: ((msg: InboundMessage) => void) | null = null;
    private http!: HttpClient;
    private readonly cfg!: WhatsAppCloudConfig;

    constructor(cfg: WhatsAppCloudConfig) {
        this.cfg = cfg;
    }

    public async connect(config: XoxaConfig): Promise<void> {
        this.state = "connecting";
        this.http = new HttpClient(config.timeoutMs ?? 15000);
        this.state = "connected";
    }

    public async disconnect(): Promise<void> {
        this.state = "closing";
        this.onMsg = null;
        this.state = "closed";
    }

    public onMessage(handler: (msg: InboundMessage) => void): Unsubscribe {
        this.onMsg = handler;
        return () => {
            this.onMsg = null;
        };
    }

    public getState(): TransportState {
        return this.state;
    }

    public async send(message: WhatsAppOutboundMessage, cfg: RequiredTransportConfig): Promise<DeliveryReceipt> {
        if (this.state !== "connected") {
            throw new Error("WhatsAppTransport not connected");
        }

        const url = `${this.cfg.baseUrl ?? "https://graph.facebook.com/v22.0"}/${this.cfg.phoneNumberId}/messages`;

        const headers = {
            ...cfg.headers,
            Authorization: `Bearer ${this.cfg.accessToken}`,
        };

        const payload = this.buildWhatsAppPayload(message);

        const res = await this.http.postJson<WaResp>(url, payload, headers);
        const id = res.messages?.[0]?.id ?? `wa_${Date.now()}`;

        return {
            channel: "whatsapp",
            messageId: id,
            providerMessageId: id,
            status: "queued",
            timestamp: new Date().toISOString() as ISODateString,
            raw: res,
        };
    }

    private buildWhatsAppPayload(msg: WhatsAppOutboundMessage): WhatsAppPayload {
        // Media message
        if ("media" in msg && msg.media && msg.media.length > 0) {
            const m: WhatsAppMediaMessage["media"][0] = msg.media[0];
            const type = m.kind;
            const mediaPayload: Record<string, unknown> = { link: m.url };

            if (m.caption || msg.body) {
                mediaPayload.caption = m.caption ?? msg.body;
            }
            if (m.filename) {
                mediaPayload.filename = m.filename;
            }

            return {
                messaging_product: "whatsapp",
                to: msg.to.replace(/\D/g, ""),
                type,
                [type]: mediaPayload,
            };
        }

        // Template message
        if ("templateName" in msg) {
            const tmplMsg = msg as WhatsAppTemplateMessage;
            return {
                messaging_product: "whatsapp",
                to: tmplMsg.to.replace(/\D/g, ""),
                type: "template",
                template: {
                    name: tmplMsg.templateName,
                    language: { code: tmplMsg.languageCode ?? "en_US" },
                    ...(tmplMsg.components ? { components: tmplMsg.components } : {}),
                },
            };
        }

        // Text message
        const txtMsg = msg as WhatsAppTextMessage;
        return {
            messaging_product: "whatsapp",
            to: txtMsg.to.replace(/\D/g, ""),
            type: "text",
            text: {
                body: txtMsg.body,
                ...(txtMsg.previewUrl !== undefined ? { preview_url: txtMsg.previewUrl } : {}),
            },
        };
    }
}
