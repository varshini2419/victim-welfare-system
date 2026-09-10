const test = require('node:test');
const assert = require('node:assert/strict');

const originalGrok = process.env.GROK_API_KEY;
const originalGemini = process.env.GEMINI_API_KEY;
const originalModel = process.env.GROK_MODEL;

process.env.GROK_API_KEY = 'test-grok-key';
process.env.GROK_MODEL = 'grok-2-latest';
delete process.env.GEMINI_API_KEY;

test('uses Grok API for mood analysis and crisis detection', async () => {
  global.fetch = async (url, options) => {
    assert.match(url, /api\.x\.ai/);
    const body = JSON.parse(options.body);
    assert.equal(body.model, 'grok-2-latest');
    assert.match(body.messages[0].content, /AAROHAN AI/);

    const mockResponse = {
      language_detected: 'en',
      sentiment: { label: 'negative', score: 0.96 },
      emotions: [
        { label: 'sadness', score: 0.5 },
        { label: 'fear', score: 0.3 },
        { label: 'neutral', score: 0.2 }
      ],
      distress_score: 94,
      crisis_flag: true,
      reply: 'Hey. I’m here with you. ❤️\n\nYou don’t have to deal with all of this by yourself right now. Please sit somewhere safe and tell me what feels most urgent right now.'
    };

    return {
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: `\`\`\`json\n${JSON.stringify(mockResponse)}\n\`\`\``
          }
        }]
      })
    };
  };

  const { analyzeAndRespond } = require('../src/services/aiService');
  const result = await analyzeAndRespond('I want to die', [], 'English');

  assert.equal(result.source, 'grok');
  assert.equal(result.crisis_flag, true);
  assert.equal(result.sentiment.label, 'negative');
  assert.ok(result.distress_score >= 90);
  assert.match(result.reply.toLowerCase(), /safe|support|urgent|here with you|heart/);

  delete global.fetch;
});

test('detects common real victim phrases as crisis language', () => {
  const { getKeywordCrisisFlag } = require('../src/services/aiService');

  assert.equal(getKeywordCrisisFlag('i wanna die'), true);
  assert.equal(getKeywordCrisisFlag("i don't want this life"), true);
  assert.equal(getKeywordCrisisFlag('i want to end my life'), true);
});

test('returns a warm, cheerful positive reply for happy victim messages', async () => {
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      choices: [{
        message: {
          content: '```json\n{"language_detected":"en","sentiment":{"label":"positive","score":0.94},"emotions":[{"label":"joy","score":0.8},{"label":"neutral","score":0.2}],"distress_score":12,"crisis_flag":false,"reply":"Aww, then that\'s wonderful! 🥹❤️ I\'m really glad to hear that. Sometimes even after a really good day, when we\'re finally alone at night, emotions can suddenly feel strange or overwhelming. But if today went really well and pleasantly, let\'s hold on to that feeling for a moment. 😊 Tell me about it! What happened today that made your day so good? I want to hear the whole story. 😄✨"}\n```'
        }
      }]
    })
  });

  const { analyzeAndRespond } = require('../src/services/aiService');
  const result = await analyzeAndRespond('I am very very happy, today my day went very well and pleasant', [], 'English');

  assert.equal(result.source, 'grok');
  assert.equal(result.sentiment.label, 'positive');
  assert.ok(result.distress_score < 30);
  assert.match(result.reply.toLowerCase(), /wonderful|glad to hear|good day|what happened today|whole story/);

  delete global.fetch;
});

process.on('exit', () => {
  if (originalGrok === undefined) delete process.env.GROK_API_KEY; else process.env.GROK_API_KEY = originalGrok;
  if (originalGemini === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = originalGemini;
  if (originalModel === undefined) delete process.env.GROK_MODEL; else process.env.GROK_MODEL = originalModel;
});
