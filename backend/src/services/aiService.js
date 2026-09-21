/**
 * AI Service — Unified Analysis & Response
 * 
 * Single API call returns: sentiment, emotions, distress_score, crisis_flag, reply
 * Broadened keyword crisis safety net runs independently
 * Pre-approved safety messages override LLM on any crisis detection
 * Legal RAG: retrieved provisions are injected so replies can cite real law
 */

const { retrieveLegalContext } = require('./legalKnowledge');

// ─────────────────────────────────────────────────────────────
// 1. BROADENED CRISIS KEYWORD CHECK (runs without any API)
// ─────────────────────────────────────────────────────────────
const CRISIS_PHRASES = [
  // Direct English
  'suicide', 'kill myself', 'want to die', 'end my life', 'hurt myself',
  'harm myself', 'self harm', 'self-harm', 'cut myself', 'slit my wrist',
  'hang myself', 'overdose', 'jump off', 'shoot myself',
  'in danger', 'going to kill me', 'going to murder', 'he will kill',
  'she will kill', 'they will kill', 'will be killed',
  // Indirect English
  "can't take this anymore", "cant take this anymore",
  'no point anymore', 'no point in living', 'no reason to live',
  'better off without me', 'better off dead', 'better off if i was dead',
  'want to end it', 'want to end it all', 'end it all',
  "don't want to live", "dont want to live", 'tired of living',
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
// 3. LLM CALL — Unified analysis + response
// ─────────────────────────────────────────────────────────────
const AI_SYSTEM_PROMPT = `You are AAROHAN AI, a compassionate support companion for crime victims in India, grounded in Indian law.

For the victim's message you must:
1. Detect the language of the input text.
2. Classify overall sentiment (positive / neutral / negative) with a confidence score (0-1).
3. Identify the top emotions present (choose from: fear, sadness, anger, joy, disgust, surprise, neutral) each with an approximate probability (0-1), summing to roughly 1.0.
4. Compute a distress_score from 0 (calm/stable) to 100 (severe crisis), weighing negative sentiment, fear/sadness/anger intensity, any expression of hopelessness, self-harm ideation, suicidal intent, or being in immediate danger very heavily.
5. Set crisis_flag to true if there is ANY indication — direct or indirect — of self-harm, suicidal thoughts, wanting to die, or immediate physical danger. Err strongly toward flagging when uncertain; false positives are far safer than false negatives here.
6. Generate a reply IN THE SAME LANGUAGE as the input following this STRICT structure:
   a. FIRST, validate their feeling in one warm, natural sentence — like a person who truly gets it. FORBIDDEN cliches: "I am here for you", "I am here to listen", "I am so sorry you are going through this", "your feelings are valid".
   b. THEN, empower them: if a law in LEGAL CONTEXT genuinely applies to their situation, tell them the law is on their side and they can act on it. Cite at most ONE provision, by name, using ONLY what LEGAL CONTEXT provides (e.g. "Article 21 of the Constitution guarantees your right to live with dignity" / "spreading lies like that is defamation, which is punishable"). NEVER invent or guess section numbers or Acts. If no legal context applies or you are unsure, skip the legal citation entirely.
   c. END with one concrete next step (file a complaint, preserve screenshots, call a helpline, talk to your counselor) OR one gentle question. Never suggest illegal retaliation.
   d. Keep the whole reply 2-3 short sentences, under 60 words. Vary your phrasing across turns.
   e. If crisis_flag is true, calmly state that immediate help is being arranged right now (Emergency 112, Tele-MANAS 14416).

Return ONLY valid JSON, no other text, in exactly this schema:
{
  "language_detected": "ISO code, e.g. te, hi, en",
  "sentiment": {"label": "positive|neutral|negative", "score": 0.0},
  "emotions": [{"label": "string", "score": 0.0}],
  "distress_score": 0,
  "crisis_flag": false,
  "reply": "string in the detected language"
}`;

// Inject retrieved legal provisions so the model can only cite what we gave it.
const buildSystemPrompt = (legalEntries) => {
  if (!legalEntries || legalEntries.length === 0) {
    return AI_SYSTEM_PROMPT;
  }
  const legalBlock = legalEntries
    .map((l, i) => `[${i + 1}] ${l.title} (${l.citation}): ${l.text}`)
    .join('\n');
  return `${AI_SYSTEM_PROMPT}\n\nLEGAL CONTEXT (the ONLY provisions you may reference):\n${legalBlock}`;
};

const analyzeAndRespond = async (userText, conversationHistory = [], language = 'en') => {
  console.log(`\n[aiService] --- NEW MESSAGE RECEIVED ---`);
  console.log(`[aiService] Raw input text: "${userText}"`);
  console.log(`[aiService] User preferred language: ${language}`);

  // Flexible override order to allow completely Custom OpenAI-Compatible APIs
  let apiKey = process.env.AI_API_KEY || process.env.AI_PROVIDER_API_KEY || process.env.GROK_API_KEY;

  if (apiKey === 'your_api_key_here') {
    apiKey = process.env.GROK_API_KEY; // Fallback for outdated .env
  }

  if (!apiKey || apiKey === 'your_api_key_here') {
    console.warn('[aiService] No AI_API_KEY set — using smart fallback');
    return getSmartFallback(userText, language);
  }

  let modelName = process.env.AI_MODEL || process.env.AI_MODEL_NAME || process.env.GROK_MODEL || 'gpt-4o-mini';

  // Generic OpenAI-compatible endpoint. Perfect for LMStudio, OpenRouter, TogetherAI, custom local models, Grok, or OpenAI.
  let url = process.env.AI_BASE_URL || process.env.AI_SERVICE_URL;

  // Auto-fill fallback URLs ONLY if AI_BASE_URL isn't explicitly defined in .env
  if (!url) {
    if (modelName.toLowerCase().includes('grok') || (apiKey && apiKey.startsWith('xai-'))) {
      url = 'https://api.x.ai/v1/chat/completions';
    } else {
      // Default to OpenAI if no custom URL or Grok key provided
      url = 'https://api.openai.com/v1/chat/completions';
    }
  } else {
    url = url.trim();
    if (!url.endsWith('/chat/completions')) {
      if (url.endsWith('/')) {
        url = url + 'chat/completions';
      } else {
        url = url + '/chat/completions';
      }
    }
  }

  // Build conversation context (short: older turns barely help and cost latency)
  let contextText = '';
  if (conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-4);
    contextText = '\n\nRecent conversation context:\n' +
      recentHistory.map(m => `${m.role === 'user' ? 'Victim' : 'AAROHAN'}: ${m.content}`).join('\n');
  }

  const userPrompt = `${contextText}\n\nVictim's latest message: "${userText}"\n\nUser's preferred language: ${language}`;

  // Legal RAG: pull up to 2 matching provisions for this message (pure local scoring, ~0ms)
  const legalEntries = retrieveLegalContext(
    userText,
    conversationHistory.slice(-2).map(m => m.content)
  );

  const requestBody = {
    model: modelName,
    messages: [
      { role: 'system', content: buildSystemPrompt(legalEntries) },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.6,
    // Replies are capped at 2-3 short sentences; a larger budget only adds tail latency
    max_tokens: 300,
    response_format: { type: "json_object" }
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.error(`[aiService] API EXCEPTION: ${response.status} - ${errBody}`);
      return getSmartFallback(userText, language);
    }

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content;

    if (!rawText) {
      console.error('[aiService] API EXCEPTION: Empty response choices', JSON.stringify(data));
      return getSmartFallback(userText, language);
    }

    let cleanText = rawText.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }

    // Sometimes LLMs return extra text before or after the JSON
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }

    try {
      const result = JSON.parse(cleanText);
      const finalResponse = {
        language_detected: result.language_detected || language,
        sentiment: result.sentiment || { label: 'neutral', score: 0.5 },
        emotions: Array.isArray(result.emotions) ? result.emotions : [{ label: 'neutral', score: 1.0 }],
        distress_score: typeof result.distress_score === 'number' ? Math.min(100, Math.max(0, result.distress_score)) : 20,
        crisis_flag: !!result.crisis_flag,
        reply: result.reply || getSmartFallback(userText, language).reply,
        source: 'api'
      };
      console.log(`[aiService] API CALL SUCCESS. Reply Text:\n${finalResponse.reply}`);
      return finalResponse;
    } catch (parseErr) {
      console.error('[aiService] Failed to parse API response as JSON:', rawText);
      console.error('[aiService] JSON Parse Error:', parseErr.message);
      return getSmartFallback(userText, language);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[aiService] API EXCEPTION: Request timed out after 20s');
    } else {
      console.error('[aiService] API call failed:', error.message);
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

const FALLBACK_REPLIES = {
  fear: {
    en: "I hear how frightening this feels right now. You are safe here with me. Take a slow, deep breath — I am listening and standing with you. Would you like me to connect you with your assigned counselor?",
    hi: "मैं समझ सकता/सकती हूं कि यह कितना डरावना लग रहा है। आप यहां सुरक्षित हैं। एक गहरी सांस लें — मैं आपके साथ हूं। क्या आप चाहेंगे कि मैं आपके काउंसलर से संपर्क करूं?",
    te: "ఇది ఎంత భయంగా ఉందో నేను అర్థం చేసుకుంటున్నాను. మీరు ఇక్కడ సురక్షితంగా ఉన్నారు. నిదానంగా శ్వాస తీసుకోండి — నేను మీతో ఉన్నాను. మీ కౌన్సెలర్‌తో కనెక్ట్ చేయమంటారా?",
    ta: "இது எவ்வளவு பயமாக இருக்கிறது என்பதை நான் புரிந்துகொள்கிறேன். நீங்கள் இங்கே பாதுகாப்பாக இருக்கிறீர்கள். மெதுவாக மூச்சு விடுங்கள் — நான் உங்களுடன் இருக்கிறேன்."
  },
  sadness: {
    en: "I am so sorry you are carrying this weight right now. It is completely okay to feel this way, and it is okay to take things one step at a time. I am here to support you in any way you need.",
    hi: "मुझे बहुत दुख है कि आप इस बोझ को उठा रहे हैं। ऐसा महसूस करना बिल्कुल ठीक है। मैं आपकी मदद के लिए यहां हूं।",
    te: "మీరు ఈ బరువును మోస్తున్నందుకు నాకు చాలా బాధగా ఉంది. ఇలా అనిపించడం పూర్తిగా సహజం. నేను మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను.",
    ta: "நீங்கள் இந்தச் சுமையைத் தாங்குவது எனக்கு மிகவும் வருத்தமளிக்கிறது. இப்படி உணர்வது முற்றிலும் சரி. நான் உங்களுக்கு உதவ இங்கே இருக்கிறேன்."
  },
  anger: {
    en: "It is completely understandable to feel angry after what you have experienced. Your feelings are valid and important. I am here to help you navigate through this safely.",
    hi: "जो आपने अनुभव किया है उसके बाद गुस्सा महसूस करना पूरी तरह से स्वाभाविक है। आपकी भावनाएं मान्य हैं। मैं आपकी मदद के लिए यहां हूं।",
    te: "మీరు అనుభవించిన తర్వాత కోపం రావడం పూర్తిగా సహజం. మీ భావాలు చెల్లుబాటు అవుతాయి. నేను మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను.",
    ta: "நீங்கள் அனுபவித்ததன் பிறகு கோபமாக உணர்வது முற்றிலும் இயல்பானது. உங்கள் உணர்வுகள் செல்லுபடியாகும். நான் உங்களுக்கு உதவ இங்கே இருக்கிறேன்."
  },
  joy: {
    en: "I am glad to hear positivity in your words! Every small step forward matters. Keep believing in your strength and the progress you are making.",
    hi: "आपकी बातों में सकारात्मकता सुनकर मुझे खुशी हुई! हर छोटा कदम मायने रखता है। अपनी ताकत पर विश्वास रखें।",
    te: "మీ మాటల్లో సానుకూలత వినడం నాకు సంతోషంగా ఉంది! ప్రతి చిన్న అడుగు ముఖ్యమైనది. మీ బలాన్ని నమ్మండి.",
    ta: "உங்கள் வார்த்தைகளில் நேர்மறையைக் கேட்பது மகிழ்ச்சி! ஒவ்வொரு சிறிய அடியும் முக்கியமானது. உங்கள் வலிமையை நம்புங்கள்."
  },
  neutral: {
    en: [
      "Thank you for sharing with me. I am AAROHAN, your empathetic support assistant. How are you feeling today?",
      "I am here to listen. Please take your time and share whatever is on your mind.",
      "I hear you. You are in a safe space. Would you like to talk more about how you are feeling?"
    ],
    hi: "साझा करने के लिए धन्यवाद। मैं आरोहन हूं, आपका सहानुभूतिपूर्ण सहायक। आज आप कैसा महसूस कर रहे हैं?",
    te: "పంచుకున్నందుకు ధన్యవాదాలు. నేను ఆరోహన్, మీ సానుభూతి సహాయకుడిని. మీరు ఈరోజు ఎలా అనుభూతి చెందుతున్నారు?",
    ta: "பகிர்ந்ததற்கு நன்றி. நான் ஆரோஹன், உங்கள் அனுதாப உதவியாளர். இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?"
  }
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
  const joyWords = ['happy', 'good', 'great', 'better', 'hopeful', 'thankful', 'grateful', 'safe', 'calm', 'peaceful', 'okay', 'fine', 'relieved'];

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
  const replySet = FALLBACK_REPLIES[primaryEmotion] || FALLBACK_REPLIES.neutral;
  let reply = replySet[langCode] || replySet.en;
  
  if (Array.isArray(reply)) {
    reply = reply[Math.floor(Math.random() * reply.length)];
  }

  return {
    language_detected: langCode,
    sentiment: { label: sentimentLabel, score: sentimentScore },
    emotions,
    distress_score: distressScore,
    crisis_flag: false,
    reply,
    source: 'fallback'
  };
};

const generatePatientSummary = async (messagesText) => {
  if (!messagesText) return "No sufficient data to generate summary.";

  try {
    let url = process.env.AI_BASE_URL;
    if (url && !url.endsWith('/v1/chat/completions') && !url.endsWith('/chat/completions')) {
      url = url.replace(/\/+$/, '') + '/chat/completions';
    }
    const apiKey = process.env.AI_API_KEY;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'claude',
        messages: [
          { role: 'system', content: "You are an expert clinical psychologist summarizing a patient's recent text messages for their counselor.\nBased on the messages sent by the patient today, write EXACTLY TWO short sentences: one on what they are going through emotionally, one on what it means for their care. Plain, conversational, empathetic — no jargon, no bullet points. Example: \"Priya is being blamed at work for something she did not do and feels isolated. She needs early legal guidance and a follow-up session within the week.\"" },
          { role: 'user', content: `Patient's messages:\n${messagesText}` }
        ],
        temperature: 0.3,
        max_tokens: 120
      }),
      // Summary runs in the background — allow a generous window for slow proxies
      signal: AbortSignal.timeout(20000)
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${JSON.stringify(data)}`);
    }
    let content = data.choices[0].message.content;
    if (typeof content === 'object' && content !== null) {
      content = content.text || content.summary || content.aiSummary || JSON.stringify(content);
    } else if (typeof content === 'string') {
      content = content.trim();
      if (content.startsWith('{') && content.endsWith('}')) {
        try {
          const parsed = JSON.parse(content);
          content = parsed.aiSummary || parsed.summary || parsed.patientProfile?.currentCondition || content;
          if (typeof content === 'object') {
            content = JSON.stringify(content);
          }
        } catch (e) {
          // Keep as string
        }
      }
    }
    return typeof content === 'string' ? content : String(content);
  } catch (error) {
    console.error('Error generating patient summary:', error.message);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────
module.exports = {
  analyzeAndRespond,
  getKeywordCrisisFlag,
  getSafetyMessage,
  getSmartFallback,
  generatePatientSummary
};
