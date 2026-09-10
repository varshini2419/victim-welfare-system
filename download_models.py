import os
from transformers import pipeline

# This creates the folder automatically if it doesn't exist
SAVE_DIR = os.path.join(os.path.expanduser("~"), "Desktop", "models")
sentiment_path = os.path.join(SAVE_DIR, "sentiment_model")
emotion_path = os.path.join(SAVE_DIR, "emotion_model")

os.makedirs(sentiment_path, exist_ok=True)
os.makedirs(emotion_path, exist_ok=True)

print("Downloading sentiment model...")
sentiment_model = pipeline("sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment-latest")
sentiment_model.save_pretrained(sentiment_path)
sentiment_model.tokenizer.save_pretrained(sentiment_path)
print("Sentiment model saved to:", sentiment_path)

print("Downloading emotion model...")
emotion_model = pipeline("text-classification",
    model="j-hartmann/emotion-english-distilroberta-base", top_k=None)
emotion_model.save_pretrained(emotion_path)
emotion_model.tokenizer.save_pretrained(emotion_path)
print("Emotion model saved to:", emotion_path)

print("DONE. You will never need to download these again.")