import { XoxaHTTPError, XoxaNetworkError, XoxaTimeoutError } from "../core/xoxa-error";

export class HttpClient {
    constructor(private readonly timeoutMs: number) {}

    public async postJson<T>(url: string, body: unknown, headers: Record<string, string>): Promise<T> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        const safeHeaders = Object.fromEntries(
            Object.entries(headers).map(([k, v]) => (k.toLowerCase().includes("authorization") ? [k, "***"] : [k, v])),
        );
        try {
            const resp = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...headers },
                body: JSON.stringify(body),
                signal: controller.signal,
            });
            const text = await resp.text();
            let parsed: any = undefined;
            try {
                parsed = text ? JSON.parse(text) : undefined;
            } catch {
                /* keep text */
            }
            if (!resp.ok) {
                const meta = parsed?.error ?? parsed;
                const friendly = meta?.message || `HTTP ${resp.status} when POST ${url}`;
                console.error("XOXA REQUEST URL:", url);
                console.error("XOXA REQUEST HEADERS:", safeHeaders);
                console.error("XOXA REQUEST BODY:", body);
                console.error("XOXA RESPONSE STATUS:", resp.status);
                console.error("XOXA RESPONSE BODY:", text);
                throw new XoxaHTTPError(resp.status, {
                    message: friendly,
                    raw: text,
                    parsed: parsed,
                    code: meta?.code,
                    subcode: meta?.error_subcode,
                    type: meta?.type,
                    fbtrace_id: meta?.fbtrace_id,
                    headers: Object.fromEntries(resp.headers.entries()),
                });
            }
            return (parsed ?? ({} as T)) as T;
        } catch (err: any) {
            if (err?.name === "AbortError") throw new XoxaTimeoutError();
            throw new XoxaNetworkError(err?.message || "network error");
        } finally {
            clearTimeout(timer);
        }
    }
}
