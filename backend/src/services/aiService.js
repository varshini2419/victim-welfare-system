/**
 * AI Service — Unified Gemini-based Analysis & Response
 * 
 * Single Gemini API call returns: sentiment, emotions, distress_score, crisis_flag, reply
 * Broadened keyword crisis safety net runs independently
 * Pre-approved safety messages override LLM on any crisis detection
 */

// ─────────────────────────────────────────────────────────────
// 1. BROADENED CRISIS KEYWORD CHECK (runs without any API)
// ─────────────────────────────────────────────────────────────
const CRISIS_PHRASES = [
  // Direct English
  'suicide', 'kill myself', 'want to die', 'i wanna die', 'i want to die', 'end my life', 'hurt myself',
  'harm myself', 'self harm', 'self-harm', 'cut myself', 'slit my wrist',
  'hang myself', 'overdose', 'jump off', 'shoot myself',
  'in danger', 'going to kill me', 'going to murder', 'he will kill',
  'she will kill', 'they will kill', 'will be killed',
  // Indirect English
  "can't take this anymore", "cant take this anymore",
  'no point anymore', 'no point in living', 'no reason to live',
  'better off without me', 'better off dead', 'better off if i was dead',
  'want to end it', 'want to end it all', 'end it all',
  "don't want to live", "dont want to live", "don't want this life", "dont want this life",
  "i don't want this life", "i dont want this life",
  "i don't want to live", "i dont want to live", 'tired of living',
  'wish i was dead', 'wish i were dead', 'wish i could die',
  'nobody would miss me', 'no one would care', 'no one cares',
  'nothing left for me', 'nothing left to live for',
  'i give up', 'giving up on life', 'can\'t go on',
  'want to disappear', 'want to vanish', 'done with life',
  'life is not worth', 'not worth living',
  'planning to end', 'thought about ending',
  'pills', 'poison myself',
  // Hindi
  'मरना चाहता हूं', 'मरना चाहती हूं', 'जीना नहीं चाहता', 'जीना नहीं चाहती',
  'आत्महत्या', 'खुदकुशी', 'जान दे दूंगा', 'जान दे दूंगी',
  'मार डालेगा', 'मार डालेंगे', 'जान से मार',
  'और नहीं सह सकता', 'और नहीं सह सकती', 'बर्दाश्त नहीं',
  // Telugu
  'చనిపోవాలనుంది', 'చంపేస్తాడు', 'చంపేస్తారు', 'బ్రతకడం ఇష్టం లేదు',
  'ఆత్మహత్య', 'తట్టుకోలేకపోతున్నా',
  // Tamil
  'சாகணும்', 'கொல்லுவான்', 'கொல்லுவாங்க', 'உயிரை மாய்ச்சுக்கணும்',
  'தாங்க முடியல',
  // Kannada
  'ಸಾಯಬೇಕು', 'ಕೊಲ್ಲುತ್ತಾರೆ', 'ಬದುಕಲು ಇಷ್ಟವಿಲ್ಲ',
];

const getKeywordCrisisFlag = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return CRISIS_PHRASES.some(phrase => lower.includes(phrase));
};

