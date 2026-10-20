# HackIT Team Vorp

## Members

| Name                                  | Github Username     |
| ------------------------------------- | --------------------|
| Low Bao Shen (Team Leader)            | RotConsumesAll      |
| Wynn Lee                              | wxnn7               |
| Jovan Soo                             | Hilowandlowhi       |
| Matthew Tay                           | Spadnana            |
| Soh Yong Jia                          | yoooongjiaaaa39b-ux |

## Background

LearnLah! is our one stop learning platform to help young adults integrate mother tongue into their daily lives by tackling the hesitation of practicing an unfamiliar language from multiple angles. We have decided to focus on aspects that range from general vocabulary and grammar to appropriate usage of localized slang:
- Naming objects to maintain vocabulary,
- Proverbs gamified into flashcards to not only retain understanding but also mastery of Chinese,
- Understanding the nuances of how words and sentences morph based on context,
- Pronounciation and reading aloud to reinforce real time organization of thoughts,
- Spoken interactions in local environments involves the use of localized slang/Singlish.

From these perspectives, we have created solutions that aim to tackle these problems. 

<br>

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

### Sign up
1. Input username, email and password
2. Form's submit handler checks both fields are not empty, calls signup helper.
3. Form will send all info to be added into the Firebase
4. Checks if data already exist in the database, if so tells user information already exist
5. `AuthProvider` listening via `onAuthStateChanged`. Receives user obj, sets `loading` to false and updates state.
6. Navbar swaps "Login" for "Logout". `RequireAuth` sees state of user obj and `loading`, lets protected pages render instead of redirect.


Tl;dr: Firebase checks, app reacts(!!!) to result.

## Sentence builder feature (Bao Shen)

### How to run
Create a venv based on `requirements.txt` and run "python -m uvicorn main:app --reload --port 8000" in terminal for grammar check logic.

### Overview
A learner types a Chinese sentence and wants to know what they got right, what is wrong and feedback on why its wrong. Simple string comparison is invalid since:<br>
- Chinese has many ways to say the same things (synonyms, word order),
- The learner's sentence may be shorter or longer than the model answer,
- Specific characters need to be highlighted when giving feedback.

A sequence alignment engine is needed to try to line up the learner's text against the model answer and report gaps/mismatches. Said engine also needs to have localized words in its context.

### Flow
1. Learner selects an English sentence to translate.
2. Learner types in their attempt and clicks "Check sentence" button.
3. (Request 1, grammar check) The browser calls /api/check, which calls Python /check. The route strips each expected list from unrecognised and returns the result.
4. (Show grammar result immediately)The grammar result renders. If unrecognised is non-empty, those dotted words show a small spinner, and the banner says “Checking your words…” instead of “Looks good!”.
5. (Request 2, vocabulary check) The browser calls /api/vocab with { exerciseId, text }. The route calls Python /check again to get unrecognised with the accepted forms, looks up the glossary, calls DeepSeek, validates the reply, and returns only { verdicts }.
6. (Merge results) The browser stores the verdicts by token index. Each dotted word’s tooltip now shows the reason and suggestion, and ok is recalculated: grammar OK, and no different_meaning or incorrect verdict.

### Rule engine for grammar
#### Setup<br>
At startup, each predefined answer is flattened into 1 segment list and every segment gets a `level` (required, expected or optional). The segment's own `optional` flag overrides exercise's `roles` map. Otherwise, the level comes from roles.<br>

The engine's logic can be split into 6 steps. Steps 1 and 2 run for every model answer while Steps 4 to 6 run only against the closest model answer.<br>

The endpoint strips whitespace and tokenizes the text (jieba, then Stanza). Steps 1–3 and 5 use only the raw text, Step 4 uses the tokens' part-of-speech tags, and Step 6 uses their character offsets.<br>

<br>

#### Step 1: Find where each piece of the model answer(s) appears in the learner's text.<br>
Each answer consists of segments which are made up of a role (function in the sentence) and forms (accepted word variations.) <br>
For each segment, the engine searches for every place forms appear in the learner's text.<br>
The search runs on the characters of the raw text, and that candidates are sorted by start position, with the longer form first only when two start at the same spot.
Overlapping spans are deliberately returned.<br>

<br>

#### Step 2: Assign an occurrence to each segment.<br>
Go through the segments in the model answer's order.<br>
Pick at most one occurrence for each segment.<br>
Discard candidates overlapping claimed text, then prefer the leftmost remaining one that starts at or after the furthest end reached so far.<br> 
Earlier segments claim text first. <br>
E.g. 我的爷爷 beats 爷爷 because it starts earlier (position 0 vs 2), and the overlapping 爷爷 is then discarded.<br>
If no candidate is in order, the engine takes the leftmost remaining candidate anywhere in the text. If none exist, the segment has no matches (missing).<br>
The fallback is why a swapped word counts as out of order and not as missing.<br>

