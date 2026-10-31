# DIRECTION SHEET â€” The name as a monument
seed 254109028 Â· drawn 2026-10-30 Â· sector fashion Â· tone editorial
Brief: Harmay.Studio: Vietnamese fashion house, collections, runway, B2B design for workshops and made-to-measure

| | |
| --- | --- |
| Direction | The name as a monument |
| Hero | Name across the middle |
| Type | Unbounded / Onest |
| Colour | Three stones |
| Sections | intro (Heading captions a panorama) â†’ showcase (Band of unequal panels) â†’ gallery (Staggered pairs in empty ground) â†’ list (Statement, table pushed right) â†’ how-it-works (Lines that step across) â†’ about (Side facts, wide paragraph) â†’ cta (The idea again, inverted) â†’ footer (Columns above, wordmark below) |
| Motion | Scaling wordmark |
| Photographs | the "Hands and making" set, as atmosphere |

This is the direction for this build. Adopt it. Do not blend it with the layout you would have made anyway,
and do not redraw because it is unfamiliar: unfamiliar is the point. Redraw a slot only when it conflicts
with a stated brand constraint or needs an asset that does not exist, and say why in your report.

The parts of this sheet were written separately and will disagree in small ways. Settle every disagreement in this order:
**house rules** (including type no smaller than 13px and body text of 16px or more) â†’ **the direction** (the idea, the composition habits, where the
one accent goes) â†’ **the type system and the palette** (which face does which job, the five size steps, which colour is the ground and where the
accent goes) â†’ **the hero blueprint** â†’ **the section blueprints**. Under each blueprint below, "Adjusted for this page" lists where it disagrees.
In practice: take geometry from blueprints (columns, proportions, what sits where) and take everything else from above them. Map every size a
blueprint names onto one of your five type steps instead of adding a sixth. Use one button shape, one corner radius and one pair of page margins on
the whole page, whatever individual blueprints say. If a blueprint names a kind of typeface (a light serif, a heavy grotesk), use the dealt face.

## 1. The idea
The name is the headline. Set it so large that it becomes architecture: as wide as the viewport, cropped by an edge, or stacked to fill the screen. Nothing else on the first screen competes; the description of what this is drops to a single small sentence. The idea comes from treating the name's letters as material. Ask what the subject can do to its own name: a photograph of the work sits inside a counter or replaces a letter, the name repeats down the page like a reel, the letters are split to opposite corners and the page happens between them. In the study this was the single most common device among sites scoring 7.5 or more.

Before anything else, write one sentence in your notes: "On this page, <the subject's own material> becomes <the device>."
Fill the first blank from your inventory of what only this client has (its name and what it means, its street, its numbers, its
constraint), then put the nearest competitor in the sentence: if it still works, the idea is the category's, not the client's.
Then name the one live thing the visitor can do on the page (SKILL.md step 4).

## 2. Composition
First screen: the wordmark spans 88â€“100% of the viewport width (font-size 16â€“24vw, set with a clamp so it never wraps), anchored either to the bottom edge with its descenders nearly touching it, or dead centre with everything else pushed to the corners. One line of supporting text at 16â€“20px sits in a corner on a shared margin; navigation is three or four words in the opposite corner. After the hero the page is deliberately small and calm: a narrow text column or a simple two-column grid, so the contrast with the monument holds. The name returns once more at full width as the footer, in the inverse colours. Margins are tight (20â€“32px) so the type reaches the edges. Two type sizes do nearly all the work: the monument and a small text size, with one mid size for section headings.

