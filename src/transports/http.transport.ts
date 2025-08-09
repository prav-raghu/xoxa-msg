import { Transport } from "../interfaces/xoxa-client.interface";
import {
    DeliveryReceipt,
    InboundMessage,
    OutboundMessage,
    RequiredTransportConfig,
    TransportState,
    Unsubscribe,
    XoxaConfig,
} from "../types/global.type";
import { XoxaNetworkError } from "../core/xoxa-error";
import { HttpSendResp, XoxaHttpApi } from "../core/xoxa-http";

export interface HttpTransportConfig {
    baseUrl: string;
    headers?: Record<string, string>;
    timeoutMs?: number;
}

export class HttpTransport implements Transport {
    private state: TransportState = "idle";
    private onMsg: ((msg: InboundMessage) => void) | null = null;
    private api!: XoxaHttpApi;
    private readonly runTimeConfig!: HttpTransportConfig;

    constructor(config: HttpTransportConfig) {
        this.runTimeConfig = config;
    }

    public async connect(config: XoxaConfig): Promise<void> {
        this.state = "connecting";
        this.api = new XoxaHttpApi(this.runTimeConfig.baseUrl, {
            timeout: this.runTimeConfig.timeoutMs ?? config.timeoutMs ?? 15000,
            headers: this.runTimeConfig.headers,
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
        this.ensureConnected();
        const headers = { ...(this.runTimeConfig.headers ?? {}), ...(config.headers ?? {}) };
        const resp = await this.api.sendMessage(message, headers);
        const data: HttpSendResp = resp.data;
        if (this.onMsg) {
            const inbound: InboundMessage = {
                id: data.id,
                from: message.from ?? "system@xoxa",
                to: message.to,
                subject: message.subject,
                body: message.body,
                metadata: message.metadata,
                receivedAt: new Date().toISOString(),
            };
            this.onMsg(inbound);
        }

        return {
            messageId: data.id,
            status: data.status,
            timestamp: new Date(data.timestamp).toISOString(),
            detail: data.detail,
        };
    }

    private ensureConnected(): void {
        if (this.state !== "connected") throw new XoxaNetworkError("Transport not connected");
    }
}