<br>

#### Step 3: Pick the closest model answer.<br>
Scoring is based on 4 criteria, compared in priority order, lower is better. The lowest scoring model answer wins.
1. How many required segments are missing.
2. How many expected segments are missing.
3. How many order inversions (pair of matched segments whose positions in learner's text are reversed compared with answer) there are.
4. The greater the characters explained, the better. Used only as a tiebreaker.<br>

Optional segments are not counted in criteria 1 and 2, and exact ties go to the first answer in the file.<br>

<br>

#### Step 4: Report missing segments from the learner's answer.<br>
Runs only against the closest answer. Every segment of that answer with no match is a missing segment, and its `level` decides how it is reported:
1. required: severity `error`.
2. expected: severity `warning`.
3. optional: skipped (reported as a `tip` only if tips are switched on).

The message comes from the exercise's `hints.missing` for that role (falling back to "Missing: role"). A missing segment has no text to point at, so it has no span and no highlighted tokens.<br>

Before reporting a segment as missing, the engine looks for an unexplained token whose part of speech fits the segment's role. If one exists, the learner probably used their own wording, so the segment is not reported as missing and the word goes to unrecognised instead. Each unexplained token can fill only one segment, and roles with no entry in the tag table are always reported as missing.

Thus, `ok` can be true while unrecognised word is shown e.g. 咬 (bite) instead of 吃 (eat) appears as unrecognized instead of missing verb. 

<br>

#### Step 5: Report order errors in the learner's answer.<br>
Runs only against the closest answer, and only on matched segments (missing ones belong to Step 4).<br>
1. Find the heaviest in-order run. The largest group of matched segments whose positions in the learner's text increase in the same order as in the answer. Segments are weighted by level (required 3, expected 2, optional 1), so when two segments swap, the lighter one is blamed rather than the verb.
2. Segments in that run count as correctly placed. Every other matched segment is displaced (not in the heaviest run).
3. Each displaced segment gets one order error (severity `error`) carrying its character span.
4. For the message, compare the displaced segment with the correctly placed ones. <br>
If the answer puts A before B but the learner put B first, look up `A>>B` in `hints.orderPairs`. <br>
If there is no entry, use the exercise's general `order` hint.

<br>

#### Step 6: Build the response.<br>
Convert every reported character span into token indices that overlap the span for the UI to highlight. <br>
Return leftover tokens (excluding punctuation) as `unmatched` so the UI highlights it as "unknown."<br>
Full response: `errors`, `matches`, `unmatched`, `unrecognised`, `closestAnswer`, `ok`, `text`, and `tokens`.<br>
`ok` is true when no entry has severity `error`, so warnings don't fail a sentence. 

<br>

#### Summary

The engine compares the learner's sentence with every accepted answer, then reports problems against the closest one. An answer is an ordered list of segments: a role (its job in the sentence), accepted forms (wordings), and a level (required, expected, or optional).

1. Find<br>
&nbsp;For each segment, list where its forms appear in the learner's text.

2. Assign<br>
&nbsp;Walking the answer in order, give each segment one non-overlapping occurrence, preferring text after what is already matched, otherwise any. A segment with none has no match.

3. Choose<br>
&nbsp;Score each answer by fewest missing required segments, then missing expected ones, then order inversions, then most characters explained. The lowest score wins.

4. Missing<br>
&nbsp;In the chosen answer, a segment with no match becomes an error (required) or a warning (expected), unless an unexplained word with a fitting part of speech exists. That word is passed on as unrecognised.

5. Order<br>
&nbsp;Keep the heaviest set of matched segments that are in the answer's order. Every other matched segment is displaced and gets an error with the most specific hint available.

6. Respond<br>
&nbsp;Map spans to tokens and return errors, matches, unexplained tokens, unrecognised words, the closest answer, ok, and the cleaned text.

### Vocabulary check with Gemini LLM
text

### Local context

<br>

## AI Conversation Practice Feature (Yong Jia)

### Overview

Learners want to practise communicating in Chinese rather than simply memorising vocabulary or translating sentences. However, they may struggle to form responses naturally, use appropriate vocabulary, and identify mistakes in their Chinese.

The AI Conversation Practice feature allows learners to engage in interactive conversations based on their translated text. It provides realistic scenarios, responds to their messages, and highlights mistakes with explanations and suggested improvements.

### Flow

1. **Start conversation practice.** The learner selects the Next button after translating their chosen text to begin practising Chinese.

2. **Generate a conversation scenario.** An AI generates a realistic scenario based on the translated text and the learner's Chinese proficiency level.

3. **Begin the conversation.** The learner is presented with the scenario and an opening message from the AI, which takes on a relevant conversational role.

4. **Submit a response.** The learner replies in Chinese to continue the conversation.

5. **Receive an AI response.** The AI responds naturally to the learner's message while maintaining the context of the conversation.

6. **Identify language errors.** The AI analyses the learner's response and identifies mistakes in grammar, vocabulary, or phrasing, where applicable.

7. **Display personalised feedback.** The learner can view highlighted mistakes, explanations of why they are incorrect or unnatural, and suggested corrections.

8. **Continue practising.** The learner applies the feedback to subsequent responses and continues the conversation to improve their Chinese communication skills.

### Summary

The AI Conversation Practice feature helps learners apply their Chinese knowledge through realistic, interactive conversations.

1. Generate a scenario based on the learner's translated text.
2. Engage in a conversation with the AI.
3. Receive contextual responses that encourage further communication.
4. Identify mistakes and understand why corrections are needed.
5. Apply personalised feedback to improve grammar, vocabulary, and natural expression.

The feature promotes active learning by allowing learners to practise producing Chinese independently while receiving immediate, contextual feedback on how to improve.

### How it works

The feature uses the translated Chinese text to generate a relevant conversation scenario based on the learner's proficiency level. The learner interacts with an AI through a chat interface, submitting Chinese responses and receiving contextual replies to continue the conversation.

After each response, the AI identifies potential grammar, vocabulary, and phrasing errors, providing explanations and suggested corrections. This allows learners to understand their mistakes immediately and apply the feedback throughout the conversation.

The feature combines interactive dialogue with personalised feedback to help learners improve their Chinese communication skills through practical usage.

## Proverb Flashcards (Jovan Soo)

### Overview
A learner would want to understand and implement more advanced phrases in their life to increase their chinese vocabulary and by: <br>
- Implementing `Proveb Flashcards` with the proverbs pinyin and meanings behind so that learners can test themselves without seeing the answer instantly,
- `Respective quizzes` that test the learners ability to check their understanding of proverb,
- `Mix and Match` to make learning interative and tests their knowledge on the proverbs.

With the Proverb Flashcards we can allow for more interative learning which will push learners understanding and makes learning proverbs engaging

### Setup<br>
At startup, the project will load `chinese-proverb-api` into different chunks of 20 proverbs each set. The api includes the proverb, the pinyin and the english translation. <br>

The batches of proverbs are added into the homepage for the learner to choose from which will include the same 20 proverbs each time. <br>

### Flashcard Page:<br>
When the learner chooses a proverb set, they will be brought to the flashcard page which will show the Proverb. Pressing on the flashcard will show the pinyin and the english translation. <br>

The learner can also access the quizzes and mix and match pages with the respective buttons here.<br>

### Quizzes Page:<br>
Upon entering the quiz page, the learner is given the proverb and they can choose between 4 options for what the meaning of the quiz is. <br>

If the learner chooses the wrong option, the page will inform the learner that it is incorrect and will ask them to try again.<br>

Upon choosing the correct option or passing the question if the user decides to ,skip answering the question, the learner will be asked if they would like to add the proverb into their saved phrases list where the learner can use to revise in the future. They can also continue to the next question in the 20 proverb batch<br>

### Mix and Match Page:<br>
When the learner chooses to do the Mix and Match, the meaning of the proverb will be given and the user has to attempt to order the words given into the correct proverb. <br>

Similarly to the quizzes page, the Learner can retry the question if they answer incorrectly and dd the proverb into their saved phrases list or continue if they answer the question correctly ot pass the question.<br>


## Image Learner (Wynn Lee)

### Overview
Image Learner is a picture-based vocabulary practice for everyday Chinese words where learners see a picture of an object with its English name and have to type the Chinese word themselves. Words are grouped into categories (Food, Animals, Places, Countries and Everyday Objects), so learners can practise one topic at a time.

### How to use
1. Choose a category.
2. Look at the picture and its English name.
3. Type the Chinese word in the box and press Submit.
4. If the answer is correct, the learner is taken straight to the answer, which shows the Chinese characters and pinyin.
5. If it is wrong, the learner can try again. After at least one attempt, they can press Reveal Answer to see the correct word and its pinyin.
6. Press Next to move on to the next picture.


### How it helps
- Linking a word to a picture makes it easier to remember than reading a word list.
- Typing the answer from memory shows learners what they really remember, instead of just recognising the word.
- Seeing the characters and pinyin together after each word helps learners connect how a word looks with how it sounds.
- Short categories of everyday objects keep each practice quick, so learners can fit it into a busy day.

<br>

# Users
| Email                                 | Password            |
| ------------------------------------- | --------------------|
| Alice@example.com                     | Alice123            |
| Ben@example.com                       | Ben321              |
