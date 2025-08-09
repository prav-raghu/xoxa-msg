import { AxiosRequestConfig, AxiosResponse } from "axios";
import type { OutboundMessage } from "../types/global.type";
import { BaseApi } from "../apis/api";

export type HttpSendResp = {
    id: string;
    status: "queued" | "sent" | "delivered" | "failed";
    timestamp: string;
    detail?: string;
};

export class XoxaHttpApi extends BaseApi {
    constructor(baseUrl: string, config?: AxiosRequestConfig) {
        super(baseUrl, config);
    }

    public async sendMessage(payload: OutboundMessage, headers?: Record<string, string>): Promise<AxiosResponse<HttpSendResp>> {
        return this.post<OutboundMessage, HttpSendResp>("v1/messages/send", payload, undefined, headers);
    }
}
