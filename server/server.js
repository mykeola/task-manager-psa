import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

// Connect Database and Launch Server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[PSA Backend Server] Running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
  });
};

startServer();
