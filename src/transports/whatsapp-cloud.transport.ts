import type { RequiredTransportConfig, XoxaConfig, Unsubscribe, TransportState, ISODateString, WaResp } from "../types/global.type";
import type { OutboundMessage, InboundMessage, DeliveryReceipt } from "../types/message.type";
import type { Transport } from "../interfaces/transport.interface";
import { HttpClient } from "../utilities/http-client";

export interface WhatsAppCloudConfig {
    phoneNumberId: string;
    baseUrl?: string; // e.g., https://graph.facebook.com/v19.0
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

    public async send(message: OutboundMessage, cfg: RequiredTransportConfig): Promise<DeliveryReceipt> {
        if (this.state !== "connected") throw new Error("WhatsAppTransport not connected");

        const urlBase = this.cfg.baseUrl ?? `https://graph.facebook.com/v22.0/${this.cfg.phoneNumberId}/messages`;
        const url = `${urlBase}`;

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

    private buildWhatsAppPayload(msg: OutboundMessage) {
        if (msg.media?.length) {
            const m = msg.media[0];
            let type: string;
            if (m.kind === "image") {
                type = "image";
            } else if (m.kind === "audio") {
                type = "audio";
            } else if (m.kind === "video") {
                type = "video";
            } else {
                type = "document";
            }
            return {
                messaging_product: "whatsapp",
                to: msg.to.replace(/\D/g, ""),
                type,
                [type]: {
                    link: m.url,
                    caption: m.caption ?? msg.body,
                    filename: m.filename,
                },
            };
        }
        return {
            messaging_product: "whatsapp",
            to: msg.to.replace(/\D/g, ""),
            type: "text",
            text: { body: msg.body ?? "" },
        };
    }
}
