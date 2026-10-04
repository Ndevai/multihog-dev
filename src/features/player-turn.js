// Player turn: the narrator ends a reply at a beat that is {{user}}'s to play by adding
// <player_turn>cue</player_turn>; code removes the tag before anything else reads the message
// and shows the cue above the input until the user sends a turn.

const TAG = /<player_turn>([\s\S]*?)<\/?player_turn\/?>/gi;
const META_KEY = 'playerTurnCue';
const BANNER_ID = 'rt_player_turn_banner';
const DEFAULT_CUE = 'Your turn.';

export const PLAYER_TURN_PROMPT = `<player_turn>
When the scene reaches a beat where the next event is {{user}}'s own action or words, end the reply at that beat and add one last line, after the footer and any choices: <player_turn>a short in-scene cue</player_turn>, e.g. <player_turn>He holds out his hand for the wrench.</player_turn>. Use it at most once per reply, and only at such a beat; every other reply continues the scene to its natural stopping point.
</player_turn>`;

/** Text without the tag, and the cue it carried ('' when the tag was empty, null when absent). */
export function takePlayerTurn(text) {
    let cue = null;
    const cleaned = String(text ?? '').replace(TAG, (_, inner) => { cue = String(inner).trim(); return ''; });
    if (cue === null) return { text, cue: null };
    return { text: cleaned.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trimEnd(), cue };
}

function banner(cue) {
    document.getElementById(BANNER_ID)?.remove();
    if (cue === null || cue === undefined) return;
    const form = document.getElementById('send_form');
    if (!form) return;
    const el = document.createElement('div');
    el.id = BANNER_ID;
    el.className = 'rt-player-turn-banner';
    el.title = 'Click to dismiss';
    el.textContent = cue || DEFAULT_CUE;
    el.addEventListener('click', () => setCue(null));
    form.parentElement?.insertBefore(el, form);
}

function setCue(cue) {
    const ctx = SillyTavern.getContext();
    if (ctx.chatMetadata) {
        if (cue === null) delete ctx.chatMetadata[META_KEY];
        else ctx.chatMetadata[META_KEY] = cue;
        (ctx.saveMetadataDebounced || ctx.saveMetadata)?.();
    }
    banner(cue);
}

/** MESSAGE_RECEIVED, registered first: the newest reply sets or clears the cue. */
export function onPlayerTurnMessage(messageId) {
    const ctx = SillyTavern.getContext();
    const msg = ctx.chat?.[messageId];
    if (!msg || msg.is_user || msg.is_system) return;
    const { text, cue } = takePlayerTurn(msg.mes);
    if (cue !== null) {
        msg.mes = text;
        if (Array.isArray(msg.swipes) && typeof msg.swipes[msg.swipe_id ?? 0] === 'string') msg.swipes[msg.swipe_id ?? 0] = text;
    }
    setCue(cue);
}

export const onPlayerTurnSent = () => setCue(null);

export function onPlayerTurnChatChanged() {
    banner(SillyTavern.getContext().chatMetadata?.[META_KEY] ?? null);
}
