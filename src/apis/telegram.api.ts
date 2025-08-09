import { AxiosRequestConfig } from "axios";
import { BaseApi } from "./api";
import { TelegramRequestDto, TelegramResponseDto } from "../dtos/telegram.dto";

export class TelegramApi extends BaseApi {
    headers: any;
    constructor(config?: AxiosRequestConfig) {
        super("https://api.telegram.org", config);
    }

    public async sendTelegramBotMessage(
        botToken: string,
        model: TelegramRequestDto,
        headers?: Record<string, string>,
    ): Promise<TelegramResponseDto> {
        const url = `${this.baseUrl}/bot${botToken}/${model.media?.length ? "sendDocument" : "sendMessage"}`;
        const headersWithDefaults = { ...this.headers, ...headers };
        interface SendDocumentPayload {
            chat_id: string;
            document: string;
            caption?: string;
        }
        interface SendMessagePayload {
            chat_id: string;
            text: string;
        }
        const payload: SendDocumentPayload | SendMessagePayload = model.media?.length
            ? { chat_id: model.to, document: model.media[0].url, caption: model.media[0].caption ?? model.body }
            : { chat_id: model.to, text: model.body ?? "" };

        const response = await this.post<SendDocumentPayload | SendMessagePayload, TelegramResponseDto>(url, payload, headersWithDefaults);
        return response;
    }
}
