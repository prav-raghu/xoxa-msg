import type { Unsubscribe } from "../types/global.type";

export class TypedEvents<T extends Record<string, unknown>> {
    private readonly listeners: { [K in keyof T]?: Array<(payload: T[K]) => void> } = {};

    public on<K extends keyof T>(event: K, listener: (payload: T[K]) => void): Unsubscribe {
        const arr = (this.listeners[event] ??= []);
        arr.push(listener);
        return () => this.off(event, listener);
    }

    public off<K extends keyof T>(event: K, listener: (payload: T[K]) => void): void {
        const arr = this.listeners[event];
        if (!arr) return;
        const idx = arr.indexOf(listener);
        if (idx >= 0) arr.splice(idx, 1);
    }

    public emit<K extends keyof T>(event: K, payload: T[K]): void {
        const arr = this.listeners[event];
        if (!arr) return;
        for (const fn of [...arr]) fn(payload);
    }

    public clearAll(): void {
        (Object.keys(this.listeners) as Array<keyof T>).forEach((k) => delete this.listeners[k]);
    }
}
