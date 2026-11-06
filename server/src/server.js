import mongoose from 'mongoose';
import { config, assertConfig } from './config.js';
import { createApp } from './app.js';

assertConfig();

// Connect to MongoDB first, then start accepting requests.
await mongoose.connect(config.mongoUri);
// Makes sure the indexes defined in the models exist.
await mongoose.syncIndexes();

createApp().listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
