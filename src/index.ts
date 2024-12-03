import express from 'express';
import { connectDB } from './config/database';
import crawlerRoutes from './routes/crawler';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Use routes
app.use('/api', crawlerRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 