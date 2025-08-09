import type {
    RequiredTransportConfig,
    XoxaConfig,
    Unsubscribe,
    TransportState,
    ISODateString,
    TwilioSendResp,
    TwilioSmsConfig,
} from "../types/global.type";
import type { OutboundMessage, InboundMessage, DeliveryReceipt } from "../types/message.type";
import type { Transport } from "../interfaces/transport.interface";
import { FormClient } from "../utilities/form-client";
import { Buffer } from "buffer";

export class TwilioSmsTransport implements Transport {
    public readonly channel = "sms" as const;
    private state: TransportState = "idle";
    private onMsg: ((msg: InboundMessage) => void) | null = null;
    private form!: FormClient;
    private readonly cfg!: TwilioSmsConfig;

    constructor(cfg: TwilioSmsConfig) {
        this.cfg = cfg;
    }

    public async connect(config: XoxaConfig): Promise<void> {
        this.state = "connecting";
        this.form = new FormClient(config.timeoutMs ?? 15000);
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
        if (this.state !== "connected") throw new Error("TwilioSmsTransport not connected");
        const url = `${this.cfg.baseUrl ?? "https://api.twilio.com/2010-04-01"}/Accounts/${this.cfg.accountSid}/Messages.json`;
        const auth = Buffer.from(`${this.cfg.accountSid}:${this.cfg.authToken}`).toString("base64");
        const headers = { ...cfg.headers, Authorization: `Basic ${auth}` };
        const form = new URLSearchParams();
        form.append("From", message.from!);
        form.append("To", message.to);
        if (message.body) form.append("Body", message.body);
        if (message.media && message.media.length > 0) {
            for (const m of message.media) {
                if (m.url) form.append("MediaUrl", m.url);
            }
        }
        const res = await this.form.postForm<TwilioSendResp>(url, form, headers);
        return {
            channel: "sms",
            messageId: res.sid,
            providerMessageId: res.sid,
            status: this.mapTwilioStatus(res.status),
            timestamp: new Date().toISOString() as ISODateString,
            raw: res,
        };
    }

    private mapTwilioStatus(s: string): "queued" | "sent" | "delivered" | "failed" | "unknown" {
        switch (s) {
            case "queued":
                return "queued";
            case "sent":
                return "sent";
            case "delivered":
                return "delivered";
            case "failed":
            case "undelivered":
                return "failed";
            default:
                return "unknown";
        }
    }
}
