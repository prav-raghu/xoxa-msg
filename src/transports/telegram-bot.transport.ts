import type {
    RequiredTransportConfig,
    XoxaConfig,
    Unsubscribe,
    TransportState,
    ISODateString,
    TelegramConfig,
    TgSendResp,
} from "../types/global.type";
import type { OutboundMessage, InboundMessage, DeliveryReceipt } from "../types/message.type";
import type { Transport } from "../interfaces/transport.interface";
import { HttpClient } from "../utilities/http-client";

export class TelegramTransport implements Transport {
    public readonly channel = "telegram" as const;
    private state: TransportState = "idle";
    private onMsg: ((msg: InboundMessage) => void) | null = null;
    private http!: HttpClient;
    private readonly cfg!: TelegramConfig;

    constructor(cfg: TelegramConfig) {
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
        if (this.state !== "connected") throw new Error("TelegramTransport not connected");
        const base = this.cfg.baseUrl ?? "https://api.telegram.org";
        const url = `${base}/bot${this.cfg.botToken}/${message.media?.length ? "sendDocument" : "sendMessage"}`;
        const headers = { ...cfg.headers };
        const payload = message.media?.length
            ? { chat_id: message.to, document: message.media[0].url, caption: message.media[0].caption ?? message.body }
            : { chat_id: message.to, text: message.body ?? "" };

        const res = await this.http.postJson<TgSendResp>(url, payload, headers);
        const messageId = String(res.result?.message_id ?? Date.now());
        return {
            channel: "telegram",
            messageId,
            providerMessageId: messageId,
            status: res.ok ? "sent" : "failed",
            timestamp: new Date().toISOString() as ISODateString,
            raw: res,
        };
    }
}