## 3. Type â€” Unbounded / Onest
A wide display sans built from rounded squares, heavy and a little architectural, beside a clean text grotesk. Suits architecture indexes, watches, mobility and events that want a title with a constructed feel.
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@800&family=Onest:wght@400;500&display=swap" rel="stylesheet">
```
- Display: **Unbounded** â€” weight 800 Â· tracking -0.03em Â· leading 1.0 Â· uppercase
- Text: **Onest** â€” 400 for body, 500 for emphasis Â· leading 1.5 Â· tracking 0
```css
:root {
  --step-small: clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem);
  --step-body: clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem);
  --step-lead: clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem);
  --step-head: clamp(2rem, 1.3rem + 3.2vw, 4rem);
}
```
One family. The display cut must survive enormous sizes: tight tracking (-0.04 to -0.07em), leading 0.8â€“0.9, optical kerning on. Section headings are modest (28â€“40px) on purpose.
The direction decides sizes and how many of them; the type system decides how this face is set. Where the two give different tracking or leading, use the values of the type system: they are tuned to this face.
The display size itself comes from the hero blueprint below.

## 4. Colour â€” Three stones
```css
:root {
  --bg: #eeecea;
  --surface: #e4e1dd;
  --ink: #333231;
  --muted: #6b6763;
  --accent: #5c6b54;
  --accent-ink: #ffffff;
  --field-1: #cdc3b6;  --field-1-ink: #333231;
}
```
Three close stone tones share the interface: the lightest for the page, the middle one for panels, the darkest for a single band, all with charcoal type. Saturated colour is left to the photographs and their backdrops; the grey-green fills the button only.
Two values carry the page (ground and ink). The accent, if used at all, appears on one thing only: the single action or the inset image frame. The footer inverts ground and ink.

## 5. Imagery
**Use the images that belong to the project in every picture slot.** For slots they cannot fill, real pictures of the subject's world from the open collections come next (start with `node C:/Users/buiti/.gemini/config/skills/design-taste-frontend/scripts/assets.mjs "fashion"`, then queries from your inventory (its street, its materials, its trade's tools and history); credit them on the page), then the dealt photographs.

Few images, used as inserts in the typography rather than as illustrations beside it: one photograph inside or behind the name (a 4:5 or 1:1 frame replacing a letter, or tucked between two words), then a short run of large full-width or half-width photographs further down. Square corners. No collage of small thumbnails.

**Floor (the inspector checks it):** at least four real pictures on the page, usually six to twelve; SVG drawings do not count. One moving picture where an honest clip exists: `node <skill>/scripts/assets.mjs --video "<query>"`, used as a muted loop with a poster frame. Whatever this direction says about pictures, it is carried out with real ones.

Photographs dealt for this build, from the "Hands and making" set (hands at work, craft and making)
Order of preference for imagery: (1) the project's own photographs and product shots; (2) images you generate, if an image tool is
available; (3) real pictures of the subject's world found in the open collections (assets.mjs, downloaded and credited on the page);
(4) drawings of the subject in code; (5) these. They are real photographs (Unsplash licence, served by picsum.photos) of places, light and
texture. They are atmosphere, never a stand-in for a specific product, dish, person or interface. List the ones you use in your report so
they can be replaced.
- `https://picsum.photos/id/785/1600/1000` â€” Two cupped hands holding a pile of green spruce tips Â· mid tone Â· fresh green, dark green, warm skin Â· native landscape Â· photo: Jean Lakosnyk
- `https://picsum.photos/id/304/1600/1000` â€” Hand adjusting faders on an audio mixing console Â· mid tone Â· warm white, navy, amber Â· native landscape Â· photo: Drew Patrick Miller
- `https://picsum.photos/id/407/1600/1000` â€” Hands lighting a sparkler that throws bright sparks in the dark Â· dark tone Â· charcoal, warm white, amber Â· calm area: right Â· native landscape Â· photo: Kelley Bozarth
- `https://picsum.photos/id/674/1600/1000` â€” Cupped hands holding a heap of dark blue grapes Â· mid tone Â· pale blue, dark purple, tan Â· native landscape Â· photo: Maja Petric
- `https://picsum.photos/id/319/1600/1000` â€” Hands holding a vintage rangefinder camera against a denim jacket Â· mid tone Â· denim blue, mustard, silver Â· native landscape Â· photo: Kristian Karlsson
- `https://picsum.photos/id/491/1600/1000` â€” Axe, hammer, pliers and leather gloves laid out on dark wood Â· dark tone Â· dark brown, tan, steel grey Â· native landscape Â· photo: Todd Quackenbush
- `https://picsum.photos/id/1060/1600/1000` â€” Kettle pouring water over a pour-over coffee dripper on a dark counter Â· dark tone Â· dark teal, black, warm brown Â· native landscape Â· photo: Karl Fredrickson
The last two path numbers are width and height: request the exact crop you render (`/1200/1500` for a 4:5 portrait, `/2400/1350` for a hero) and
add `?grayscale` to desaturate. Use three to six of them, not all eight. Always set `width`, `height`, `alt` and `loading="lazy"` (not on the hero image).
Other sets that fit this brief: city-day, fog-and-quiet, coast, desert-and-road â€” `node draw.mjs --photos <set>` prints one in full; `--photos list` shows all sets. Taking photographs from another set is your call and is not a redraw; keep them to one light and one treatment.

