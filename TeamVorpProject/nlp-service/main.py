import jieba
import stanza
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi import HTTPException
from exercises import load_exercises
from rules import prepare_answers, check_sentence

EXERCISES = load_exercises()
PREPARED = {ex_id: prepare_answers(ex) for ex_id, ex in EXERCISES.items()}

# --- runs ONCE, when the server starts ---
stanza.download("zh-hans", model_dir="./stanza_resources")
for w in ["巴刹", "打包", "咖椰"]:
    jieba.add_word(w, freq=1_000_000)

for parts in [("煮", "饭"), ("煮", "鱼"), ("我", "会"), ("喝", "咖啡")]:
    jieba.suggest_freq(parts, True)

nlp = stanza.Pipeline(
    "zh-hans",
    dir="./stanza_resources",
    processors="tokenize,pos,lemma,depparse",
    tokenize_pretokenized=True,
    download_method=None,
)

app = FastAPI()

# describes JSON expected
class AnalyzeRequest(BaseModel):
    text: str

class CheckRequest(BaseModel):
    exerciseId: str
    text: str

# routes
def analyze_text(text):
    tokens = jieba.lcut(text)
    if not tokens:
        return []
    doc = nlp([tokens])
    result = []
    pos = 0
    for w in doc.sentences[0].words:
        result.append({
            "index": w.id,
            "text": w.text,
            "upos": w.upos,
            "xpos": w.xpos,
            "head": w.head,
            "deprel": w.deprel,
            "start": pos,
            "end": pos + len(w.text),
        })
        pos += len(w.text)
    return result


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    return {"tokens": analyze_text(req.text)}


@app.post("/check")
def check(req: CheckRequest):
    exercise = EXERCISES.get(req.exerciseId)
    if exercise is None:
        raise HTTPException(status_code=404, detail=f"Unknown exercise: {req.exerciseId}")
    text = "".join(req.text.split())  # remove whitespace
    if not text:
        raise HTTPException(status_code=400, detail="Empty sentence")
    tokens = analyze_text(text)
    result = check_sentence(exercise, PREPARED[req.exerciseId], text, tokens)
    return {"exerciseId": req.exerciseId, **result}
# python -m uvicorn main:app --reload --port 8000