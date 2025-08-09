import type {
    RequiredTransportConfig,
    XoxaConfig,
    Unsubscribe,
    TransportState,
    TelegramConfig,
    InboundMessage,
    OutboundMessage,
    DeliveryReceipt,
} from "../types/global.type";
import type { Transport } from "../interfaces/transport.interface";
import type { TelegramRequestDto, TelegramResponseDto } from "../dtos/telegram.dto";
import { TelegramApi } from "../apis/telegram.api";

export class TelegramTransport implements Transport {
    public readonly channel = "telegram" as const;
    private state: TransportState = "idle";
    private onMsg: ((msg: InboundMessage) => void) | null = null;
    private api!: TelegramApi;
    private readonly config!: TelegramConfig;

    constructor(config: TelegramConfig) {
        this.config = config;
    }

    public async connect(config: XoxaConfig): Promise<void> {
        this.state = "connecting";
        this.api = new TelegramApi({
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
        if (this.state !== "connected") throw new Error("TelegramTransport not connected");
        const dto: TelegramRequestDto = {
            to: message.to,
            body: message.body!,
            media: message.media?.map((m) => ({
                kind: m.kind,
                url: m.url,
                caption: m.caption,
            })),
        };
        const resp = await this.api.sendTelegramBotMessage(this.config.botToken, dto, config.headers);
        const data: TelegramResponseDto = resp.data;
        const ok = Boolean(data.ok);
        const messageId = String(data.result?.message_id ?? Date.now());
        if (this.onMsg) {
            const inbound: InboundMessage = {
                id: messageId,
                from: this.config.botUsername ?? "xoxa-telegram-bot",
                to: message.to,
                subject: message.subject,
                body: message.body,
                metadata: message.metadata,
                receivedAt: new Date().toISOString(),
            };
            this.onMsg(inbound);
        }

        return {
            channel: "telegram",
            messageId,
            providerMessageId: messageId,
            status: ok ? "sent" : "failed",
            detail: ok ? undefined : data.description ?? "telegram send failed",
            timestamp: new Date().toISOString(),
            raw: data,
        };
    }
}
