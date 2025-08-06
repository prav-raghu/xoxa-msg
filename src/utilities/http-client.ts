import { XoxaHTTPError, XoxaNetworkError, XoxaTimeoutError } from "../core/xoxa-error";

export class HttpClient {
    constructor(private readonly timeoutMs: number) {}

    public async postJson<T>(url: string, body: unknown, headers: Record<string, string>): Promise<T> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const resp = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...headers },
                body: JSON.stringify(body),
                signal: controller.signal,
            });
            if (!resp.ok) {
                let parsed: unknown = undefined;
                try {
                    parsed = await resp.json();
                } catch {
                    /* ignore */
                }
                throw new XoxaHTTPError(resp.status, parsed);
            }
            return (await resp.json()) as T;
        } catch (err) {
            if ((err as Error).name === "AbortError") throw new XoxaTimeoutError();
            throw new XoxaNetworkError((err as Error).message);
        } finally {
            clearTimeout(timer);
        }
    }
}