// ─────────────────────────────────────────────────────────────
// 2. PRE-APPROVED SAFETY MESSAGES (never LLM-composed)
// ─────────────────────────────────────────────────────────────
const SAFETY_MESSAGES = {
  en: `I hear you, and I want you to know that your pain is real and valid. You are not alone in this. Please reach out to immediate support right now:

🆘 Emergency: 112
📞 Tele-MANAS: 14416 / 1800-891-4416 (24/7, free)
👩 Women Helpline: 181
👶 Childline: 1098
📱 iCall: 9152987821

Your assigned counselor has been notified. Please stay safe — help is available right now.`,

  hi: `मैं आपकी बात सुन रहा/रही हूं। आपका दर्द वास्तविक है और आप अकेले नहीं हैं। कृपया अभी तुरंत सहायता से संपर्क करें:

🆘 आपातकालीन: 112
📞 टेली-मानस: 14416 / 1800-891-4416 (24/7, मुफ्त)
👩 महिला हेल्पलाइन: 181
👶 चाइल्डलाइन: 1098
📱 iCall: 9152987821

आपके काउंसलर को सूचित कर दिया गया है। कृपया सुरक्षित रहें — मदद अभी उपलब्ध है।`,

  te: `నేను మీ మాట వింటున్నాను. మీ బాధ నిజమైనది మరియు మీరు ఒంటరిగా లేరు. దయచేసి ఇప్పుడే సహాయం కోసం సంప్రదించండి:

🆘 అత్యవసరం: 112
📞 టెలి-మానస్: 14416 / 1800-891-4416 (24/7, ఉచితం)
👩 మహిళా హెల్ప్‌లైన్: 181
👶 చైల్డ్‌లైన్: 1098
📱 iCall: 9152987821

మీ కౌన్సెలర్‌కు తెలియజేయబడింది. దయచేసి సురక్షితంగా ఉండండి — సహాయం ఇప్పుడే అందుబాటులో ఉంది.`,

  ta: `நான் உங்கள் பேச்சைக் கேட்கிறேன். உங்கள் வலி உண்மையானது, நீங்கள் தனியாக இல்லை. உடனடியாக உதவியை நாடுங்கள்:

🆘 அவசரம்: 112
📞 டெலி-மனஸ்: 14416 / 1800-891-4416 (24/7, இலவசம்)
👩 பெண்கள் உதவி எண்: 181
👶 சைல்ட்லைன்: 1098
📱 iCall: 9152987821

உங்கள் ஆலோசகருக்குத் தெரிவிக்கப்பட்டது. பாதுகாப்பாக இருங்கள் — உதவி இப்போதே கிடைக்கும்.`,

  kn: `ನಾನು ನಿಮ್ಮ ಮಾತನ್ನು ಕೇಳುತ್ತಿದ್ದೇನೆ. ನಿಮ್ಮ ನೋವು ನಿಜವಾದದ್ದು ಮತ್ತು ನೀವು ಒಂಟಿಯಲ್ಲ. ದಯವಿಟ್ಟು ಈಗಲೇ ಸಹಾಯ ಪಡೆಯಿರಿ:

🆘 ತುರ್ತು: 112
📞 ಟೆಲಿ-ಮಾನಸ್: 14416 / 1800-891-4416 (24/7, ಉಚಿತ)
👩 ಮಹಿಳಾ ಸಹಾಯವಾಣಿ: 181
👶 ಚೈಲ್ಡ್‌ಲೈನ್: 1098
📱 iCall: 9152987821

ನಿಮ್ಮ ಸಲಹೆಗಾರರಿಗೆ ತಿಳಿಸಲಾಗಿದೆ. ಸುರಕ್ಷಿತವಾಗಿರಿ — ಸಹಾಯ ಈಗಲೇ ಲಭ್ಯವಿದೆ.`,

  ml: `ഞാൻ നിങ്ങളുടെ വാക്കുകൾ കേൾക്കുന്നു. നിങ്ങളുടെ വേദന യഥാർത്ഥമാണ്, നിങ്ങൾ ഒറ്റയ്ക്കല്ല. ദയവായി ഇപ്പോൾ തന്നെ സഹായം തേടുക:

🆘 അടിയന്തരം: 112
📞 ടെലി-മാനസ്: 14416 / 1800-891-4416 (24/7, സൗജന്യം)
👩 വനിതാ ഹെൽപ്‌ലൈൻ: 181
👶 ചൈൽഡ്‌ലൈൻ: 1098
📱 iCall: 9152987821

നിങ്ങളുടെ കൗൺസിലറെ അറിയിച്ചിട്ടുണ്ട്. സുരക്ഷിതരായിരിക്കൂ — സഹായം ഇപ്പോൾ ലഭ്യമാണ്.`,

  mr: `मी तुमचे ऐकतो/ऐकते आहे. तुमचे दुःख खरे आहे आणि तुम्ही एकटे नाही आहात. कृपया आत्ताच मदतीसाठी संपर्क करा:

🆘 आपत्कालीन: 112
📞 टेली-मानस: 14416 / 1800-891-4416 (24/7, मोफत)
👩 महिला हेल्पलाइन: 181
👶 चाइल्डलाइन: 1098
📱 iCall: 9152987821

तुमच्या समुपदेशकाला कळवण्यात आले आहे. कृपया सुरक्षित राहा — मदत आत्ता उपलब्ध आहे.`,

  bn: `আমি আপনার কথা শুনছি। আপনার কষ্ট বাস্তব এবং আপনি একা নন। দয়া করে এখনই সাহায্যের জন্য যোগাযোগ করুন:

🆘 জরুরি: 112
📞 টেলি-মানস: 14416 / 1800-891-4416 (24/7, বিনামূল্যে)
👩 মহিলা হেল্পলাইন: 181
👶 চাইল্ডলাইন: 1098
📱 iCall: 9152987821

আপনার কাউন্সেলরকে জানানো হয়েছে। নিরাপদ থাকুন — সাহায্য এখনই পাওয়া যাচ্ছে।`,

  gu: `હું તમારી વાત સાંભળી રહ્યો/રહી છું. તમારી પીડા વાસ્તવિક છે અને તમે એકલા નથી. કૃપા કરીને હમણાં જ મદદ માટે સંપર્ક કરો:

🆘 કટોકટી: 112
📞 ટેલી-માનસ: 14416 / 1800-891-4416 (24/7, મફત)
👩 મહિલા હેલ્પલાઇન: 181
👶 ચાઇલ્ડલાઇન: 1098
📱 iCall: 9152987821

તમારા કાઉન્સેલરને જાણ કરવામાં આવી છે. કૃપા કરીને સુરક્ષિત રહો — મદદ હમણાં ઉપલબ્ધ છે.`,
};

