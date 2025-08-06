export class FormClient {
    constructor(private readonly timeoutMs: number) {}

    public async postForm<T>(url: string, form: Record<string, string> | URLSearchParams, headers: Record<string, string>): Promise<T> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const body = form instanceof URLSearchParams ? form.toString() : new URLSearchParams(form).toString();
            const resp = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers },
                body,
                signal: controller.signal,
            });
            if (!resp.ok) {
                const text = await resp.text().catch(() => "");
                try {
                    const json = JSON.parse(text);
                    throw new Error(`HTTP ${resp.status}: ${JSON.stringify(json)}`);
                } catch {
                    throw new Error(`HTTP ${resp.status}: ${text}`);
                }
            }
            return (await resp.json()) as T;
        } finally {
            clearTimeout(timer);
        }
    }
}
