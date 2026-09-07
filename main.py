import os
import re
from datetime import datetime
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline
from langdetect import detect
from deep_translator import GoogleTranslator

app = FastAPI()

# ---------- Load models once, from your Desktop folder ----------
BASE = os.path.join(os.path.expanduser("~"), "Desktop", "models")
sentiment_model = pipeline("sentiment-analysis", model=os.path.join(BASE, "sentiment_model"))
emotion_model = pipeline("text-classification", model=os.path.join(BASE, "emotion_model"), top_k=None)

# ---------- Crisis keywords ----------
CRISIS_KEYWORDS = ["end my life", "can't go on", "want to die",
                    "hurt myself", "no point living", "they will kill me"]

# ---------- Response templates ----------
RESPONSES = {
    "high": ["That sounds really hard to carry. You're not alone — I'm noting this so your counsellor can reach out."],
    "moderate": ["Thank you for sharing that. How have you been sleeping this week?"],
    "stable": ["Good to hear from you. Is there anything you'd like support with today?"],
    "crisis": ["I'm concerned about what you shared. Help is being arranged right now. Please also reach out to your helpline — someone is available to talk immediately."]
}

# ---------- Safe translation helper ----------
def clean_contractions(text: str) -> str:
    contractions = {
        "you'd": "you would",
        "you're": "you are",
        "I'm": "I am",
        "can't": "cannot",
        "don't": "do not",
        "didn't": "did not",
        "—": "-",
        "–": "-"
    }
    for k, v in contractions.items():
        text = text.replace(k, v)
    return text

def translate_single_sentence(sentence: str, source: str, target: str) -> str:
    s = sentence.strip()
    if not s or source == target:
        return sentence
    cleaned = clean_contractions(s)
    for src in [source, "auto"]:
        try:
            res = GoogleTranslator(source=src, target=target).translate(cleaned)
            if res and not str(res).startswith("Error 500"):
                return res
        except Exception:
            continue
    return s

def safe_translate(text: str, source: str, target: str) -> str:
    if not text or source == target:
        return text
    parts = re.split(r'([.?!;\n]+)', text)
    result = []
    for i in range(0, len(parts), 2):
        chunk = parts[i]
        punc = parts[i+1] if i+1 < len(parts) else ""
        if chunk.strip():
            translated_chunk = translate_single_sentence(chunk, source, target)
            result.append(translated_chunk + punc)
        else:
            result.append(punc)
    return "".join(result).strip()

# ---------- Request format from your React chatbot ----------
class Message(BaseModel):
    case_id: str
    text: str

@app.post("/analyze")
def analyze(msg: Message):
    text = msg.text

    # 1. Detect language + translate to English
    try:
        lang = detect(text)
    except Exception:
        lang = "en"

    english_text = safe_translate(text, source=lang, target="en") if lang != "en" else text

    # 2. Crisis check (on English text, before anything else)
    is_crisis = any(kw in english_text.lower() for kw in CRISIS_KEYWORDS)

    # 3. Sentiment + emotion
    sentiment = sentiment_model(english_text)[0]
    emotions = emotion_model(english_text)[0]

    # 4. Distress score
    sentiment_score = sentiment['score'] * 100 if sentiment['label'] == 'negative' else (100 - sentiment['score'] * 100)
    emotion_weights = {'fear': 1.5, 'sadness': 1.4, 'anger': 1.2, 'disgust': 1.0, 'surprise': 0.5, 'joy': -1.0, 'neutral': 0}
    emotion_score = sum(e['score'] * emotion_weights.get(e['label'], 0) for e in emotions) * 40
    emotion_score = max(0, min(100, emotion_score))
    raw_score = (sentiment_score * 0.5) + (emotion_score * 0.5)
    if is_crisis:
        raw_score = max(raw_score, 90)
    distress_score = round(min(100, raw_score), 1)

    # 5. Pick a response
    if is_crisis:
        band = "crisis"
    elif distress_score >= 70:
        band = "high"
    elif distress_score >= 40:
        band = "moderate"
    else:
        band = "stable"
    reply_english = RESPONSES[band][0]

    # 6. Translate reply back to victim's language
    reply_final = safe_translate(reply_english, source="en", target=lang) if lang != "en" else reply_english

    return {
        "case_id": msg.case_id,
        "language_detected": lang,
        "sentiment": sentiment,
        "emotions": emotions,
        "distress_score": distress_score,
        "crisis_flag": is_crisis,
        "reply": reply_final,
        "timestamp": datetime.utcnow().isoformat()
    }