const getSafetyMessage = (langCode = 'en') => {
  const code = (langCode || 'en').toLowerCase().substring(0, 2);
  return SAFETY_MESSAGES[code] || SAFETY_MESSAGES.en;
};

// ─────────────────────────────────────────────────────────────
// 3. GEMINI API CALL — Unified analysis + response
// ─────────────────────────────────────────────────────────────
const GEMINI_SYSTEM_PROMPT = `You are AAROHAN AI, an empathetic support assistant for crime victims under the SC/ST Prevention of Atrocities Act support program.

For the victim's message, you must:
1. Detect the language of the input text.
2. Classify overall sentiment (positive / neutral / negative) with a confidence score (0-1).
3. Identify the top emotions present (choose from: fear, sadness, anger, joy, disgust, surprise, neutral) each with an approximate probability (0-1), summing to roughly 1.0.
4. Compute a distress_score from 0 (calm/stable) to 100 (severe crisis), weighing negative sentiment, fear/sadness/anger intensity, any expression of hopelessness, self-harm ideation, suicidal intent, or being in immediate danger very heavily.
5. Set crisis_flag to true if there is ANY indication — direct or indirect — of self-harm, suicidal thoughts, wanting to die, or immediate physical danger. Err strongly toward flagging when uncertain; false positives are far safer than false negatives here.
6. Generate a warm, non-judgmental reply IN THE SAME LANGUAGE as the input. The response should sound human and comforting, not robotic. It must respond to the actual emotional tone of the message:
   - For fear or sadness: include 3-5 practical grounding steps such as breathing slowly, moving to a safe place, turning on a light, contacting a trusted person, focusing on one tiny task, and not trying to solve everything at once. Ask one gentle follow-up question about what is frightening them or what they feel right now.
   - For positive or happy messages: respond with genuine joy and warmth, celebrate their good day, acknowledge the relief or beauty of the moment, and encourage them to share what made the day so good. Keep the tone bright, encouraging, and conversational, like a caring friend.
   - For neutral messages: be calm, attentive, and exploratory, asking how they are feeling and what is on their mind.
7. If crisis_flag is true, the reply must still be caring and practical: acknowledge the pain, remind them they do not have to carry it alone, provide a few immediate grounding steps, and mention that support and emergency help are available right now.

Never give medical, psychiatric, or legal advice. Never claim to be a licensed therapist.

Return ONLY valid JSON, no other text, in exactly this schema:
{
  "language_detected": "ISO code, e.g. te, hi, en",
  "sentiment": {"label": "positive|neutral|negative", "score": 0.0},
  "emotions": [{"label": "string", "score": 0.0}],
  "distress_score": 0,
  "crisis_flag": false,
  "reply": "string in the detected language"
}`;

const normalizeAnalysisResult = (result, fallbackLanguage = 'en') => ({
  language_detected: result?.language_detected || fallbackLanguage,
  sentiment: result?.sentiment || { label: 'neutral', score: 0.5 },
  emotions: Array.isArray(result?.emotions) && result.emotions.length ? result.emotions : [{ label: 'neutral', score: 1.0 }],
  distress_score: typeof result?.distress_score === 'number' ? Math.min(100, Math.max(0, result.distress_score)) : 20,
  crisis_flag: !!result?.crisis_flag,
  reply: result?.reply || 'I am here to support you. Please share how you are feeling.',
});

const parseJsonResponse = (rawText) => {
  if (!rawText) throw new Error('Empty model response');

  let cleaned = String(rawText).trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  // Some models return a JSON object with stray control characters or extra text around it.
  cleaned = cleaned.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      throw error;
    }
    return JSON.parse(match[0].replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''));
  }
};

