// JSON Schema for tool parameters, and the argument type each schema describes, so a tool's action is checked against
// the schema the model sees (one source for both).
export const str = (description) => ({ type: 'string', description });
