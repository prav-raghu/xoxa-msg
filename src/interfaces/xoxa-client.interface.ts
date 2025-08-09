import {
    Unsubscribe,
    TransportState,
    XoxaConfig,
    RequiredTransportConfig,
    DeliveryReceipt,
    InboundMessage,
    OutboundMessage,
} from "../types/global.type";

export interface Transport {
    connect(config: XoxaConfig): Promise<void>;
    disconnect(): Promise<void>;
    send(message: OutboundMessage, cfg: RequiredTransportConfig): Promise<DeliveryReceipt>;
    onMessage(handler: (msg: InboundMessage) => void): Unsubscribe;
    getState?(): TransportState;
}
