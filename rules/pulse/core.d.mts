export function boot(get: (p: string) => Promise<ArrayBuffer>): Promise<boolean>;
export function start(key: string, get: (p: string) => Promise<ArrayBuffer>, stateFile: string): Promise<boolean>;
export function stop(key: string): void;
export function has(key: string): boolean;
export function act(key: string, actions: unknown): boolean;
export function run(key: string, minutes: number): Record<string, number>[] | null;
