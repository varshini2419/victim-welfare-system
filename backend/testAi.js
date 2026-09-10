require('dotenv').config();
const { analyzeAndRespond } = require('./src/services/aiService');

(async () => {
  console.log("Testing Grok API...");
  try {
    const response = await analyzeAndRespond("I am feeling very anxious today because of the incident.", [], "English");
    console.log("Response:", JSON.stringify(response, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
})();
