import type {
    RequiredTransportConfig,
    XoxaConfig,
    Unsubscribe,
    TransportState,
    TwilioSmsConfig,
    DeliveryReceipt,
    InboundMessage,
    OutboundMessage,
} from "../types/global.type";
import type { Transport } from "../interfaces/transport.interface";
import type { TwilioRequestDto, TwilioResponseDto } from "../dtos/twilio.dto";
import { Twilio } from "../apis/twilio.api";
import { Buffer } from "buffer";

export class TwilioSmsTransport implements Transport {
    public readonly channel = "sms" as const;
    private state: TransportState = "idle";
    private onMsg: ((msg: InboundMessage) => void) | null = null;
    private readonly twilioSmsConfig!: TwilioSmsConfig;
    private api!: Twilio;

    constructor(_twilioSmsConfig: TwilioSmsConfig) {
        this.twilioSmsConfig = _twilioSmsConfig;
    }

    public async connect(config: XoxaConfig): Promise<void> {
        this.state = "connecting";
        this.api = new Twilio({
            timeout: config.timeoutMs ?? 15000,
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
        if (this.state !== "connected") throw new Error("Twilio Sms Transport Layer is not connected");
        const headers: Record<string, string> = {
            ...config.headers,
        };
        const model: TwilioRequestDto = {
            from: message.from ?? this.twilioSmsConfig.from!,
            to: message.to,
            body: message.body!,
            media: message.media?.map((m) => ({ url: m.url })) ?? undefined,
        };
        if (!model.from) throw new Error("TwilioSmsTransport: 'from' is required");
        if (!model.to) throw new Error("TwilioSmsTransport: 'to' is required");
        if (!model.body && (!model.media || model.media.length === 0)) {
            throw new Error("TwilioSmsTransport: either 'body' or at least one media item is required");
        }
        try {
            const resp = await this.api.sendTwilioSms(this.twilioSmsConfig.accountSid, this.twilioSmsConfig.authToken, model, headers);
            const data: TwilioResponseDto = resp.data;
            const id = data.sid ?? `tw_${Date.now()}`;
            return {
                channel: "sms",
                messageId: id,
                providerMessageId: id,
                status: this.mapTwilioStatus(data.status),
                timestamp: new Date().toISOString(),
                raw: data,
            };
        } catch (exception) {
            if (this.isAxiosErrorWithResponse<TwilioResponseDto>(exception)) {
                const status = exception?.response?.status;
                const data = exception?.response?.data;
                const code = (data as any)?.code;
                const message = (data as any)?.message ?? "Twilio API error";
                throw new Error(`Twilio HTTP ${status} (code ${code ?? "?"}): ${message}`);
            }
            throw exception instanceof Error ? exception : new Error(String(exception));
        }
    }

    private mapTwilioStatus(status: string): "queued" | "sent" | "delivered" | "failed" | "unknown" {
        switch (status) {
            case "queued":
                return "queued";
            case "accepted":
            case "sending":
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

    private isAxiosErrorWithResponse<T>(e: unknown): e is { response: { status: number; data: T } } {
        return typeof e === "object" && e !== null && "response" in e && !!(e as any).response?.status;
    }
}
