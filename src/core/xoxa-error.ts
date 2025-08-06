export class XoxaError extends Error {
    constructor(msg: string) {
        super(msg);
        this.name = "XoxaError";
    }
}
export class XoxaTimeoutError extends XoxaError {
    constructor(msg = "Request timed out") {
        super(msg);
        this.name = "XoxaTimeoutError";
    }
}
export class XoxaNetworkError extends XoxaError {
    constructor(msg: string) {
        super(msg);
        this.name = "XoxaNetworkError";
    }
}
export class XoxaHTTPError extends XoxaError {
    constructor(public readonly status: number, public readonly body?: unknown, msg = `HTTP ${status}`) {
        super(msg);
        this.name = "XoxaHTTPError";
    }
}
export class XoxaValidationError extends XoxaError {
    constructor(msg: string) {
        super(msg);
        this.name = "XoxaValidationError";
    }
}
export class XoxaUnsupportedFeatureError extends XoxaError {
    constructor(msg: string) {
        super(msg);
        this.name = "XoxaUnsupportedFeatureError";
    }
}