## 6. Hero â€” Name across the middle
Paper and ink only; no picture on the first screen. The name runs on one line across the vertical centre, sized to span from the 18px left margin to the 18px right margin (97.5% of the width). Set it as inline SVG text with a `viewBox` fitted to the word and `width: 100%`, or tune its vw size to the letter count, so it never wraps. In a heavy grotesk the letters stand about 280px tall, from about 310px to 590px; nothing touches or overlaps them. The four corners carry everything else on 18px margins. Top-left: one supporting sentence at 18px on two lines, max 36ch, and 16px below it the single action as a solid ink rectangle. Top-right: a menu word or three text links at 15px. Bottom-left, on a baseline 24px above the edge: the city or the kind of work at 16px. Bottom-right on the same baseline: two or three text links at 15px. The ground between the corners and the name, about 230px above and below it, stays empty and is closed on both sides by the corner texts. The name returns in the footer at the same width with ground and ink swapped and a two-line invitation above it, so the page closes like a bracket.

On a phone: The name stays on one line across the width inside 16px margins and moves up to 22% of the height. The supporting sentence follows on the left margin at 17px, then the action at full width. The lower half holds the first picture of the work as a 4:5 frame cropped by the bottom edge, so the screen does not end in empty paper. A menu word sits top-right.
Headline: The name itself on one line, up to about 12 characters; the 18px sentence in the top-left corner says what it is.

Adjusted for this page:
- It names a kind of typeface: use the dealt faces (display Unbounded, text Onest) and their settings; capitals only where the type system sets them.

## 7. Sections, in order
Each is a composition to rebuild with this project's content. Keep the geometry; change the subject. Re-order or drop a
section when the argument of the page needs it (see references/copy.md), never to fall back to a card grid.

### 1. intro â€” Heading captions a panorama (full-bleed)
The section is exactly 100svh. Its top third holds a two-line heading of three to six words at clamp(48px, 6.5vw, 96px) with leading 0.95, either centred or flush left on the page margin. 28px beneath the heading sit two small captions side by side, each two lines at 13px and 150px wide with a 48px gap, aligned to the heading (centred as a pair, or both starting at its left edge). 40px below them a full-bleed photograph begins and runs off the bottom of the viewport: it is 100vw wide at 21:9 or wider, and only its top 55â€“60svh is visible before the fold, the rest arriving with scroll. The heading therefore reads as a large caption to the picture. On an object-led page the image is the object on a flat dark panel inset by the page margin instead of bleeding to the edges.
On a phone: Heading at 12vw on two lines, left-aligned, taking the top 30% of the screen. The two captions merge into one four-line block at 14px. The photograph begins at 45% of the screen height in a 4:5 crop, full-bleed, and runs off the bottom.

### 2. showcase â€” Band of unequal panels (strip)
A modest heading, then one wide band of pictures. The heading, two to four words at 36â€“44px, starts at column 3, left of centre, with 64px beneath it. The band spans the full viewport width edge to edge and is 68svh tall: four photographs standing side by side with no gaps and deliberately unequal widths, a flex row with flex-grow values of 5, 2, 3 and 2. Each panel is cropped with object-fit: cover to a tall slice, so the band reads as one folded view. The first panel carries a two-line title at 28px in paper colour at its top-left, 24px in, over a neutral scrim that covers only that corner. Hovering a panel raises its flex-grow to 6 over 500ms while the others give way; without hover the widths simply stay. One caption line at 16px sits under the band at the left margin.
On a phone: The heading sits on the margin at 28px. The band becomes a two-by-two block with no gaps, 84svh tall in total: the first row split 64/36 and the second 36/64, so the slices stay unequal. The title stays on the first panel. No hover behaviour.

### 3. gallery â€” Staggered pairs in empty ground (stack)
No heading. Photographs are placed one or two per screen so that more than half of every screen stays empty ground. Screen one: a 3:4 portrait in columns 1â€“4 against the left margin, and a near-square 5:4 image in columns 7â€“12 against the right margin whose top edge starts 30vh lower than the portrait's. Screen two: a 3:2 landscape in columns 6â€“11 and, 24vh lower, a small 4:5 image in columns 2â€“4. Repeat the two arrangements, mirrored on the second pass, for six to ten photographs. Under each image's left corner, a one-line caption at 13px in the soft ink, 10px below the image. Vertical gaps between pairs are 22â€“28vh. Every edge sits on a column line and offsets come from only two values. Square corners. If motion is used, images enter with a short `clip-path` wipe from the bottom edge.
On a phone: A single column in which widths and sides alternate: 70% against the left margin, 84% against the right, 56% left, then 100% full-bleed, with 64px between images. Captions sit under each image's left corner at 13px. Portrait crops are preferred so each image fills most of the screen height.

