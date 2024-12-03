const express = require('express');
const mongoose = require('mongoose');
const { chromium } = require('playwright');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// MongoDB Schema
const WebsiteData = mongoose.model('WebsiteData', {
  url: String,
  rawHtml: String,
  extractedData: Object,
  timestamp: { type: Date, default: Date.now }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Crawl website function
async function crawlWebsite(url) {
  console.log(`Starting to crawl: ${url}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Navigating to page...');
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    console.log('Page loaded successfully');

    const content = await page.content();
    console.log('Retrieved page content');

    const extractedData = {
      title: await page.title(),
      metaDescription: await page.evaluate(() => {
        const metaDesc = document.querySelector('meta[name="description"]');
        return metaDesc ? metaDesc.getAttribute('content') : '';
      }),
      mainContent: await page.evaluate(() => {
        return Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6'))
          .map(element => element.textContent?.trim())
          .filter(text => text && text.length > 0);
      }),
      links: await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a'))
          .map(a => a.href)
          .filter(href => href && href.startsWith('http'));
      }),
    };
    console.log('Extracted structured data');

    // Save to MongoDB
    const websiteData = new WebsiteData({
      url,
      rawHtml: content,
      extractedData,
    });

    await websiteData.save();
    console.log('Data saved to MongoDB');
    return extractedData;
  } catch (error) {
    console.error('Error during crawling:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
    console.log('Browser closed');
  }
}

// API Routes
app.post('/api/crawl', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    console.log(`Received crawl request for URL: ${url}`);
    const data = await crawlWebsite(url);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error in /api/crawl:', error);
    return res.status(500).json({ error: 'Failed to crawl website', details: error.message });
  }
});

app.get('/api/data', async (req, res) => {
  try {
    const data = await WebsiteData.find().sort({ timestamp: -1 });
    return res.json(data);
  } catch (error) {
    console.error('Error in /api/data:', error);
    return res.status(500).json({ error: 'Failed to fetch data', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 