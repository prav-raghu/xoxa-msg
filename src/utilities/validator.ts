import { CHANNELS } from "../constants/constants";
import { XoxaValidationError } from "../core/xoxa-error";
import { OutboundMessage } from "../types/message.type";

export class Validator {
    public static outbound(msg: OutboundMessage): void {
        if (!CHANNELS.includes(msg.channel as (typeof CHANNELS)[number]))
            throw new XoxaValidationError(`Unsupported channel: ${msg.channel}`);
        if (!msg.to) throw new XoxaValidationError('Missing "to"');
        if (!msg.body && (!msg.media || msg.media.length === 0)) {
            throw new XoxaValidationError('Message requires "body" or at least one media attachment');
        }
        if (msg.media && msg.media.length > 0) {
            for (const m of msg.media) {
                if (!m.url) throw new XoxaValidationError("Media requires url");
            }
        }
    }
}
