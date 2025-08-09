import { AxiosRequestConfig, AxiosResponse } from "axios";
import { BaseApi } from "./api";
import { WhatsAppRequestDto, WhatsAppResponseDto } from "../dtos/meta.dto";

export class MetaApi extends BaseApi {
    constructor(config?: AxiosRequestConfig) {
        super("https://graph.facebook.com/v22.0", config);
    }

    public async sendWhatsappMessage(
        phoneNumberId: string,
        accessToken: string,
        model: WhatsAppRequestDto,
        headers?: Record<string, string>,
    ): Promise<AxiosResponse<WhatsAppResponseDto>> {
        const response = await this.post<WhatsAppRequestDto, WhatsAppResponseDto>(
            `${phoneNumberId}/messages?access_token=${accessToken}`,
            model,
            { headers },
        );
        return response;
    }
}
