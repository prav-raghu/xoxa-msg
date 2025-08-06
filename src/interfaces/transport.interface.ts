import type { XoxaConfig, RequiredTransportConfig, Unsubscribe, TransportState } from "../types/global.type";
import type { OutboundMessage, InboundMessage, DeliveryReceipt } from "../types/message.type.ts";

export interface Transport {
    /** Channel this transport supports, e.g., 'sms' | 'whatsapp' | 'telegram' */
    readonly channel: OutboundMessage["channel"];

    /** Initialize any internal state/connection; should be idempotent. */
    connect(config: XoxaConfig): Promise<void>;

    /** Cleanup. */
    disconnect(): Promise<void>;

    /** Send a normalized message; throw typed errors on failure. */
    send(message: OutboundMessage, cfg: RequiredTransportConfig): Promise<DeliveryReceipt>;

    /** Subscribe to inbound messages (if transport supports receiving). */
    onMessage(handler: (msg: InboundMessage) => void): Unsubscribe;

    /** Optional: expose transport state for diagnostics. */
    getState?(): TransportState;
}
