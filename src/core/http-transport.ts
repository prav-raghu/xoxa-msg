import { Transport } from "../interfaces/xoxa-client.interface";
import { ISODateString, RequiredTransportConfig, TransportState, Unsubscribe, XoxaConfig } from "../types/global.type";
import { InboundMessage, OutboundMessage, DeliveryReceipt } from "../types/message.type";
import { HttpClient } from "../utilities/http-client";
import { XoxaNetworkError } from "./xoxa-error";

export interface HttpTransportConfig {
    baseUrl: string;
    headers?: Record<string, string>;
    timeoutMs?: number;
}

export class HttpTransport implements Transport {
    private state: TransportState = "idle";
    private onMsg: ((msg: InboundMessage) => void) | null = null;
    private http!: HttpClient;
    private runtimeCfg!: HttpTransportConfig;

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
        this.ensureConnected();
        this.runtimeCfg = { baseUrl: cfg.baseUrl!, headers: cfg.headers, timeoutMs: cfg.timeoutMs };
        const url = this.joinUrl(cfg.baseUrl!, "/v1/messages/send");
        type ApiResp = { id: string; status: "queued" | "sent" | "delivered" | "failed"; timestamp: string; detail?: string };
        const res = await this.http.postJson<ApiResp>(url, message, cfg.headers);
        if (this.onMsg) {
            const inbound: InboundMessage = {
                id: res.id,
                from: message.from ?? "system@xoxa",
                to: message.to,
                subject: message.subject,
                body: message.body,
                metadata: message.metadata,
                receivedAt: new Date().toISOString() as ISODateString,
            };
            this.onMsg(inbound);
        }
        return {
            messageId: res.id,
            status: res.status,
            timestamp: new Date(res.timestamp).toISOString() as ISODateString,
            detail: res.detail,
        };
    }

    private ensureConnected(): void {
        if (this.state !== "connected") throw new XoxaNetworkError("Transport not connected");
    }

    private joinUrl(base: string, path: string): string {
        const a = base.endsWith("/") ? base.slice(0, -1) : base;
        const b = path.startsWith("/") ? path : `/${path}`;
        return `${a}${b}`;
    }
}
