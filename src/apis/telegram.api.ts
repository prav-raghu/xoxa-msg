import { AxiosRequestConfig, AxiosResponse } from "axios";
import { BaseApi } from "./api";
import { TelegramRequestDto, TelegramResponseDto } from "../dtos/telegram.dto";
type SendMessagePayload = { chat_id: string; text: string };
type MediaPayload =
    | { chat_id: string; document: string; caption?: string }
    | { chat_id: string; photo: string; caption?: string }
    | { chat_id: string; audio: string; caption?: string }
    | { chat_id: string; video: string; caption?: string };

const MEDIA_METHOD_MAP = {
    image: { method: "sendPhoto" as const, key: "photo" as const },
    audio: { method: "sendAudio" as const, key: "audio" as const },
    video: { method: "sendVideo" as const, key: "video" as const },
    document: { method: "sendDocument" as const, key: "document" as const },
};

export class TelegramApi extends BaseApi {
    constructor(config?: AxiosRequestConfig) {
        super("https://api.telegram.org", config);
    }

    public async sendTelegramBotMessage(
        botToken: string,
        model: TelegramRequestDto,
        headers?: Record<string, string>,
    ): Promise<AxiosResponse<TelegramResponseDto>> {
        const media = model.media?.[0];
        if (!media) {
            const path = `bot${botToken}/sendMessage`;
            const payload: SendMessagePayload = { chat_id: model.to, text: model.body ?? "" };
            return this.post<SendMessagePayload, TelegramResponseDto>(path, payload, undefined, headers);
        }
        const map = MEDIA_METHOD_MAP[media.kind];
        const path = `bot${botToken}/${map.method}`;
        const base: Omit<Extract<MediaPayload, { caption?: string }>, "photo" | "audio" | "video" | "document"> = {
            chat_id: model.to,
            ...(media.caption || model.body ? { caption: media.caption ?? model.body } : {}),
        };
        const payload = { ...base, [map.key]: media.url } as MediaPayload;
        return this.post<MediaPayload, TelegramResponseDto>(path, payload, undefined, headers);
    }
}
