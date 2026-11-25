# Visual novel interfaces, set beside this one

A survey of how visual novels and game-accessibility guidance present text, made on 2026-11-25 at the player's request ("websearch for visual novel ideas on designs and how it would compare to mine"). Each row: the convention and its source, what this extension does (measured in SillyTavern 1.19.1 where a number is given), and the difference. Evidence levels: *published* (source read), *measured* (here), *derived* (computed from those), [ASSUMED].

## The comparison

| Part | Convention (source) | This extension | Difference |
|---|---|---|---|
| Text box and name | A box at the foot of the screen; the speaker's name above the text at its left; the box leaves about a third empty (Fuwanovel, "UI design – an anatomy of visual novels"). A name when a new speaker starts, not repeated while they go on (Xbox Accessibility Guidelines). | The night box at the foot; a slanted pink tag at the left with the speaker's name, "SPEAKING" at its right; narration has no name. | Same layout and rule; the tag shows the name on every said stretch, which also covers a change of speaker. |
| ADV and NVL | ADV, a line at a time in a bottom box, is the common form; NVL fills most of the screen and its lines gather until the author clears them; games mix the two by scene (DEV, "ADV vs NVL style in Ren'Py"; Fuwanovel). | ADV by default; a single sentence of 340 characters or more turns the box tall (NVL, up to 74 % of the screen) and scrolls. | NVL here is a taller box for one long sentence, chosen by length, not by the author; lines do not gather. |
| Type size and line length | 45–75 characters a line for reading (Bringhurst, via UXPin); people read fastest at about 100 on screen but prefer 45–72 (Dyson 2004, via O'Reilly); WCAG 1.4.8: 80 or fewer. Phones: 30–50 (a vendor's guide, no study found). | 27.5 px type, 46.75 px lines (*measured*): **20 characters a line at 360 px wide, 25 at 412 px**. The size is the critical print size (0.2° of x-height) at **58 cm, the farthest a phone was held** in Bababekova et al. 2011 (17.5–58 cm, mean 36.2). | Lines a third to a half shorter than the phone range. At the mean distance the same rule gives about 17.9 px (the page's own size wins), about 38 characters a line at 412 px (*derived*: 27.5 × 36.2 / 58 = 17.2 px). |
| Contrast | 4.5:1 for text, 3:1 for large text, 7:1 for a high-contrast mode (Unity accessibility guide; WCAG 1.4.3, 1.4.6). Subtitles on a backing at about 50 % (subtitle guides). | White on the see-through panel 7.9:1, light sky blue 4.6:1, gold 5.6:1 over a white background (R42); forced colours draw borders and system colours. | Meets 4.5:1; no in-extension high-contrast switch (the system's forced colours stand in). |
| Text speed and AUTO | Separate sliders for text speed and the auto delay; auto as a base delay plus a delay a character, one game's defaults 1.5 s + 2.5 s a 60 characters (itch.io dev post); slider directions often confused. | Said words appear at the speaker's own syllable rate, other text at silent-reading pace; AUTO waits reading time at 260 words a minute (Brysbaert 2019), about 231 ms a word, about 42 ms a character (*derived*), plus one word. "Letters appear one by one" on or off. | The same per-character pace as that default, from a published reading rate; no base delay; no speed sliders. |
| Click to continue | A mark that the line has all appeared (no standard found). | A blinking ▼ in the frame's corner; still for reduced motion. | Same. |
| Touch | Tap goes on; a tap while letters appear shows the rest; **hold skips**; hide the box with a button or a swipe down; gestures hidden, so each needs a visible button (itch.io posts; UX Planet). | Tap goes on; a tap shows the rest; a sideways swipe steps on or back; **hold explains** the held word; ◀ ▶ AUTO ♪ Story Log buttons. | Hold means something else here (no read text to skip: each reply is new). **No way to hide the box** to see the scene or the picture. |
| Backlog and rollback | A backlog of recent lines, often with voice replay; rollback in about half of the Ren'Py games one developer counted (Giant Bomb; itch.io). | Log shows the whole chat, typeset; ◀ steps back through the boxes; SillyTavern's swipes and edits. | **No voice replay** in the log (the voices exist). |
| Box transparency | A "textbox opacity" option is common; H or a button hides the box (itch.io, Steam posts). | The panel is fixed at 74 % opacity, the least at which light sky blue keeps 4.5:1 over white. | No setting; one below 74 % would break contrast. |
| Glossary | TIPS lists and in-game encyclopedias for a story's terms (Steins;Gate; "in-game encyclopedia – an anatomy of visual novels"). | Hold a marked word for its marks; select a word for its path (what the engine decided and why); Memory lists what the player's character knows, with its source. | Richer: each entry is the engine's own record, not written in advance. |
| Flowchart and timeline | Zero Escape's flowchart: jump to any finished section; 428's five timelines; the flowchart's cost is the mystery it gives away (Game Developer; Fuwanovel). | The Time tab: the story's stamped turns on a line, dragged or stepped, the box jumping to the turn. | A single timeline of what happened, so nothing ahead is given away. |
| Meeting a character | Danganronpa's introductions; Persona's portraits and motion (Game Developer; GamesRadar). | The first-meeting card: picture, shadow, tilted label, trade. | Same family of design. |
| Highlighted words | Danganronpa marks statements to attack in orange; critics: the colour points at the answer (Kotaku; Giant Bomb). | Gold marks what the engine decided. | No puzzle to give away; the gold informs. |
| Accessibility menu | Ren'Py: font override (OpenDyslexic), text size, high contrast, self-voicing that reads the interface (Ren'Py docs; itch.io devlogs). | SillyTavern's font scale enlarges the box; forced colours; axe-core finds no violation (v32); characters' voices. | **No dyslexia font or high-contrast switch** of its own; nothing reads the interface aloud. |
| Dialogue as a column | Disco Elysium: a tall column at the right, text rising like a feed, for a 16:9 screen (80.lv; Kurvitz interview). | The box at the foot on every screen; on a desktop the column is SillyTavern's. | A right-hand column could suit a desktop; not a phone. |

## Measured in two open-source engines

WebGAL 4.6.7 (npm `webgal-engine`, MPL-2.0) and Monogatari 2.8.1 (npm `@monogatari/core`, MIT), default themes, served locally and driven by Playwright Chromium at 412 × 915 (WebGAL also at 915 × 412), each given SillyTavern 1.19.1's "landscape autumn great tree" background, Seraphina's `neutral` and `caring` sprites and the lines of `real-st/seed.mjs`. All values *measured* unless marked.

| Part | WebGAL | Monogatari | This extension |
|---|---|---|---|
| Phone upright | The 16:9 stage turned 90°; the player rotates the phone | The scene cropped to the phone; default setting `Orientation: 'landscape'` | Laid out for the upright phone |
| Box text | 51.2 px on a 2560-wide stage × 0.286 = 14.6 px | 16 px Open Sans | 27.5 px |
| Characters a line | 77–78 (landscape) | 55 (412 px) | 25 (412 px), 20 (360 px) |
| A 342-character sentence | 5 rows in a box with room for 2; after 30 s, 62 of 132 word pieces inside the box, the rest under the menu bar and off the screen | NVL only when the script says `nvl`: the screen dims and lines gather from the top | 340 characters or more turn the box tall by length; it scrolls |
| Hide the box | Hide in the menu bar; a tap brings it back | An eye icon at the top | None |
| Box opacity | A Textbox Opacity slider (Options › Display) | Fixed black at 50 %; white text over a white scene 4.0:1 (*derived*) | Fixed at 74 %, light sky blue 4.6:1 over white |
| Speed settings | Text Speed (Display), Autoplay Speed (System) | Text Speed and Autoplay Speed sliders | Letters one by one, on or off |
| Backlog | Each line has a ↺ that returns the story to that line (pressed: the box went back to Seraphina's first line); Replay in the menu bar | A list of names and lines | Log of the whole chat; ◀ steps back |
| Text size and font | Small, Medium, Large; three fonts | None in its settings | SillyTavern's font scale |
| Continue mark | None after a finished line | None after a finished line | A blinking ▼ |

Side by side with screenshots: the "Box Beside the Genre" page, a private Claude artifact at https://claude.ai/artifact/BSWFaLAR8b5cZ6YmQdysGD (the owner can open it; another Claude reads it with the Artifact tool's `read` action). Method, scripts and the page's template: `history/review-tests/browser/vn-engines/`.

## Published games (screenshots on Wikipedia)

Each row: what the screenshot shows (*seen* on the file named), and this extension beside it.

| Part | Published games | This extension |
|---|---|---|
| Text box and name | Doki Doki Literature Club (Ren'Py), a Ren'Py example, Camelia Girls: the name in its own tab or line above the text, at the left. Katawa Shoujo: narration with no name. Clannad: the name inside the line before 「 」 (Japanese style). | A slanted tag at the left for said words; narration unnamed |
| A long passage | Fate/stay night: NVL, the text over the whole dimmed screen | The box grows tall (340 characters or more) and scrolls |
| Date on screen | Steins;Gate "7/28 (THU)", Clannad "April 15", Persona 5 "6/15 Wed, Afternoon", each at the top left | The clock chip at the top left: hour, date, place |
| Highlighted words | Phoenix Wright: testimony in green, to Press or Present against. Steins;Gate: words in a text message underlined in blue, selected to reply (Wikipedia's article, *published*). Danganronpa: the statement to attack in orange. | Gold marks words the engine decided; nothing to answer or attack |
| Dialogue as a column | Disco Elysium: a tall column at the right | The box at the foot of SillyTavern's column |

Files: `File:DokiDokiLiteratureClubGameplay.png`, `File:Wikipe-tan_visual_novel_(Ren'Py).png` (Commons), `File:Cameliagirls1_0.55a.png` (Commons), `File:Katawa_Shoujo_screenshot.png`, `File:Nagisa_Furukawa_Key_screenshot.png`, `File:Fatestaynightgameplay.png`, `File:Steins_Gate_screenshot.jpg`, `File:Persona_5_Classroom.jpg`, `File:Phoenix_Wright_Ace_Attorney_cross-examination.png`, `File:Danganronpagameplay.jpg`, `File:Disco_Elysium_interface.jpg`. Not fetched: YU-NO's branching map (`File:YU-NO_ADMS_English_2.png`, refused 429); no TIPS screen of Steins;Gate exists on its article.

## Features the engines have and this extension lacks (not decided)

Offered to the player 2026-11-25; none chosen, none built. None would change a sourced value.
1. **Hide the box**: a button and a swipe down; a tap brings it back (both engines).
2. **Box opacity 74–100 %**: a slider like WebGAL's Textbox Opacity, floored at the contrast limit.
3. **Return to a line from Log**: WebGAL's ↺ sends the story back to the chosen line; here it could jump the box to that turn without deleting later messages.
4. **Speed sliders**: text speed and AUTO delay (both engines); would sit over the sourced rates as multipliers.
5. **Text size and font choice**: WebGAL's Small, Medium, Large and three fonts; the sourced 27.5 px would stay the default.
6. **Voice replay**: WebGAL's Replay for the current line.

Sourced research for each: `docs/vn-feature-research.md`.

## What would bring it closer, most use first

1. **Box type from the mean reading distance, or a size setting.** 36.2 cm in place of 58 gives the page's own 17.9 px: about 38 characters a line in place of 25 at 412 px, and the 444-character NVL sentence on 12 lines in place of 18 (*derived*). A setting "Box text: large (now) / medium" keeps the far reader's size for those who need it.
2. **Hide the box.** A swipe down on the box (and a button for those who do not swipe) shows the scene and the picture; a tap brings it back.
3. **Speed settings.** A letters-pace multiplier and an AUTO base delay, labelled by direction ("slower ← → faster").
4. **Voice replay in the log.** A ▶ beside each line a voice spoke.
5. **Box opacity, 74–100 %.** Above the contrast floor only.
6. **A dyslexia font and a high-contrast switch** in the settings.
7. **On a desktop, a right-hand column** for the box (optional; a larger change).

## Sources

- NomnomNami, [How can I design a good UI for my VN](https://nomnomnami.itch.io/how-can-i-design-a-good-ui-for-my-vn)
- Fuwanovel, [UI design – an anatomy of visual novels](https://forums.fuwanovel.moe/blogs/entry/4226-ui-design-%E2%80%93-an-anatomy-of-visual-novels); [NVL vs ADV](https://forums.fuwanovel.moe/blogs/entry/3731-nvl-vs-adv-–-an-anatomy-of-visual-novels); [Built-in flowcharts](https://forums.fuwanovel.moe/blogs/entry/3923-built-in-flowcharts-%E2%80%93-an-anatomy-of-visual-novels)
- [In-game encyclopedia – an anatomy of visual novels](https://towardstheendsky.blogspot.com/2023/12/in-game-encyclopedia-anatomy-of-visual.html)
- DEV Community, [ADV vs NVL style in Ren'Py](https://dev.to/codefatale/adv-vs-nvl-style-in-renpy-2a8m)
- itch.io, [Visual novel UI and accessibility](https://itch.io/blog/895918/visual-novel-ui-and-accessibility); [Accessible design in visual novels, Ren'Py, and beyond](https://quandtuniverse.itch.io/beaconing/devlog/1028254/accessible-design-in-visual-novels-renpy-and-beyond); [Tips on making your VN more accessible](https://ladyicepaw.itch.io/invisible-seams/devlog/415360/tips-on-making-your-vn-more-accessible); [Polishing your release](https://itch.io/blog/689356/polishing-your-release-the-little-features-that-could); [touch controls](https://itch.io/post/12355246); [auto timing](https://itch.io/post/9958687)
- Microsoft, [Xbox Accessibility Guidelines](https://learn.microsoft.com/en-us/gaming/accessibility/guidelines); Unity, [Video game accessibility basics](https://unity.com/blog/video-game-accessibility-basics); Game Accessibility Guidelines, [Subtitles presented clearly](https://gameaccessibilityguidelines.com/if-any-subtitles-captions-are-used-present-them-in-a-clear-easy-to-read-way/)
- UXPin, [Optimal line length](https://www.uxpin.com/studio/blog/optimal-line-length-for-readability/); O'Reilly, [People read faster with a longer line length](https://oreilly.com/library/view/100-things-every/9780132658638/ch18.html); Baymard, [Line length readability](https://baymard.com/blog/line-length-readability)
- UX Planet, [How to communicate hidden gestures](https://uxplanet.org/how-to-communicate-hidden-gestures-in-mobile-app-e55397f4006b); Giant Bomb, [Backlog](https://giantbomb.com/wiki/Concepts/Backlog)
- Game Developer, [Zero Time Dilemma and the narrative design of Kotaro Uchikoshi](https://www.gamedeveloper.com/design/no-escape-i-zero-time-dilemma-i-and-the-narrative-design-of-kotaro-uchikoshi); [Danganronpa review (Kotaku)](https://kotaku.com/danganronpa-captures-the-feeling-of-real-life-arguments-1821589146)
- 80.lv, [Disco Elysium: working on UI design](https://80.lv/articles/disco-elysium-working-on-ui-design); [Disco Elysium's text box design](https://gamermatters.com/disco-elysiums-text-box-design-is-inspired-by-how-we-use-computers-and-twitter/)
- Brysbaert 2019, J Mem Lang 109:104047 (reading rates); Bababekova et al. 2011 (phone reading distance), as cited in `src/rules/box.ts`
