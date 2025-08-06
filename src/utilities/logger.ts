import type { Logger } from "../interfaces/logger.interface";

export const noopLogger: Logger = {
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
};
