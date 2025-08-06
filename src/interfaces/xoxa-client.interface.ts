import { Unsubscribe, TransportState, XoxaConfig, RequiredTransportConfig } from "../types/global.type";
import { DeliveryReceipt, InboundMessage, OutboundMessage } from "../types/message.type";

export interface Transport {
    connect(config: XoxaConfig): Promise<void>;
    disconnect(): Promise<void>;
    send(message: OutboundMessage, cfg: RequiredTransportConfig): Promise<DeliveryReceipt>;
    onMessage(handler: (msg: InboundMessage) => void): Unsubscribe;
    getState?(): TransportState;
}