### 4. list â€” Statement, table pushed right (table)
A heading of four to six words spans the full width on two lines at clamp(40px, 4.5vw, 68px), left-aligned with its first line indented 3vw and leading 0.98. 96px below, the table is pushed into the right-hand five columns (8â€“12) and the left stays open. One plain word naming the table (offices, hours, rates) hangs at 14px in column 7, top-aligned with the first row. Each row is a three-part line at 15â€“16px with 26px between rows: the kind or day in the soft ink at the left of the measure, the place or service at 30%, and the address, time or price right-aligned, with a small arrow where the row links. Rows are separated by space only; every fourth row has 44px above it to form groups. In columns 1â€“4, bottom-aligned with the last row, one 4:5 photograph 22vw wide may sit alone. Holds 5â€“14 rows.
On a phone: Heading at 9.5vw without the indent. The table takes the full width at 16px; each row stacks the kind above the place, with the value right-aligned on the first line. The naming word is dropped because the heading already says it. The photograph follows at 60% width on the right margin.

### 5. how-it-works â€” Lines that step across (statement)
The sequence is written, not counted. Four lines of display type, one stage per line, each a complete short clause that begins with its order word: 'First you send it.' 'Then we take it apart.' 'You choose one.' 'It ships on Friday.' Set at clamp(36px, 4.6vw, 76px), leading 1.0, one line each. The first line starts on column 1 and each following line starts two columns further right (grid-column-start 1, 3, 5, 7), so the block descends as a staircase and the eye follows the diagonal. Under each line, on that line's own left edge and 12px below, a sentence of up to 34ch at 17px in the soft ink. 56px between stages. The last line may take the accent colour as the single emphasis. The first line serves as the heading; there is no title above. Leave the columns to the left of the final stage empty.
On a phone: Lines drop to 8.4vw and may wrap onto a second line. The staircase becomes a smaller indent of 6vw per stage, so the fourth line starts 18vw in. Each sentence sits under its line at 16px on the same indent. 40px between stages.

### 6. about â€” Side facts, wide paragraph (table)
Two rows share one vertical line at 34% of the viewport width. Row one: in a 160px column at the left margin, three label and value pairs stack with 20px between them, each a label in the soft ink with its value beneath in full ink, all at 13px (founded, based in, team size). From the 34% line a five-line paragraph at clamp(20px, 1.7vw, 26px), leading 1.35, runs to 90% of the width. Row two starts 120px lower and repeats the logic for the record of the practice: one plain word at 13px at the far left (awards, press, clients), then from the 34% line two list columns, each 260px wide with a 64px gutter, at 13px with 10px between lines: name at the left, year at the right in the soft ink. No heading; the paragraph opens the section. Each list comfortably holds 6â€“12 lines. No photographs are needed.
On a phone: Everything aligns to the left margin. The paragraph comes first at 19px. The three label and value pairs follow as a two-column grid at 14px. The two record lists stack with 40px between them, each opened by its plain word in full ink.

### 7. cta â€” The idea again, inverted (statement)
The close flips the page's colours: ink becomes the ground and the ground becomes the ink, across a full-bleed field at least 90svh tall. The page's opening idea returns as a headline of three to five words at 9â€“11vw on two lines, leading 0.9, flush left, positioned in the upper two-thirds; it should echo the hero's wording, not repeat it. Along the bottom, on one shared baseline 40px above the edge: one supporting sentence at 20px in columns 1â€“5 and one rectangular button in the accent colour, right-aligned in columns 10â€“12, about 56px tall. Nothing else: no image, no second button, no logo. The field's top edge is a hard horizontal line where it meets the section above. If the footer follows on the same inverted field, leave 160px before it so the close still reads as its own screen.
On a phone: The same inverted field at 80svh. Headline at 15vw on two lines at the top. The sentence sits lower at 17px, and the button spans the full width at the bottom, 56px tall, with 20px margins. Nothing else is added.

### 8. footer â€” Columns above, wordmark below (stack)
The footer inverts ground and ink and fills a whole viewport (min-height 100svh), arranged as three rows in a grid (auto 1fr auto). Top row, 40px from the edge: four small columns on the 12-column grid (address, navigation, social, hours or contact), each a plain list at 15â€“16px with its first line in the full ink and the rest in the softer ink. Middle row: empty. Bottom row: the wordmark alone, sized to run from the left margin to the right margin on one line. Set it as inline SVG text with a `viewBox` fitted to the word and `width: 100%`, or tune `font-size` in `vw` to the letter count, so it never wraps; its baseline sits 20px above a single line of legal text at 13px. With `position: sticky; bottom: 0` and a lower `z-index` than the page, the last section slides away to uncover it.
On a phone: Columns become two by two at 15px with 32px between rows, at the top. A gap of about 20svh follows. The wordmark spans the full width at the bottom; a name longer than ten letters stacks on two lines, each fitted to the width. Legal line beneath at 12px.

