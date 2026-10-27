const path = require('path');

// Resolve local configuration independently of the command's working directory.
// Existing environment variables (including Vercel secrets) take precedence.
require('dotenv').config({ path: path.join(__dirname, '../.env') });

