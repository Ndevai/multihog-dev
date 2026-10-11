// The parts of SillyTavern's extension context the rules engine uses (public/scripts/st-context.js).

/** One chat message; tool calls made while writing it sit in extra.tool_invocations. */
interface STMessage {
    is_user?: boolean; is_system?: boolean; name?: string; mes: string; swipe_id?: number;
    extra?: { tool_invocations?: { name: string; result: unknown; parameters?: string }[]; rulesAudit?: Record<number, unknown>; [k: string]: unknown };
}
/** A function tool as registerFunctionTool takes it. */
interface STFunctionTool {
    name: string; displayName?: string; description: string;
    parameters: { $schema?: string; type: 'object'; properties: Record<string, unknown>; required?: string[] };
    action: (args: any) => unknown | Promise<unknown>;
    formatMessage?: (args: any) => string; shouldRegister?: () => boolean | Promise<boolean>; stealth?: boolean;
}
interface STContext {
    chat: STMessage[];
    chatMetadata: Record<string, any>;
    registerFunctionTool?: (tool: STFunctionTool) => void;
    unregisterFunctionTool?: (name: string) => void;
    saveChat?: () => Promise<void>; saveChatDebounced?: () => void;
    saveMetadata?: () => Promise<void>; saveMetadataDebounced?: () => void;
    [k: string]: unknown;
}
declare const SillyTavern: { getContext(): STContext };
