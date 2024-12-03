import { chromium } from 'playwright';
import OpenAI from 'openai';
import { z } from 'zod';
import { WebsiteData } from '../models/WebsiteData';
import { BusinessReport } from '../types/BusinessReport';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI with organization configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: 'org-awXv7xgjbvVaKHj25T3gaEMS'
});

const websiteSchema = z.object({
  title: z.string(),
  description: z.string(),
  mainContent: z.array(z.string()).default([]),
  links: z.array(z.string()).default([]),
  images: z.array(z.object({
    src: z.string(),
    alt: z.string().optional(),
    title: z.string().optional()
  })).default([]),
  navigation: z.array(z.object({
    text: z.string(),
    url: z.string(),
    children: z.array(z.object({
      text: z.string(),
      url: z.string()
    })).optional().default([])
  })).default([]),
  headings: z.array(z.object({
    level: z.number(),
    text: z.string()
  })).default([]),
  metadata: z.object({
    socialLinks: z.array(z.string()).default([]),
    contactInfo: z.object({
      phone: z.array(z.string()).default([]),
      email: z.array(z.string()).default([]),
      address: z.array(z.string()).default([])
    }),
    copyright: z.string().default('')
  })
});

async function generateBusinessReport(url: string, textContent: string): Promise<BusinessReport> {
  const prompt = `You are a potential customer evaluating this business. Analyze the website content and generate a comprehensive report from a customer's perspective. For each section, provide a detailed paragraph that answers what a potential customer would want to know.

Website URL: ${url}

The response must follow this structure, with each field being a detailed paragraph from a customer's perspective:

{
  "companyOverview": "A comprehensive paragraph about everything a customer should know about this company - their history, what they do, their mission, values, leadership, business model, products, services, and overall approach. What makes them unique and trustworthy?",
  
  "productsAndServices": "A detailed paragraph about their complete product/service lineup from a customer's perspective - what they offer, pricing, features, benefits, how to get started, and what value you get. What problems do they solve?",
  
  "brandVoice": "A thorough analysis of how they present themselves to customers - their communication style, personality, themes, visual elements, and overall brand experience. Do they seem professional and reliable?",
  
  "customerAnalysis": "A detailed look at who their ideal customers are, what problems they solve for them, and how well they understand customer needs. Would you fit their customer profile?",
  
  "valueProposition": "A comprehensive paragraph about the value they provide - their core benefits, unique selling points, how they solve problems, and what makes them worth choosing. Why should customers pick them?",
  
  "competitiveLandscape": "An analysis of how they compare to alternatives - their market position, competitors, differentiation, and industry trends. Are they a leader in their space?",
  
  "salesAndMarketing": "A detailed look at how they reach and engage customers - their sales process, marketing approach, and how they communicate value. Is it easy to do business with them?",
  
  "customerSupport": "A thorough analysis of their customer service and support - channels, service quality, success programs, and how they help customers succeed. Can you count on their support?",
  
  "technicalInfrastructure": "A comprehensive look at their technical capabilities - platform, security, reliability, and how technology enables their service. Is their technology modern and reliable?",
  
  "businessOperations": "A detailed paragraph about how they operate - their model, quality assurance, partnerships, and resources. Are they well-equipped to serve customers?",
  
  "growthAndInnovation": "An analysis of their future direction - growth plans, innovation focus, and outlook. Are they continuously improving and evolving?"
}

Rules for analysis:
1. Write from a customer's perspective - focus on what matters to potential customers
2. Each field should be a single, dense paragraph (at least 4-5 sentences)
3. Include specific examples and evidence when available
4. Highlight both strengths and potential concerns
5. Use "[DERIVED]" to mark inferred information
6. Maintain a balanced, evaluative tone
7. Focus on answering "What's in it for the customer?"

Website Content to Analyze:
${textContent}

Response must be valid JSON only.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a potential customer evaluating this business. Your task is to analyze the website content and generate a comprehensive report that answers what other potential customers would want to know. Focus on value, reliability, and customer experience."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2500
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse the response into our simplified BusinessReport structure
    const report = JSON.parse(content) as BusinessReport;
    return report;
  } catch (error: any) {
    console.error('Error generating business report:', error);
    if (error.response?.data) {
      console.error('OpenAI API Error:', error.response.data);
    }
    throw error;
  }
}

function validateBusinessReport(report: any): asserts report is BusinessReport {
  // Basic structure validation
  const requiredSections = [
    'companyOverview',
    'productsAndServices',
    'brandVoice',
    'customerAnalysis',
    'valueProposition',
    'competitiveLandscape',
    'salesAndMarketing',
    'customerSupport',
    'technicalInfrastructure',
    'businessOperations',
    'growthAndInnovation'
  ];

  for (const section of requiredSections) {
    if (!report[section] || typeof report[section] !== 'object') {
      throw new Error(`Missing or invalid section: ${section}`);
    }
  }
}

export async function crawlWebsite(url: string) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Navigating to page...');
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Wait for key content areas
    await Promise.all([
      page.waitForSelector('body', { timeout: 10000 }).catch(() => null),
      page.waitForSelector('article', { timeout: 10000 }).catch(() => null),
      page.waitForSelector('main', { timeout: 10000 }).catch(() => null),
      page.waitForSelector('#content', { timeout: 10000 }).catch(() => null)
    ]);

    // Additional wait for dynamic content
    await page.waitForTimeout(5000);
    
    console.log('Page loaded successfully');
    const content = await page.content();
    console.log('Retrieved page content');

    // Extract all text content
    const textContent = await page.evaluate(() => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            const text = node.textContent?.trim();
            if (!text || text.length === 0) return NodeFilter.FILTER_REJECT;
            if (node.parentElement?.tagName === 'SCRIPT') return NodeFilter.FILTER_REJECT;
            if (node.parentElement?.tagName === 'STYLE') return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      const texts = [];
      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent?.trim();
        if (text) texts.push(text);
      }
      return texts.join('\n');
    });
    console.log('Extracted text content');

    // Extract structured data
    const extractedData = await page.evaluate(() => {
      function getNavigation() {
        const navItems = Array.from(document.querySelectorAll('nav a, header a, .navigation a, .menu a'));
        return navItems.map(item => ({
          text: item.textContent?.trim() || '',
          url: item.getAttribute('href') || ''
        }));
      }

      function getHeadings() {
        return Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(heading => ({
          level: parseInt(heading.tagName[1]),
          text: heading.textContent?.trim() || ''
        }));
      }

      function getImages() {
        return Array.from(document.querySelectorAll('img'))
          .map(img => ({
            src: img.src,
            alt: img.alt,
            title: img.title
          }))
          .filter(img => img.src && img.src.trim() !== '');
      }

      function getSocialLinks() {
        const socialPatterns = [
          /facebook\.com/i, /twitter\.com/i, /linkedin\.com/i,
          /youtube\.com/i, /instagram\.com/i
        ];
        return Array.from(document.querySelectorAll('a')).filter(a => 
          socialPatterns.some(pattern => pattern.test((a as HTMLAnchorElement).href))
        ).map(a => (a as HTMLAnchorElement).href) || [];
      }

      function getContactInfo() {
        const phones = Array.from(document.querySelectorAll('a[href^="tel:"]')).map(a => 
          (a as HTMLAnchorElement).href.replace('tel:', '')
        );
        const emails = Array.from(document.querySelectorAll('a[href^="mailto:"]')).map(a => 
          (a as HTMLAnchorElement).href.replace('mailto:', '')
        );
        const addressElements = Array.from(document.querySelectorAll('address, .address, [itemprop="address"]'));
        const addresses = addressElements.map(el => el.textContent?.trim() || '');
        
        return {
          phones: phones || [],
          emails: emails || [],
          addresses: addresses || []
        };
      }

      const mainContent = Array.from(document.querySelectorAll('p, article p, main p, #content p'))
        .map(p => p.textContent?.trim())
        .filter(text => text && text.length > 0) || [];

      const links = Array.from(document.querySelectorAll('a'))
        .map(a => (a as HTMLAnchorElement).href)
        .filter(href => href && href.startsWith('http')) || [];

      return {
        title: document.title || '',
        description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        mainContent,
        links,
        images: getImages() || [],
        navigation: getNavigation() || [],
        headings: getHeadings() || [],
        metadata: {
          socialLinks: getSocialLinks(),
          contactInfo: getContactInfo(),
          copyright: document.querySelector('.copyright, footer .copyright')?.textContent?.trim() || ''
        }
      };
    });
    console.log('Extracted structured data');

    // Generate business report
    console.log('Generating business intelligence report...');
    const businessReport = await generateBusinessReport(url, textContent);
    console.log('Business report generated');

    // Validate the extracted data
    websiteSchema.parse(extractedData);

    // Save to MongoDB
    const websiteData = new WebsiteData({
      url,
      rawHtml: content,
      extractedData,
      businessReport,
      timestamp: new Date()
    });

    await websiteData.save();
    console.log('Data saved successfully');

    return { extractedData, businessReport };
  } catch (error) {
    console.error('Error during scraping:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
    console.log('Browser closed');
  }
} 