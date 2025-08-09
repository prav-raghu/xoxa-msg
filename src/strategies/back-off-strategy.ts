export class BackOffStrategy {
    constructor(private readonly baseMs: number, private readonly maxMs: number) {}
    public compute(attempt: number): number {
        const raw = Math.min(this.maxMs, Math.floor(this.baseMs * Math.pow(2, attempt - 1)));
        const jitter = Math.floor(raw * (0.75 + Math.random() * 0.5));
        return Math.max(this.baseMs, jitter);
    }
}