Adjusted for this page:
- It sets text at 12px: use your small step (13px or more) instead.

## 8. Motion â€” Scaling wordmark
The giant name responds to the scroll: as the first screen leaves, the wordmark scales down a few percent (or grows from 0.94 to 1 as the footer arrives) on a scroll-linked timeline, so the monument feels heavy. Travel stays under 8%. Static fallback where scroll timelines are unsupported. Recipe: 'Scroll-linked progress' in references/motion.md, animating `scale`.
This is the signature move, the one loud moment. Around it the page still needs the rest of the motion layer (SKILL.md step 9): an entrance for the parts of every section, feedback on every control, and one moving picture. The inspector fails a page that barely moves. Recipes: references/motion.md.

## 10. Where the richness comes from
Scale. The size of the name against the smallness of everything else is the entire visual event, so protect both ends: do not shrink the name to make room, and do not let body text creep above 20px.

## 11. How this direction goes wrong
A long name set small is just a logo. If the name has more than about 12 characters, stack it on two lines or crop it with the viewport edge; never drop below 12vw. Do not add a second big headline under the name. Do not decorate the letters.

## 12. Real references
Studied sites that work this way. Take the principle, never the specifics: no names, copy, images or signature assets of theirs.
- **Nia Creative** (One Page Love, studied score 7.4) `opl-nia-creative`
  Idea: The three-letter wordmark becomes a slot-machine reel: the name repeats vertically and its middle letter is swapped for a square of client photography or video.
  Hero: Pale grey field with a slim nav: bracketed lowercase logo top-left, four uppercase mono links centred, a black pill button top-right. The centre 43% of the width holds a vertical reel of the wordmark stacked three times in very heavy black grotesk, each row about 230px tall; in every row the middle letter is replaced by a square photo or video tile (surfers, a woman holding glasses over her eyes, a burger). The middle row is sharp; rows above and below fade out through gradient masks. A bottom strip carries a mono descriptor at left and city plus live clock at right. A plum band starts at the fold.
  Worth taking: Drop a photo tile into the wordmark in place of one letter and run the lockup as a vertical reel with masked top and bottom rows.
- **Kereliott** (One Page Love, studied score 7.3) `opl-kereliott`
  Idea: A quiet house gets a quiet page: one dark field, one typeface, the name set as wide as the screen and photographs left to drift in generous darkness.
  Hero: Very dark green-black field with cream type. A two-line introductory sentence at about 30px sits top-left inside 30px margins; a small cream rectangular button sits top-right. The upper half is otherwise empty. The house name fills the full content width in a flared humanist sans, mixed case, with capitals about 19vw tall, its baseline at roughly 87% of the viewport height. Immediately beneath, separated by a gap of a few pixels, the top sliver of a full-width landscape photograph enters from the bottom edge.
  Worth taking: Size the wordmark to fill the content width exactly and let the first photograph tuck directly under its baseline.
- **Serotoninn** (Awwwards Site of the Day, studied score 7.9) `aww-serotoninn`
  Idea: A torn-paper seam splits the page in two, colour on white against greyscale on grey paper, to stage the brand's glam-versus-grunge line, with ultra-condensed heavy type straddling the tear.
  Hero: The viewport is split by a vertical torn-paper edge at 50%: left half pure white, right half a grey paper texture. A cut-out model stands dead centre, about 28% wide, running from 15% down off the bottom edge; her left half is full colour, her right half greyscale, the tear passing through her. Type is ultra-condensed heavy uppercase: the brand name at about 5.5vw top-left beneath a three-line mono menu; a two-line tagline right-aligned at mid-height on the right; and at bottom centre a two-word line at 8.2vw, first word red and second white, overlapping the dress, with a bracketed link beneath. Small centred logo at top, three mono links top-right.
  Worth taking: Split one photograph along a torn-paper edge into a colour half and a greyscale half on different grounds, and let a two-word headline change colour across the same seam.
Full notes on any of them: `node draw.mjs --site <id>`.

## Always
Headlines two lines or fewer at every width. No eyebrow labels, no monospace, no 01/02/03, no thin rules, no gradients, no shadows at rest,
no cream-and-terracotta, no violet. The frame: one h1 on the first screen that says what this is, equal outer margins, no
section huddled on one side with the other half empty, no blank stretch over half a screen, a heading on every section.
`inspect.mjs` measures all of it.

Saved to D:/Freelancer/Harmony Studio/harmay-mockup/.taste-skill/direction.json Â· reprint with `node draw.mjs --show`
