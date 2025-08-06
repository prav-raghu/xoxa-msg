// Core
export { XoxaClient } from "./core/xoxa-client";
export { BackOffStrategy } from "./core/back-off-strategy";
export { TypedEvents } from "./core/typed-events";

// Errors
export {
    XoxaError,
    XoxaTimeoutError,
    XoxaNetworkError,
    XoxaHTTPError,
    XoxaValidationError,
    XoxaUnsupportedFeatureError,
} from "./core/xoxa-error";

// Types
export type { XoxaConfig, RequiredTransportConfig, TransportState, Unsubscribe, ISODateString, Channel } from "./types/global.type";
export type { MediaAttachment, OutboundMessage, InboundMessage, DeliveryReceipt, DeliveryStatus, SendOptions } from "./types/message.type";

// Interfaces
export type { Transport } from "./interfaces/transport.interface";
export type { Logger } from "./interfaces/logger.interface";

// Utilities
export { Validator } from "./utilities/validator";
export { noopLogger } from "./utilities/logger";

// Transports (optional exports)
export { TwilioSmsTransport } from "./transports/twilio-sms.transport";
export { WhatsAppTransport } from "./transports/whatsapp-cloud.transport";
export { TelegramTransport } from "./transports/telegram-bot.transport";
