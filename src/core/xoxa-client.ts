import type { XoxaConfig, RequiredTransportConfig, TransportState, Unsubscribe, ISODateString, XoxaEvents } from "../types/global.type";
import type { InboundMessage, DeliveryReceipt, SendOptions, OutboundMessage } from "../types/message.type";
import type { Transport } from "../interfaces/transport.interface";
import type { Logger } from "../interfaces/logger.interface";
import { noopLogger } from "../utilities/logger";
import { Validator } from "../utilities/validator";
import { BackOffStrategy } from "./back-off-strategy";
import { TypedEvents } from "./typed-events";
import { DEFAULTS } from "../constants/constants";

export class XoxaClient {
    private readonly transports: Map<OutboundMessage["channel"], Transport> = new Map();
    private readonly logger: Logger;
    private readonly events = new TypedEvents<XoxaEvents>();
    private readonly backoff: BackOffStrategy;

    constructor(private readonly config: XoxaConfig, logger?: Logger) {
        const ua = config.userAgent ?? DEFAULTS.USER_AGENT;
        this.config = { ...config, userAgent: ua };
        this.logger = config.debug ? logger ?? console : logger ?? noopLogger;
        this.backoff = new BackOffStrategy(
            config.backoffBaseMs ?? DEFAULTS.BACKOFF_BASE_MS,
            config.backoffMaxMs ?? DEFAULTS.BACKOFF_MAX_MS,
        );
    }

    public registerTransport(transport: Transport): void {
        this.transports.set(transport.channel, transport);
    }

    public async connect(): Promise<void> {
        for (const t of this.transports.values()) {
            await t.connect(this.config);
            t.onMessage((msg) => this.events.emit("message", { message: msg }));
        }
        this.events.emit("connected", undefined);
    }

    public async disconnect(reason?: string): Promise<void> {
        for (const t of this.transports.values()) {
            await t.disconnect();
        }
        this.events.emit("disconnected", { reason });
        // Note: We intentionally do not clear subscribers to keep the instance reusable.
    }

    public async send(message: OutboundMessage, options?: SendOptions): Promise<DeliveryReceipt> {
        Validator.outbound(message);
        const transport = this.transports.get(message.channel);
        if (!transport) throw new Error(`No transport registered for channel "${message.channel}"`);

        const cfg: RequiredTransportConfig = {
            timeoutMs: options?.timeoutMs ?? this.config.timeoutMs ?? DEFAULTS.TIMEOUT_MS,
            userAgent: this.config.userAgent ?? DEFAULTS.USER_AGENT,
            headers: {
                "User-Agent": this.config.userAgent ?? DEFAULTS.USER_AGENT,
                "X-Xoxa-App-Id": this.config.appId,
                ...(message.dedupeKey ? { "Idempotency-Key": message.dedupeKey } : {}),
            },
        };

        const retries = options?.retries ?? this.config.maxRetries ?? DEFAULTS.MAX_RETRIES;
        let attempt = 0;

        while (true) {
            try {
                const normalized: OutboundMessage = {
                    ...message,
                    createdAt: message.createdAt ?? (new Date().toISOString() as ISODateString),
                };
                return await transport.send(normalized, cfg);
            } catch (err) {
                attempt += 1;
                const e = err instanceof Error ? err : new Error(String(err));
                if (attempt > retries) {
                    this.events.emit("error", { error: e });
                    throw e;
                }
                const delay = this.backoff.compute(attempt);
                this.logger.warn(`[xoxa] send retry #${attempt} in ${delay}ms`, e.message);
                await new Promise((res) => setTimeout(res, delay));
            }
        }
    }

    public onMessage(handler: (msg: InboundMessage) => void): Unsubscribe {
        return this.events.on("message", ({ message }) => handler(message));
    }

    public on<E extends keyof XoxaEvents>(event: E, listener: (payload: XoxaEvents[E]) => void): Unsubscribe {
        return this.events.on(event, listener);
    }

    public getTransportState(channel: OutboundMessage["channel"]): TransportState | "unknown" {
        const t = this.transports.get(channel);
        return t?.getState?.() ?? "unknown";
    }
}
