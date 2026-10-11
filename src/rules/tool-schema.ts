// JSON Schema for tool parameters, and the argument type each schema describes, so a tool's action is checked against
// the schema the model sees (one source for both).

export type Prop =
    | { type: 'string'; enum?: readonly string[]; description?: string }
    | { type: 'number'; description?: string }
    | { type: 'boolean'; description?: string }
    | { type: 'array'; items: Prop; description?: string }
    | { type: 'object'; properties: Record<string, Prop>; required?: readonly string[]; description?: string };
export type Props = Record<string, Prop>;

/** The value a property describes. A string enum built from a runtime list types as string. */
export type ValueOf<P> =
    P extends { type: 'string'; enum: readonly (infer E)[] } ? E
    : P extends { type: 'string' } ? string
    : P extends { type: 'number' } ? number
    : P extends { type: 'boolean' } ? boolean
    : P extends { type: 'array'; items: infer I } ? ValueOf<I>[]
    : P extends { type: 'object'; properties: infer Q; required: readonly (infer R)[] } ? ArgsOf<Q, R & string>
    : P extends { type: 'object'; properties: infer Q } ? ArgsOf<Q, never>
    : unknown;

type Simplify<T> = { [K in keyof T]: T[K] } & {};
/** Arguments of a schema: required keys present, the rest optional. */
export type ArgsOf<Ps, R extends string> = Simplify<
    { [K in keyof Ps & R]: ValueOf<Ps[K]> } & { [K in Exclude<keyof Ps, R>]?: ValueOf<Ps[K]> }
>;

export const str = (description: string) => ({ type: 'string' as const, description });
