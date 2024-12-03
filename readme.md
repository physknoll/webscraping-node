# **Website Crawler and Summarization Framework**

## **Overview**
This Node.js framework leverages the **LLM Scraper** for extracting structured data from websites and integrates the **Bee Agent Framework** to process this data using LLM-based agentic workflows. The processed data is summarized with OpenAI or other supported LLMs and stored in MongoDB Atlas. This framework is optimized for dynamic web scraping, AI-driven summarization, and multi-agent orchestration.

---

## **Features**
1. **LLM Scraper Integration**: Extract structured data using schemas defined with Zod and Playwright.
2. **Bee Agent Framework**: Automate complex workflows using scalable, memory-optimized AI agents.
3. **Dynamic Web Crawling**: Handle HTML, Markdown, text, and screenshots from dynamic websites.
4. **LLM Integration**: Support for OpenAI, Ollama, and other LLMs for processing and summarizing data.
5. **Data Storage**: Store raw website data, agent insights, and summaries in MongoDB Atlas.
6. **Error Logging**: Employ Winston for comprehensive error tracking and debugging.
7. **Production-Ready Design**: Token memory optimization, serialization, and multi-agent workflows.

---

## **Technologies Used**
- **Node.js**: Backend development runtime.
- **TypeScript**: Type safety for maintainable, error-free code.
- **Express.js**: Lightweight API framework.
- **LLM Scraper**: Structured data extraction with schemas and Playwright.
- **Bee Agent Framework**: For scalable agent-based workflows.
- **MongoDB Atlas**: Cloud-hosted database for robust data management.
- **Zod**: Schema validation for consistent data handling.
- **Playwright**: Browser automation for web scraping.
- **OpenAI API**: Summarization and LLM-driven tasks.
- **Dotenv**: Manage environment variables securely.
- **Winston**: Advanced logging system.

---

## **Installation**

### **1. Prerequisites**
- Node.js >= 16
- MongoDB Atlas account
- OpenAI API key

### **2. Install Dependencies**
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/website-crawler-framework.git
   cd website-crawler-framework
   ```

2. Install core dependencies:
   ```bash
   npm install
   ```

3. Install additional packages:
   ```bash
   npm install zod playwright llm-scraper @ai-sdk/openai bee-agent-framework
   ```

---

## **Configuration**

1. Create a `.env` file in the root directory:
   ```bash
   touch .env
   ```

2. Add the following environment variables:
   ```
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/your-database?retryWrites=true&w=majority
   OPENAI_API_KEY=your-openai-api-key
   PORT=3000
   ```

3. Ensure your MongoDB Atlas cluster is set up, and whitelist your IP address for secure access.

---

## **Usage**

### **1. Crawling and Data Extraction**
Use **LLM Scraper** to extract structured data from websites. This step is schema-driven, ensuring type-safe and consistent data handling.

#### Example Code
```ts
import { chromium } from 'playwright';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import LLMScraper from 'llm-scraper';
import mongoose from 'mongoose';

const WebsiteData = mongoose.model('WebsiteData', {
  businessId: String,
  url: String,
  rawHtml: String,
  extractedData: Object,
  timestamp: Date,
});

const scraper = new LLMScraper(openai.chat('gpt-4o'));

async function crawlWebsite(url: string, businessId: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);

  const schema = z.object({
    title: z.string().describe('Page title'),
    headings: z.array(z.string()).describe('Page headings'),
  });

  const { data } = await scraper.run(page, schema, { format: 'html' });

  const document = new WebsiteData({
    businessId,
    url,
    rawHtml: await page.content(),
    extractedData: data,
    timestamp: new Date(),
  });

  await document.save();
  await browser.close();
}
```

---

### **2. Agentic Workflow with Bee**
The Bee Agent Framework orchestrates workflows by combining memory, tools, and LLMs.

#### Example Code
```ts
import { BeeAgent } from 'bee-agent-framework/agents/bee/agent';
import { TokenMemory } from 'bee-agent-framework/memory/tokenMemory';
import { DuckDuckGoSearchTool } from 'bee-agent-framework/tools/search/duckDuckGoSearch';
import { OpenAIChatAdapter } from 'bee-agent-framework/adapters/openai/chat';

const agent = new BeeAgent({
  llm: new OpenAIChatAdapter({ apiKey: process.env.OPENAI_API_KEY }),
  memory: new TokenMemory(),
  tools: [new DuckDuckGoSearchTool()],
});

async function processWithAgent(data: any) {
  const response = await agent.run({
    prompt: `Summarize the following data:\n\n${JSON.stringify(data)}`,
  });

  console.log('Agent Response:', response.result.text);
}
```

---

### **3. Summarization and Storage**
Summarize extracted data using OpenAI and store the summaries in MongoDB Atlas.

#### Example Code
```ts
import { Summary } from './models';

async function summarizeData(extractedData, businessId) {
  const prompt = `Summarize the following:\n\n${JSON.stringify(extractedData)}`;
  const response = await agent.run({ prompt });

  const summary = new Summary({
    businessId,
    content: extractedData,
    summary: response.result.text,
    timestamp: new Date(),
  });

  await summary.save();
}
```

---

### **API Endpoints**

#### **POST /api/crawl**
- **Request**:
  ```json
  { "url": "https://example.com", "businessId": "12345" }
  ```
- **Response**:
  ```json
  { "message": "Crawling initiated." }
  ```

#### **POST /api/summarize**
- **Request**:
  ```json
  { "businessId": "12345" }
  ```
- **Response**:
  ```json
  { "message": "Summarization complete." }
  ```

---

## **Data Storage**

### MongoDB Atlas Schema
- **`website_data` Collection**:
  ```json
  {
    "businessId": "string",
    "url": "string",
    "rawHtml": "string",
    "extractedData": "object",
    "timestamp": "date"
  }
  ```
- **`summaries` Collection**:
  ```json
  {
    "businessId": "string",
    "content": "object",
    "summary": "string",
    "timestamp": "date"
  }
  ```

---

## **Error Handling**
1. **Winston Logging**:
   - Structured logging to console and file for debugging.

2. **Centralized Middleware**:
   - Handle errors across the app.
   ```ts
   app.use((err, req, res, next) => {
     console.error(err.stack);
     res.status(500).json({ error: 'Internal Server Error' });
   });
   ```

---

## **Best Practices**
1. **Secure Credentials**: Use `.env` for sensitive information.
2. **Type Safety**: Validate data schemas with Zod.
3. **Modular Design**: Use Bee Agent for workflow orchestration.

---

This `README.md` now integrates **LLM Scraper** and **Bee Agent Framework**, providing a robust solution for website crawling, summarization, and multi-agent workflows. Let me know if you need further adjustments!