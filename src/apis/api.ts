import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { DEFAULTS } from "../configs/constants";

export class BaseApi {
    protected axios: AxiosInstance;
    protected baseUrl: string;

    constructor(_baseURL: string, config?: AxiosRequestConfig) {
        this.axios = axios.create({
            baseURL: _baseURL,
            timeout: DEFAULTS.TIMEOUT_MS,
            headers: { "User-Agent": DEFAULTS.USER_AGENT, ...(config?.headers || {}) },
            ...config,
        });
        this.baseUrl = _baseURL;
        this.axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const { config } = error;
                config.__retryCount = config.__retryCount || 0;
                if (config.__retryCount < DEFAULTS.MAX_RETRIES && (!error.response || error.response.status >= 500)) {
                    config.__retryCount += 1;
                    const backoff = Math.min(DEFAULTS.BACKOFF_BASE_MS * Math.pow(2, config.__retryCount - 1), DEFAULTS.BACKOFF_MAX_MS);
                    await new Promise((res) => setTimeout(res, backoff));
                    return this.axios(config);
                }
                let rejectionError: Error;
                if (error instanceof Error) {
                    rejectionError = error;
                } else if (typeof error === "string") {
                    rejectionError = new Error(error);
                } else {
                    rejectionError = new Error(JSON.stringify(error));
                }
                return Promise.reject(rejectionError);
            },
        );
    }

    public async get<T = unknown>(
        path: string,
        params?: Record<string, unknown> | null,
        headers?: Record<string, string>,
    ): Promise<AxiosResponse<T>> {
        const result = await this.axios.get<T>(`${this.baseUrl}/${path}`, {
            params,
            headers,
        });
        return result;
    }

    public async post<T = unknown, R = T>(
        path: string,
        data: T,
        params?: Record<string, unknown>,
        headers?: Record<string, string>,
    ): Promise<AxiosResponse<R>> {
        const result = await this.axios.post<T, AxiosResponse<R>>(`${this.baseUrl}/${path}`, data, {
            params,
            headers,
        });
        return result;
    }

    public async put<T = unknown, R = T>(
        path: string,
        data: T,
        params?: Record<string, unknown>,
        headers?: Record<string, string>,
    ): Promise<AxiosResponse<R>> {
        const result = await this.axios.put<T, AxiosResponse<R>>(`${this.baseUrl}/${path}`, data, {
            params,
            headers,
        });
        return result;
    }
    public async patch<T = unknown, R = T>(
        path: string,
        data: T,
        params?: Record<string, unknown>,
        headers?: Record<string, string>,
    ): Promise<AxiosResponse<R>> {
        const result = await this.axios.patch<T, AxiosResponse<R>>(`${this.baseUrl}/${path}`, data, {
            params,
            headers,
        });
        return result;
    }

    public async delete<T = unknown>(
        path: string,
        params?: Record<string, unknown>,
        headers?: Record<string, string>,
    ): Promise<AxiosResponse<T>> {
        const result = await this.axios.delete<T>(`${this.baseUrl}/${path}`, {
            params,
            headers,
        });
        return result;
    }
}
