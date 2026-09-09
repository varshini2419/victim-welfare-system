/**
 * AI Service
 * Abstracts LLM interaction, emotion detection, distress scoring, and multi-language support.
 */

const analyzeEmotionAndDistress = (text = '') => {
  const lower = text.toLowerCase();

  // Keyword weights for distress & emotions
  const severeKeywords = ['kill', 'suicide', 'die', 'end my life', 'terrified', 'bleeding', 'hiding', 'beaten', 'abused', 'attacked'];
  const highKeywords = ['scared', 'afraid', 'panic', 'crying', 'hopeless', 'depressed', 'nightmare', 'trauma', 'threatened', 'anxious', 'worried'];
  const moderateKeywords = ['stressed', 'sad', 'upset', 'confused', 'alone', 'hurt', 'nervous', 'trouble', 'pain'];
  const positiveKeywords = ['hopeful', 'better', 'safe', 'thank you', 'okay', 'good', 'calm', 'peaceful', 'reassured'];

  let score = 20; // Default baseline
  let primaryEmotion = 'Neutral';

  if (severeKeywords.some(k => lower.includes(k))) {
    score = 85;
    primaryEmotion = 'Fearful';
  } else if (highKeywords.some(k => lower.includes(k))) {
    score = 65;
    if (lower.includes('scared') || lower.includes('afraid')) primaryEmotion = 'Fearful';
    else if (lower.includes('anxious') || lower.includes('panic')) primaryEmotion = 'Anxious';
    else primaryEmotion = 'Sad';
  } else if (moderateKeywords.some(k => lower.includes(k))) {
    score = 42;
    if (lower.includes('angry') || lower.includes('upset')) primaryEmotion = 'Angry';
    else if (lower.includes('sad')) primaryEmotion = 'Sad';
    else primaryEmotion = 'Anxious';
  } else if (positiveKeywords.some(k => lower.includes(k))) {
    score = 15;
    if (lower.includes('hope')) primaryEmotion = 'Hopeful';
    else primaryEmotion = 'Calm';
  }

  let distressBand = 'Low';
  if (score >= 75) distressBand = 'Severe';
  else if (score >= 50) distressBand = 'High';
  else if (score >= 25) distressBand = 'Moderate';

  return {
    distressScore: score,
    distressBand,
    primaryEmotion
  };
};

const getFallbackResponse = (userText, emotion, language = 'en') => {
  const lower = userText.toLowerCase();

  if (/helpline|number|call|phone|emergency|contact/i.test(lower)) {
    return "You can reach 24/7 official support anytime: Tele-MANAS (14416 or 1800-891-4416), National Emergency (112), Women Helpline (181), and Childline (1098). Your counselor is also notified to assist you.";
  }

  switch (emotion) {
    case 'Fearful':
    case 'Anxious':
      return "I hear how frightening and overwhelming this feels right now. Please know you are safe here. Take a deep, slow breath. I am listening and standing with you. Would you like me to connect you with your assigned counselor?";
    case 'Sad':
      return "I am so sorry you are feeling this weight right now. It is completely okay to take things one step at a time. I am here to support you in any way you need.";
    case 'Angry':
      return "It is completely understandable to feel angry after what you have experienced. Your feelings are valid. I am here to help you safely navigate through this.";
    case 'Hopeful':
      return "I am glad to hear a sense of hope in your voice. Every small step forward matters. Keep believing in your strength and progress.";
    case 'Calm':
    default:
      return "Thank you for sharing with me. I am AAROHAN, your empathetic support assistant. How can I best assist you right now?";
  }
};

const getChatbotResponse = async (messagesArray, contextOpts = {}) => {
  const provider = process.env.AI_PROVIDER || 'mock';
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS) || 15000;
  const modelName = process.env.AI_MODEL_NAME || 'gpt-4o-mini';

  const userEmotion = contextOpts.emotion || 'Neutral';
  const userLang = contextOpts.language || 'English';

  // System Prompt strictly injected here to prevent user overrides
  const systemPrompt = {
    role: 'system',
    content: `You are AAROHAN, a supportive, empathetic, and respectful AI assistant for victims in the Victim Welfare System.
Current User Emotion detected: ${userEmotion}
Current User Selected Language: ${userLang}

Rules:
1. Provide warm, empathetic responses tailored to the user's emotion (${userEmotion}) and respond in ${userLang}.
2. Do not judge or interrogate the victim.
3. Provide general supportive information and emotional grounding.
4. NEVER diagnose mental health conditions or pretend to be a doctor/lawyer/police.
5. If the user expresses distress, reassure them and mention their assigned counselor.
6. Keep responses gentle, respectful, clear, and reassuring.`
  };

  const fullMessages = [systemPrompt, ...messagesArray];

  if (!apiKey) {
    const lastUserMsg = messagesArray[messagesArray.length - 1]?.content || '';
    return getFallbackResponse(lastUserMsg, userEmotion, userLang);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: fullMessages,
        max_tokens: 500,
        temperature: 0.7,
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('AI Provider Error:', errorData);
      const lastUserMsg = messagesArray[messagesArray.length - 1]?.content || '';
      return getFallbackResponse(lastUserMsg, userEmotion, userLang);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.warn('AI Provider fallback engaged:', error.message);
    const lastUserMsg = messagesArray[messagesArray.length - 1]?.content || '';
    return getFallbackResponse(lastUserMsg, userEmotion, userLang);
  }
};

module.exports = {
  analyzeEmotionAndDistress,
  getChatbotResponse
};

