import sys
import requests

sys.stdout.reconfigure(encoding='utf-8')

url = "http://localhost:8001/analyze"

test_messages = [
    "నాకు చాలా భయంగా ఉంది, వాళ్ళు మళ్ళీ బెదిరించారు",  # I am very scared, they threatened me again
    "ఈ వారం కొంచెం బాగానే ఉంది",                          # This week has been okay
    "నేను చాలా ఒంటరిగా భావిస్తున్నాను" ,
    "నాకు ఇప్పుడు ఏమి చేయాలో అర్థం కావడం లేదు."               # I feel very alone
]

for msg in test_messages:
    response = requests.post(url, json={"case_id": "test_001", "text": msg})
    result = response.json()
    print(f"\nInput: {msg}")
    print(f"Detected language: {result['language_detected']}")
    print(f"Distress score: {result['distress_score']}")
    print(f"Reply: {result['reply']}")