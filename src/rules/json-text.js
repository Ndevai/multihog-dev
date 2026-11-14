// A JSON object inside a model's text: where it ends, braces inside its strings read as text (a message quoting ":}", a
// whispered "{W …" from the notation).
/** The index of the brace that closes the object opening at `at`, or -1 when it does not close. */
export function objectEnd(s, at) {
    let depth = 0;
    for (let i = at, str = false; i < s.length; i++) {
        if (str) {
            if (s[i] === '\\')
                i++;
            else if (s[i] === '"')
                str = false;
            continue;
        }
        if (s[i] === '"')
            str = true;
        else if (s[i] === '{')
            depth++;
        else if (s[i] === '}' && --depth === 0)
            return i;
    }
    return -1;
}
