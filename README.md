# Navigation
- TeamVorpProject/app/page.tsx is our home page.

- All pages for display e.g. credits, home need to be named as "page.jsx" or it will not render.

- app/(protected)/filenamehere are our individual features

- app/api/ is for API calls to LLM

- globals.css is our global css, not sure if we are using tailwind css or vanilla css.

- Naming for individual page css in your features has to end with ".module.css" e.g. page.module.css

- app/layout.jsx is for anything that should persist across page navigations without re-rendering.

- lib/ is for shared javascript

- components/ is for shared UI


# HackIT Team Vorp
NameOfApp is our one stop learning platform to help young adults integreate mother tongue into their daily lives by tackling the hesitation of practicing an unfamiliar language from multiple angles.

<br>
<br>

# How to run
Run `npm run dev` in command line interface<br>
Using React for frontend and Next.js template since React itself is purely frontend.<br>
.env file: Check discord pinned messages.

# Firebase link
[Firebase link](https://hackit-vorp-db-default-rtdb.asia-southeast1.firebasedatabase.app/)

# Figma wireframing 
[Wireframe link](https://www.figma.com/design/y6EjeLEndbZzAgAke1slRh/HackIT-wireframe?node-id=0-1&t=C3fNilFaBsavW9Tn-1)


# Google Docs discussion
https://docs.google.com/document/d/1bWnFUjsIkvIGe7DRwe2-Kcbe6fgvTSDnIYdTIaecSPA/edit


# Members

| Name                                  | Github Username     |
| ------------------------------------- | --------------------|
| Low Bao Shen (Team Leader)            | RotConsumesAll      |
| Wynn Lee                              | wxnn7               |
| Jovan Soo                             | Hilowandlowhi       |
| Matthew Tay                           | Spadnana            |
| Soh Yong Jia                          | yoooongjiaaaa39b-ux |

<br>
<br>

# Users
| Email                                 | Password            |
| ------------------------------------- | --------------------|
| Alice@example.com                     | Alice123            |
| Ben@example.com                       | Ben321              |


# Features and explanations
## General
### Log in
1. Input email and password, saved in memory (React state).
2. Form's submit handler checks both fields are not empty, calls login helper.
3. `signInWithEmailAndPassword` sends email and password to Firebase.
4. Firebase compares password against hash kept.
5. If match fails, throw error obj containing code (`error.code`).<br>Custom error messages are mapped to different error codes. Error messages are displayed to user.
6. If match, login succeeds.<br>Firebase sends signed token, browser saves.
7. `AuthProvider` listening via `onAuthStateChanged`. Receives user obj, sets `loading` to false and updates state.
8. Navbar swaps "Login" for "Logout". `RequireAuth` sees state of user obj and `loading`, lets protected pages render instead of redirect.

Tl;dr: Firebase checks, app reacts(!!!) to result.

## Sentence builder feature (Bao Shen)

### Overview
A learner types a Chinese sentence and wants to know what they got right, what is wrong and feedback on why its wrong. Simple string comparison is invalid since:<br>
- Chinese has many ways to say the same things (synonyms, word order),
- The learner's sentence may be shorter or longer than the model answer,
- Specific characters need to be highlighted when giving feedback.

A sequence alignment engine is needed to try to line up the learner's text against the model answer and report gaps/mismatches. Said engine also needs to have localized words in its context.

### Rule engine
#### <u>Setup</u><br>
At startup, each predefined answer is flattened into 1 segment list and every segment gets a `level` (required, expected or optional). The segment's own `optional` flag overrides exercise's `roles` map. Otherwise, the level comes from roles.<br>

The engine's logic can be split into 6 steps. Steps 1 and 2 run for every model answer while Steps 4 to 6 run only against the closest model answer.<br>

The endpoint strips whitespace and tokenizes the text (jieba, then Stanza). Steps 1–3 and 5 use only the raw text, Step 4 uses the tokens’ part-of-speech tags, and Step 6 uses their character offsets.<br>

<br>

#### <u>Step 1: Find where each piece of the model answer(s) appears in the learner's text.</u><br>
Each answer consists of segments which are made up of a role (function in the sentence) and forms (accepted word variations.) <br>
For each segment, the engine searches for every place forms appear in the learner's text.<br>
The search runs on the characters of the raw text, and that candidates are sorted by start position, with the longer form first only when two start at the same spot.
Overlapping spans are deliberately returned.<br>

<br>

#### <u>Step 2: Assign an occurrence to each segment.</u><br>
Go through the segments in the model answer's order.<br>
Pick at most one occurrence for each segment.<br>
Discard candidates overlapping claimed text, then prefer the leftmost remaining one that starts at or after the furthest end reached so far.<br> 
Earlier segments claim text first. <br>
E.g. 我的爷爷 beats 爷爷 because it starts earlier (position 0 vs 2), and the overlapping 爷爷 is then discarded.<br>
If no candidate is in order, the engine takes the leftmost remaining candidate anywhere in the text. If none exist, the segment has no matches (missing).<br>
The fallback is why a swapped word counts as out of order and not as missing.<br>

<br>

#### <u>Step 3: Pick the closest model answer.</u><br>
Scoring is based on 4 criteria, compared in priority order, lower is better. The lowest scoring model answer wins.
1. How many required segments are missing.
2. How many expected segments are missing.
3. How many order inversions (pair of matched segments whose positions in learner's text are reversed compared with answer) there are.
4. The greater the characters explained, the better. Used only as a tiebreaker.<br>

Optional segments are not counted in criteria 1 and 2, and exact ties go to the first answer in the file.<br>

<br>

#### <u>Step 4: Report missing segments from the learner's answer.</u><br>
Runs only against the closest answer. Every segment of that answer with no match is a missing segment, and its `level` decides how it is reported:
1. required: severity `error`.
2. expected: severity `warning`.
3. optional: skipped (reported as a `tip` only if tips are switched on).

The message comes from the exercise's `hints.missing` for that role (falling back to "Missing: role"). A missing segment has no text to point at, so it has no span and no highlighted tokens.<br>

Before reporting a segment as missing, the engine looks for an unexplained token whose part of speech fits the segment’s role. If one exists, the learner probably used their own wording, so the segment is not reported as missing and the word goes to unrecognised instead. Each unexplained token can fill only one segment, and roles with no entry in the tag table are always reported as missing.

Thus, `ok` can be true while unrecognised word is shown e.g. 咬 (bite) instead of 吃 (eat) appears as unrecognized instead of missing verb. 

<br>

#### <u>Step 5: Report order errors in the learner's answer.</u><br>
Runs only against the closest answer, and only on matched segments (missing ones belong to Step 4).<br>
1. Find the heaviest in-order run. The largest group of matched segments whose positions in the learner's text increase in the same order as in the answer. Segments are weighted by level (required 3, expected 2, optional 1), so when two segments swap, the lighter one is blamed rather than the verb.
2. Segments in that run count as correctly placed. Every other matched segment is displaced (not in the heaviest run).
3. Each displaced segment gets one order error (severity `error`) carrying its character span.
4. For the message, compare the displaced segment with the correctly placed ones. <br>
If the answer puts A before B but the learner put B first, look up `A>>B` in `hints.orderPairs`. <br>
If there is no entry, use the exercise's general `order` hint.

<br>

#### <u>Step 6: Build the response.</u><br>
Convert every reported character span into token indices that overlap the span for the UI to highlight. <br>
Return leftover tokens (excluding punctuation) as `unmatched` so the UI highlights it as "unknown."<br>
Full response: `errors`, `matches`, `unmatched`, `unrecognised`, `closestAnswer`, `ok`, `text`, and `tokens`.<br>
`ok` is true when no entry has severity `error`, so warnings don't fail a sentence. 

<br>

#### <u>Summary</u>

The engine compares the learner’s sentence with every accepted answer, then reports problems against the closest one. An answer is an ordered list of segments: a role (its job in the sentence), accepted forms (wordings), and a level (required, expected, or optional).

1. Find<br>
&nbsp;For each segment, list where its forms appear in the learner’s text.

2. Assign<br>
&nbsp;Walking the answer in order, give each segment one non-overlapping occurrence, preferring text after what is already matched, otherwise any. A segment with none has no match.

3. Choose<br>
&nbsp;Score each answer by fewest missing required segments, then missing expected ones, then order inversions, then most characters explained. The lowest score wins.

4. Missing<br>
&nbsp;In the chosen answer, a segment with no match becomes an error (required) or a warning (expected), unless an unexplained word with a fitting part of speech exists. That word is passed on as unrecognised.

5. Order<br>
&nbsp;Keep the heaviest set of matched segments that are in the answer’s order. Every other matched segment is displaced and gets an error with the most specific hint available.

6. Respond<br>
&nbsp;Map spans to tokens and return errors, matches, unexplained tokens, unrecognised words, the closest answer, ok, and the cleaned text.

#### Local context

# Glossary