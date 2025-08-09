import { AxiosRequestConfig, AxiosResponse } from "axios";
import { BaseApi } from "./api";
import { TwilioRequestDto, TwilioResponseDto } from "../dtos/twilio.dto";

export class Twilio extends BaseApi {
    constructor(config?: AxiosRequestConfig) {
        super("https://api.twilio.com/2010-04-01", config);
    }

    public async sendTwilioSms(
        accountSid: string,
        authToken: string,
        model: TwilioRequestDto,
        headers?: Record<string, string>,
    ): Promise<AxiosResponse<TwilioResponseDto>> {
        const url = `Accounts/${accountSid}/Messages.json`;
        const form = new URLSearchParams();
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
        const authHeader = { Authorization: `Basic ${auth}` };
        if (model.from) form.append("From", model.from);
        if (model.to) form.append("To", model.to);
        if (model.body) form.append("Body", model.body);
        if (model.media && Array.isArray(model.media)) {
            for (const media of model.media) {
                if (media.url) form.append("MediaUrl", media.url);
            }
        }
        const headersWithAuthAndFormEncoding = {
            "Content-Type": "application/x-www-form-urlencoded",
            ...authHeader,
            ...headers,
        };
        const response = await this.post<URLSearchParams, TwilioResponseDto>(url, form, undefined, headersWithAuthAndFormEncoding);
        return response;
    }
}
