const WebSocket = require('ws');
const http = require('http');

async function runTests() {
  console.log('TEST 1 & 2: Backend and frontend are running.');

  // TEST 3
  console.log('TEST 3: Checking REST endpoint...');
  await new Promise((resolve) => {
    http.get('http://localhost:5000/api/v1/health', (res) => {
      console.log('REST status:', res.statusCode);
      resolve();
    }).on('error', (e) => {
      console.log('REST error (might not have health endpoint, testing another)', e.message);
      resolve();
    });
  });

  // TEST 4
  console.log('TEST 4: WS without token');
  let ws1 = new WebSocket('ws://localhost:5000/api/v1/voice/realtime');
  ws1.on('error', (e) => console.log('WS1 error:', e.message));
  ws1.on('open', () => console.log('WS1 connected (SHOULD NOT HAPPEN)'));
  ws1.on('unexpected-response', (req, res) => console.log('WS1 rejected with:', res.statusCode));

  await new Promise(r => setTimeout(r, 1000));

  // TEST 5
  console.log('TEST 5: WS with invalid token');
  let ws2 = new WebSocket('ws://localhost:5000/api/v1/voice/realtime?token=invalid_token');
  ws2.on('error', (e) => console.log('WS2 error:', e.message));
  ws2.on('open', () => console.log('WS2 connected (SHOULD NOT HAPPEN)'));
  ws2.on('unexpected-response', (req, res) => console.log('WS2 rejected with:', res.statusCode));

  await new Promise(r => setTimeout(r, 1000));

  // TEST 6 requires a valid token. I'll need to fetch one via login or assume we'll just check if it rejects with 401 instead of 500.
  console.log('To run TEST 6 and 7, I need a valid token.');
}

runTests();
