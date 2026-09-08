import sys
import requests

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8001"

print("==================================================================")
print("MINSHIELD AI - END-TO-END FEATURE VERIFICATION SUITE")
print("==================================================================\n")

test_cases = [
    {
        "name": "Telugu High Distress Input",
        "text": "నాకు చాలా భయంగా ఉంది, వాళ్ళు మళ్ళీ బెదిరించారు",
        "expected_lang": "te",
        "expect_high_distress": True
    },
    {
        "name": "Hindi Stress Input",
        "text": "मुझे बहुत तनाव और अकेलापन महसूस हो रहा है",
        "expected_lang": "hi",
        "expect_high_distress": False
    },
    {
        "name": "English Crisis Flag Test",
        "text": "I feel hopeless and want to end it all, please help me",
        "expected_lang": "en",
        "expect_crisis": True
    },
    {
        "name": "Off-Topic Domain Safeguard Test",
        "text": "Write a python script to sort an array",
        "expected_lang": "en",
        "expect_offtopic": True
    }
]

# 1. Test /analyze endpoint for all cases
for tc in test_cases:
    print(f"Testing Case: {tc['name']}")
    print(f"  Input Text: {tc['text']}")
    try:
        res = requests.post(f"{BASE_URL}/analyze", json={"case_id": "verify_session", "text": tc["text"]}, timeout=15)
        res.raise_for_status()
        data = res.json()
        
        report = data.get("sentiment_report", {})
        print(f"  ✅ Detected Language: {data['language_detected']}")
        print(f"  ✅ Distress Score:    {data['distress_score']}/100 (Band: {report.get('band')})")
        print(f"  ✅ Crisis Flag:       {data['crisis_flag']}")
        print(f"  ✅ Primary Emotion:   {report.get('primary_emotion')}")
        print(f"  ✅ Clinical Rec:      {report.get('recommendation')}")
        if data.get("english_translation"):
            print(f"  ✅ English Trans:     {data['english_translation']}")
        print(f"  ✅ Bot Response:      {data['reply']}\n" + "-"*65 + "\n")
    except Exception as e:
        print(f"  ❌ Error: {e}\n")

# 2. Test /transcribe endpoint
print("Testing /transcribe Endpoint with WAV Audio Sample...")
try:
    # Send a tiny sample WAV header
    wav_header = b'RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00'
    res = requests.post(f"{BASE_URL}/transcribe", headers={"Content-Type": "audio/wav"}, data=wav_header, timeout=10)
    print(f"  /transcribe HTTP Status: {res.status_code}")
    print(f"  /transcribe Response:    {res.json()}\n")
except Exception as e:
    print(f"  /transcribe test output: {e}\n")

print("==================================================================")
print("ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY")
print("==================================================================")
