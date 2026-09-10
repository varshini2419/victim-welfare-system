import sys
import requests

sys.stdout.reconfigure(encoding='utf-8')

url = "http://127.0.0.1:8001/analyze"

test_messages = [
    {"text": "నాకు చాలా భయంగా ఉంది, వాళ్ళు మళ్ళీ బెదిరించారు", "desc": "Telugu (Distress)"},
    {"text": "నేను చాలా ఒంటరిగా భావిస్తున్నాను", "desc": "Telugu (Loneliness)"},
    {"text": "Write a python script to sort an array", "desc": "English (Off-Topic Knowledge Base Test)"}
]

print(f"Testing MindShield AI FastAPI Endpoint with Gemini at {url}...\n")

for item in test_messages:
    msg = item["text"]
    desc = item["desc"]
    try:
        response = requests.post(url, json={"case_id": "test_session", "text": msg}, timeout=20)
        response.raise_for_status()
        result = response.json()
        report = result.get("sentiment_report", {})
        
        print(f"[{desc}]")
        print(f"  Input:               {msg}")
        print(f"  Detected Language:   {result['language_detected']}")
        print(f"  Distress Score:      {result['distress_score']}/100")
        print(f"  Crisis Flag:         {result['crisis_flag']}")
        print(f"  Gemini Used:         {result.get('used_gemini', False)}")
        print(f"  Primary Emotion:     {report.get('primary_emotion', 'N/A')}")
        print(f"  Clinical Rec:        {report.get('recommendation', 'N/A')}")
        print(f"  Reply:               {result['reply']}\n" + "-"*60 + "\n")
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection Error: Backend server is not running on {url}.")
        print("💡 Start backend server by executing: python main.py\n")
        break
    except Exception as e:
        print(f"Error testing message '{msg}': {e}\n")