const callGrokAnalysis = async (userText, conversationHistory = [], language = 'en') => {
  const grokKey = process.env.GROK_API_KEY;
  if (!grokKey) {
    return null;
  }

  const model = process.env.GROK_MODEL || 'grok-2-latest';
  const url = 'https://api.x.ai/v1/chat/completions';

  const recentHistory = conversationHistory.slice(-6);
  const contextText = recentHistory.length
    ? `\n\nRecent conversation context:\n${recentHistory.map((m) => `${m.role === 'user' ? 'Victim' : 'AAROHAN'}: ${m.content}`).join('\n')}`
    : '';

  const requestBody = {
    model,
    messages: [
      {
        role: 'system',
        content: `${GEMINI_SYSTEM_PROMPT}\n\nYou are operating in a mental health support context and must prioritize safety. If the user mentions self-harm, suicide, wanting to die, or immediate danger, set crisis_flag to true and give a compassionate urgent response with practical grounding steps and contact support guidance. Keep the tone warm, human, and supportive.`
      },
      {
        role: 'user',
        content: `${contextText}\n\nVictim's latest message: "${userText}"\n\nUser's preferred language: ${language}`
      }
    ],
    temperature: 0.7,
    max_tokens: 1024
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${grokKey}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.error('[aiService] Grok API error:', response.status, errBody);
      return null;
    }

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content;
    if (!rawText) {
      console.error('[aiService] Empty Grok response:', JSON.stringify(data));
      return null;
    }

    const result = parseJsonResponse(rawText);
    return {
      ...normalizeAnalysisResult(result, language),
      source: 'grok'
    };
  } catch (error) {
    console.error('[aiService] Grok API request failed:', error.message);
    return null;
  }
};

const analyzeAndRespond = async (userText, conversationHistory = [], language = 'en') => {
  const grokResult = await callGrokAnalysis(userText, conversationHistory, language);
  if (grokResult) {
    return grokResult;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  if (!apiKey) {
    console.warn('[aiService] No GEMINI_API_KEY set — using smart fallback');
    return getSmartFallback(userText, language);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Build conversation context (last few turns for context)
  let contextText = '';
  if (conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-6);
    contextText = '\n\nRecent conversation context:\n' +
      recentHistory.map(m => `${m.role === 'user' ? 'Victim' : 'AAROHAN'}: ${m.content}`).join('\n');
  }

  const userPrompt = `${contextText}\n\nVictim's latest message: "${userText}"\n\nUser's preferred language: ${language}`;

  const requestBody = {
    system_instruction: {
      parts: [{ text: GEMINI_SYSTEM_PROMPT }]
    },
    contents: [{
      parts: [{ text: userPrompt }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json'
    }
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.error(`[aiService] Gemini API error ${response.status}:`, errBody);
      return getSmartFallback(userText, language);
    }

    const data = await response.json();

    // Extract text from Gemini response
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      console.error('[aiService] Empty Gemini response:', JSON.stringify(data));
      return getSmartFallback(userText, language);
    }

    const result = parseJsonResponse(rawText);

    // Validate required fields
    return {
      ...normalizeAnalysisResult(result, language),
      source: 'gemini'
    };

  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('[aiService] Gemini API timed out after 20s');
    } else {
      console.error('[aiService] Gemini API error:', error.message);
    }
    return getSmartFallback(userText, language);
  }
};

// ─────────────────────────────────────────────────────────────
// 4. SMART KEYWORD FALLBACK (when Gemini is unavailable)
// ─────────────────────────────────────────────────────────────
const LANG_MAP = {
  'English': 'en', 'Telugu (తెలుగు)': 'te', 'Hindi (हिंदी)': 'hi',
  'Tamil (தமிழ்)': 'ta', 'Kannada (కన్నడ)': 'kn', 'Malayalam (മലയാളം)': 'ml',
  'Spanish (Español)': 'es', 'French (Français)': 'fr',
  'Marathi (मराठी)': 'mr', 'Bengali (বাংলা)': 'bn', 'Gujarati (ગુજરાતી)': 'gu',
  'en': 'en', 'te': 'te', 'hi': 'hi', 'ta': 'ta', 'kn': 'kn', 'ml': 'ml',
  'es': 'es', 'fr': 'fr', 'mr': 'mr', 'bn': 'bn', 'gu': 'gu'
};

