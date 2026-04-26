/**
 * server.js — Entry point for Channel Lanka API server
 * Loads environment variables, then starts the Express app
 */
const dotenv = require('dotenv');
dotenv.config();

const app = require('./src/app');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Channel Lanka API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
