import { InboundMessage } from "./message.type";

export type ISODateString = `${number}-${number}-${number}T${number}:${number}:${number}${string}`;
export type Unsubscribe = () => void;
export type TransportState = "idle" | "connecting" | "connected" | "closing" | "closed" | "error";
export type Channel = "sms" | "whatsapp" | "telegram";
export type WaResp = { messages: Array<{ id: string }> };
export type TwilioSendResp = { sid: string; status: string; date_created: string };
export type TgSendResp = { ok: boolean; result?: { message_id: number; date: number } };
export type XoxaEvents = {
    connected: void;
    disconnected: { reason?: string };
    error: { error: Error };
    message: { message: InboundMessage };
    state: { state: TransportState };
};
export interface XoxaConfig {
    appId: string;
    userAgent?: string;
    timeoutMs?: number;
    maxRetries?: number;
    backoffBaseMs?: number;
    backoffMaxMs?: number;
    debug?: boolean;
}

export interface TwilioSmsConfig {
    accountSid: string;
    authToken: string;
    baseUrl?: string;
}

export interface RequiredTransportConfig {
    baseUrl?: string;
    timeoutMs: number;
    headers: Record<string, string>;
    userAgent: string;
}

export interface TelegramConfig {
    botToken: string;
    baseUrl?: string;
}