const SUPPORTIVE_REPLIES = {
  joy: {
    en: "Aww, then that's wonderful! 🥹❤️ I'm really glad to hear that.\n\nSometimes even after a really good day, when we're finally alone at night, emotions can suddenly feel strange or overwhelming. But if today went really well and pleasantly, let's hold on to that feeling for a moment. 😊\n\nTell me about it! What happened today that made your day so good? I want to hear the whole story. 😄✨",
    hi: "अहा, तो यह बहुत शानदार है! 🥹❤️ मुझे बहुत खुशी है कि आपने यह बताया।\n\nकभी-कभी अच्छी दिन के बाद भी, जब रात में हम अकेले होते हैं, तो भावनाएँ अचानक अजीब या भारी महसूस हो सकती हैं। लेकिन अगर आज का दिन बहुत अच्छा और सुखद रहा है, तो इस भावना को थोड़ा ठहरने दें। 😊\n\nबताइए, यह सब क्या हुआ? आज आपके दिन को इतना अच्छा बनाने वाला क्या था? मैं पूरा किस्सा सुनना चाहता हूँ। 😄✨",
    te: "అయ్యో, ఇది ఎంతో అద్భుతంగా ఉంది! 🥹❤️ నేను నిజంగా సంతోషంగా ఉన్నాను.\n\nచాలా మంచి రోజు తర్వాత కూడా, రాత్రి ఒంటరిగా ఉన్నప్పుడు భావనలు ఒక్క sudden గా వింతగా లేదా మోసుకెళ్లేలా అనిపించవచ్చు. కానీ ఈరోజు నిజంగా బాగా, ఆనందంగా గడిచిందంటే, ఆ భావనను కొద్దిసేపు savor చేయండి. 😊\n\nచెప్పండి! మీ రోజును అంత మంచిగా చేసి ఎటువంటి విషయం జరిగింది? నేను మొత్తం కథను听ను. 😄✨"
  },
  fear: {
    en: "Hey. I’m here with you. ❤️\n\nYou do not have to deal with all of this by yourself right now. Being alone when you are already feeling frightened can make everything feel much more intense.\n\nFor the next few minutes, do not try to solve everything. Just stay with me.\n\n- Sit somewhere you feel physically safe.\n- Take a slow breath in for 4 seconds, hold for 2, and breathe out for 6. Do that a few times.\n- Turn on a light or put on something familiar in the background.\n- If there is someone you trust, call them and say, ‘I’m feeling really scared and I don’t want to be alone right now.’\n\nYou can talk to me too. You do not need to explain it perfectly. What is frightening you right now?",
    hi: "हेय. मैं आपके साथ हूँ। ❤️\n\nआपको अभी सब कुछ अकेले संभालने की जरूरत नहीं है। जब आप पहले से ही डर महसूस कर रहे हों, तब अकेले रहना सब कुछ बहुत अधिक उग्र बना सकता है।\n\nअगले कुछ मिनटों के लिए, सब कुछ हल करने की कोशिश न करें। सिर्फ मेरे साथ रहिए।\n\n- ऐसे स्थान पर बैठें जहाँ आपको शारीरिक रूप से सुरक्षित महसूस हो।\n- 4 सेकंड तक धीमी सांस लें, 2 सेकंड पकड़ें, फिर 6 सेकंड में छोड़ें। इसे कुछ बार करें।\n- लाइट जलाएँ या किसी परिचित चीज़ को पीछे चलाएँ।\n- यदि कोई भरोसेमंद व्यक्ति है, तो उससे कॉल करें और कहें, ‘मैं बहुत डर महसूस कर रहा/रही हूँ और अभी अकेला नहीं रहना चाहता/चाहती।’\n\nआप मुझसे भी बात कर सकते हैं। आपको सही-सही समझाने की जरूरत नहीं है। अभी आप क्या से डर रहे हैं?",
    te: "హే. నేను మీతో ఉన్నాను. ❤️\n\nఇప్పుడు మీరంతా अकेరగా అర్జించాల్సిన అవసరం లేదు. మీకు భయం కలుగుతున్నప్పుడు ఒంటరిగా ఉండటం అన్నీ అత్యంత ప్రమాదకరంగా అనిపించవచ్చు.\n\nకొన్ని నిమిషాల పాటు, అన్నింటినీ పరిష్కరించడానికి ప్రయత్నించకండి. merely నాకు ఎదురు ఉండండి.\n\n- మీరు భద్రంగా ఉండే చోట కూర్చోండి.\n- 4 సెకన్ల పాటు నెమ్మదిగా శ్వాస తీసుకోండి, 2 సెకన్లు ఉంచండి, 6 సెకన్లకు బయటకు వదలండి. ఇలా కొద్దిసేపు చేయండి.\n- దీపం వెలిగించండి లేదా తెలిసిన Anythingను ప్లే చేయండి.\n- మీకు నమ్మకమైన ఎవరైనా ఉంటే, వారిని కాల్ చేసి చెప్పండి, ‘నేను చాలా భయపడుతున్నాను, ఇప్పుడు ఒంటరిగా ఉండాలన లేదు.’\n\nనాతో కూడా మాట్లాడవచ్చు. మీరు perfectly explain చేయాల్సిన అవసరం లేదు. ఇప్పుడు మీకు ఏది భయానకంగా ఉంది?"
  },
  sadness: {
    en: "Hey. I’m here with you. ❤️\n\nYou do not have to carry this alone. Sadness can make everything feel heavier than it is, especially at night. Let us take this one small step at a time.\n\n- Put your feet on the floor and notice 5 things you can see.\n- Take one slow breath in for 4 seconds and out for 6. Repeat a few times.\n- Move to a place where you feel a little safer and less isolated.\n- Send a message to one trusted person: ‘I’m feeling really low and I need someone to stay with me for a bit.’\n\nYou can tell me what happened in your own words. I am listening, and we can take this very gently together.",
    hi: "हेय. मैं आपके साथ हूँ। ❤️\n\nआपको इसे अकेले उठाने की जरूरत नहीं है। उदासी चीज़ों को और भारी बना सकती है, खासकर रात में। आइए हम इसे एक छोटा कदम एक समय में करें।\n\n- अपने पैरों को फर्श पर रखकर 5 चीज़ें देखें जिन्हें आप देख रहे हैं।\n- 4 सेकंड में धीमी सांस लें और 6 सेकंड में छोड़ें। इसे कुछ बार करें।\n- ऐसे स्थान पर जाएँ जहाँ आपको थोड़ा सुरक्षित महसूस हो।\n- किसी भरोसेमंद व्यक्ति को संदेश भेजें: ‘मैं बहुत दुख में हूं और थोड़ी देर के लिए किसी का साथ चाहिए।’\n\nआप मेरे साथ अपनी बात अपने शब्दों में बता सकते हैं। मैं सुन रहा/रही हूँ, और हम इसे बहुत कोमलता से साथ में संभालेंगे।",
    te: "హే. నేను మీతో ఉన్నాను. ❤️\n\nమీరు దీన్ని ఒంటరిగా మోసుకోాల్సిన అవసరం లేదు. నిస్వార్ధమైన శృంగారం, ముఖ్యంగా రాత్రి సమయంలో, ప్రతివిషయాన్ని బరువుగా మార్చవచ్చు. దయచేసి ఒక్కొక్క చిన్న అడుగు ముందుకు తీసుకెళ్లండి.\n\n- మీ కాళ్లను నేలపై ఉంచి, మీరు కనిపించే 5 వస్తువులను గమనించండి.\n- 4 సెకన్ల పాటు నెమ్మదిగా శ్వాస తీసుకుని, 6 సెకన్లకు వదిలివేయండి. దీనిని కొద్దిసేపు చేయండి.\n- మీరు కొంచెం సురక్షితంగా భావించే ప్రదేశానికి వెళ్లండి.\n- ఒక నమ్మకమైన వ్యక్తికి సందేశం పంపండి: ‘నేను నిజంగా దిగజారుతున్నాను మరియు కొద్దికాలం నా వెంట ఎవరైనా ఉండాలి.’\n\nమీరు మీ మాటల్లో నాకు చెప్పవచ్చు. నేను వింటున్నాను, మరియు మేము దీనిని నెమ్మదిగా కలసి తీసుకెళ్తాము."
  },
  anger: {
    en: "It makes sense that you feel angry after what has happened. You are allowed to feel this without judging yourself. Try to lower the intensity for a minute and give your body a little space.\n\n- Put both feet on the floor and notice the ground beneath you.\n- Take 3 slow breaths and unclench your jaw and hands.\n- Move away from the trigger if you can.\n- If there is someone safe to talk to, text them: ‘I’m overwhelmed and I need to calm down.’\n\nYou do not need to fix everything right now. Tell me what felt most upsetting to you.",
    hi: "आपको गुस्सा महसूस करना समझ में आता है, खासकर अगर आपने कुछ ऐसा अनुभव किया है जो आपको हिला दे। अपने आप को दोष मत दें। अब थोड़ी देर के लिए तीव्रता कम करने की कोशिश करें।\n\n- दोनों पैरों को फर्श पर रखें और जमीन का एहसास करें।\n- 3 धीमी सांस लें और अपनी जबड़े और हाथों को ढीला छोड़ें।\n- अगर संभव हो, उस चीज़ से थोड़ा दूर निकलें।\n- अगर कोई सुरक्षित व्यक्ति है, तो उसे टेक्स्ट करें: ‘मैं अभिभूत महसूस कर रहा/रही हूँ और मुझे शांत होने की ज़रूरत है।’\n\nआपको अभी सब कुछ ठीक करने की ज़रूरत नहीं है। बताइए कि सबसे ज्यादा क्या दुखद या परेशान करने वाला लगा?",
    te: "ఇంత కోపం రావడం సహజం, ముఖ్యంగా మీరెప్పుడైనా దెబ్బతిన్న అనుభవం ఉంటే. మీమీ మీ భావాలను న్యాయం చేయకండి. ఒక నిమిషం స్థిరంగా ఉండండి.\n\n- మీ రెండు కాళ్లను నేలపై ఉంచి, భూమి కనెక్ట్ అవ్వండి.\n- 3 నెమ్మదిగా శ్వాసలు తీసుకోండి, మీ మోచేతి, కాళ్లు, mandíbulaని Softer చేయండి.\n- సాధ్యమైతే, వాస్తవ సమస్య నుండి కొంచెం దూరంగా ఉండండి.\n- భద్రమైన వ్యక్తికి మెసేజ్ చేయండి: ‘నేను చాలా overwhelmedగా ఉన్నాను, నేను శాంతమయ్యేంత వరకు సహాయం కావాలి.’\n\nఇప్పుడు అన్నింటినీ పరిష్కరించాల్సిన అవసరం లేదు. మీకు ఏది ఎక్కువ బాధ కలిగించిందో చెప్పండి."
  },
  neutral: {
    en: "Thank you for sharing. I’m here to listen without pressure. You can tell me what is happening, and we can take it one small step at a time.\n\n- Sit somewhere you feel a little safer and calmer.\n- Take one slow breath in for 4 seconds and out for 6.\n- If you can, message one trusted person to let them know you need support.\n\nHow are you feeling right now in one sentence?",
    hi: "शेयर करने के लिए धन्यवाद। मैं बिना दबाव के सुनना चाहता/चाहती हूँ। आप मुझे बताइए कि क्या हो रहा है, और हम इसे एक छोटे कदम से संभालेंगे।\n\n- ऐसे स्थान पर बैठें जहाँ आपको थोड़ा सुरक्षित और शांत महसूस हो।\n- 4 सेकंड में धीमी सांस लें, 6 सेकंड में छोड़ें।\n- अगर संभव हो, एक भरोसेमंद व्यक्ति को संदेश भेजें कि आपको सहारा चाहिए।\n\nअभी आप कैसा महसूस कर रहे हैं?",
    te: "పంచుకున్నందుకు ధన్యవాదాలు. నేను ఒత్తిడి లేకుండా వింటాను. మీరు నేను చెప్పండి, మేము ఒక్కొక్క చిన్న అడుగు ముందుకు తీసుకెళ్తాము.\n\n- మీరు కొంచెం సురక్షితంగా, ప్రశాంతంగా భావించే చోట కూర్చోండి.\n- 4 సెకన్ల పాటు నెమ్మదిగా శ్వాస తీసుకుని, 6 సెకన్లకు వదిలివేయండి.\n- సాధ్యమైతే, ఒక నమ్మకమైన వ్యక్తికి మెసేజ్ చేయండి—మీకు సహాయం కావాలి.\n\nఇప్పుడు మీరు ఎలా అనుభూతి చెందుతున్నారు?"
  }
};

