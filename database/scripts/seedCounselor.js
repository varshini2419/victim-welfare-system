const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });
console.log('Counselor seeding is disabled in this repository helper. Create counselors through the admin counselor-management flow or an explicit credentialed seed process.');
process.exit(0);
