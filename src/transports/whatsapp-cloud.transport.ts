import {
    TransportState,
    InboundMessage,
    XoxaConfig,
    Unsubscribe,
    RequiredTransportConfig,
    DeliveryReceipt,
    OutboundMessage,
} from "../types/global.type";
import type { Transport } from "../interfaces/transport.interface";
import { MetaApi } from "../apis/meta.api";
import { WhatsAppOutboundMessage, WhatsAppMediaMessage, WhatsAppTextMessage } from "../types/whatsapp.type";
import { WhatsAppRequestDto } from "../dtos/meta.dto";

export interface WhatsAppCloudConfig {
    phoneNumberId: string;
    baseUrl?: string;
    accessToken: string;
}

export class WhatsAppTransport implements Transport {
    public readonly channel = "whatsapp" as const;
    private state: TransportState = "idle";
    private onMsg: ((msg: InboundMessage) => void) | null = null;
    private api!: MetaApi;
    private readonly config!: WhatsAppCloudConfig;

    constructor(config: WhatsAppCloudConfig) {
        this.config = config;
    }

    public async connect(config: XoxaConfig): Promise<void> {
        this.state = "connecting";
        this.api = new MetaApi({
            timeout: config.timeoutMs ?? 15000,
            ...(this.config.baseUrl ? { baseURL: this.config.baseUrl } : {}),
        });
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

    public async send(message: OutboundMessage, config: RequiredTransportConfig): Promise<DeliveryReceipt> {
        if (this.state !== "connected") throw new Error("WhatsAppTransport not connected");
        const waMsg = message as WhatsAppOutboundMessage;
        const payload = this.buildWhatsAppPayload(waMsg);
        const resp = await this.api.sendWhatsappMessage(this.config.phoneNumberId, this.config.accessToken, payload, config.headers);
        const data = resp.data;
        const id = data.messages?.[0]?.id ?? `wa_${Date.now()}`;
        return {
            channel: "whatsapp",
            messageId: id,
            providerMessageId: id,
            status: "queued",
            timestamp: new Date().toISOString(),
            raw: data,
        };
    }

    private buildWhatsAppPayload(msg: WhatsAppOutboundMessage): WhatsAppRequestDto {
        // Media
        if ("media" in msg && msg.media && msg.media.length > 0) {
            const m: WhatsAppMediaMessage["media"][0] = msg.media[0];
            const type = m.kind; // "image" | "audio" | "video" | "document"
            const mediaObj: Record<string, unknown> = { link: m.url };
            if (m.caption || msg.body) mediaObj.caption = m.caption ?? msg.body;
            if (m.filename) mediaObj.filename = m.filename;

            return {
                messaging_product: "whatsapp",
                to: msg.to.replace(/\D/g, ""),
                type,
                [type]: mediaObj, // matches DTO key (image/audio/video/document)
            } as WhatsAppRequestDto;
        }

        // Template
        if ("templateName" in msg) {
            return {
                messaging_product: "whatsapp",
                to: msg.to.replace(/\D/g, ""),
                type: "template",
                template: {
                    name: msg.templateName,
                    language: { code: msg.languageCode ?? "en_US" },
                    ...(msg.components ? { components: msg.components } : {}),
                },
            };
        }

        // Text
        const x = msg as WhatsAppTextMessage;
        return {
            messaging_product: "whatsapp",
            to: x.to.replace(/\D/g, ""),
            type: "text",
            text: {
                body: x.body,
                ...(x.previewUrl !== undefined ? { preview_url: x.previewUrl } : {}),
            },
        };
    }
}