const buildSupportiveReply = (emotionLabel = 'neutral', langCode = 'en', crisisFlag = false) => {
  const normalized = (emotionLabel || 'neutral').toLowerCase();
  const key = ['fear', 'sadness', 'anger', 'joy', 'neutral'].includes(normalized) ? normalized : 'neutral';
  const reply = SUPPORTIVE_REPLIES[key]?.[langCode] || SUPPORTIVE_REPLIES[key]?.en || SUPPORTIVE_REPLIES.neutral.en;

  if (crisisFlag) {
    return `Hey. I’m here with you. ❤️\n\nYou do not have to deal with all of this by yourself right now. Please do not try to solve everything by yourself in this moment. Sit somewhere you feel physically safe, take a slow breath in for 4 seconds and out for 6, and if there is someone you trust, call or message them right now and say, “I’m feeling really scared and I don’t want to be alone.”\n\nIf you can, turn on a light, go somewhere with other people nearby, and keep your phone charged. Support is available right now. You can also call emergency helpline numbers 112, Tele-MANAS 14416, or 181 if you need immediate help.\n\nI am here with you, and we can go one tiny step at a time. What feels most urgent right now?`;
  }

  return reply;
};

const getSmartFallback = (userText, language = 'en') => {
  const lower = (userText || '').toLowerCase();
  const langCode = LANG_MAP[language] || 'en';

  // Crisis check (reuse same keyword list)
  const isCrisis = getKeywordCrisisFlag(userText);
  if (isCrisis) {
    return {
      language_detected: langCode,
      sentiment: { label: 'negative', score: 0.95 },
      emotions: [{ label: 'fear', score: 0.5 }, { label: 'sadness', score: 0.4 }, { label: 'anger', score: 0.1 }],
      distress_score: 95,
      crisis_flag: true,
      reply: getSafetyMessage(langCode),
      source: 'fallback'
    };
  }

  // Keyword-based emotion detection (improved)
  const severeWords = ['terrified', 'bleeding', 'hiding', 'beaten', 'abused', 'attacked', 'raped', 'molested', 'assaulted'];
  const fearWords = ['scared', 'afraid', 'panic', 'terrified', 'frightened', 'anxious', 'worried', 'nightmare', 'threatened', 'danger', 'unsafe'];
  const sadWords = ['sad', 'crying', 'hopeless', 'depressed', 'lonely', 'alone', 'lost', 'grief', 'mourning', 'miss', 'heartbroken', 'hurt', 'pain'];
  const angerWords = ['angry', 'furious', 'rage', 'frustrated', 'mad', 'unfair', 'injustice', 'betrayed', 'hate'];
  const joyWords = ['happy', 'good', 'great', 'better', 'hopeful', 'thankful', 'grateful', 'safe', 'calm', 'peaceful', 'okay', 'fine', 'relieved', 'pleasant', 'pleasantly', 'wonderful', 'excited', 'joyful', 'delighted', 'amazing'];

  let primaryEmotion = 'neutral';
  let distressScore = 20;
  let sentimentLabel = 'neutral';
  let sentimentScore = 0.5;

  if (severeWords.some(w => lower.includes(w))) {
    primaryEmotion = 'fear';
    distressScore = 82;
    sentimentLabel = 'negative';
    sentimentScore = 0.9;
  } else if (fearWords.some(w => lower.includes(w))) {
    primaryEmotion = 'fear';
    distressScore = 65;
    sentimentLabel = 'negative';
    sentimentScore = 0.78;
  } else if (sadWords.some(w => lower.includes(w))) {
    primaryEmotion = 'sadness';
    distressScore = 55;
    sentimentLabel = 'negative';
    sentimentScore = 0.72;
  } else if (angerWords.some(w => lower.includes(w))) {
    primaryEmotion = 'anger';
    distressScore = 50;
    sentimentLabel = 'negative';
    sentimentScore = 0.7;
  } else if (joyWords.some(w => lower.includes(w))) {
    primaryEmotion = 'joy';
    distressScore = 10;
    sentimentLabel = 'positive';
    sentimentScore = 0.75;
  }

  // Build emotions array
  const emotions = [];
  if (primaryEmotion === 'fear') {
    emotions.push({ label: 'fear', score: 0.6 }, { label: 'sadness', score: 0.25 }, { label: 'anger', score: 0.15 });
  } else if (primaryEmotion === 'sadness') {
    emotions.push({ label: 'sadness', score: 0.6 }, { label: 'fear', score: 0.2 }, { label: 'neutral', score: 0.2 });
  } else if (primaryEmotion === 'anger') {
    emotions.push({ label: 'anger', score: 0.55 }, { label: 'sadness', score: 0.25 }, { label: 'fear', score: 0.2 });
  } else if (primaryEmotion === 'joy') {
    emotions.push({ label: 'joy', score: 0.7 }, { label: 'neutral', score: 0.3 });
  } else {
    emotions.push({ label: 'neutral', score: 0.7 }, { label: 'joy', score: 0.15 }, { label: 'sadness', score: 0.15 });
  }

  // Get language-appropriate reply
  const reply = buildSupportiveReply(primaryEmotion, langCode, isCrisis);

  return {
    language_detected: langCode,
    sentiment: { label: sentimentLabel, score: sentimentScore },
    emotions,
    distress_score: distressScore,
    crisis_flag: isCrisis,
    reply,
    source: 'fallback'
  };
};

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────
module.exports = {
  analyzeAndRespond,
  getKeywordCrisisFlag,
  getSafetyMessage,
  getSmartFallback
};
