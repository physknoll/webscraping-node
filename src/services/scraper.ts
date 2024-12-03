import { chromium } from 'playwright';
import { WebsiteData } from '../models/WebsiteData';
import { websiteSchema } from '../schemas/website';
import { generateBusinessReport } from './openai';
import path from 'path';
import fs from 'fs';

async function extractTextContent(page: any) {
  return await page.evaluate(() => {
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
}

async function extractStructuredData(page: any) {
  return await page.evaluate(() => {
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
}

export async function crawlWebsite(url: string) {
  let browser;
  let context;
  
  try {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
    const page = await context.newPage();
    
    // Navigate to page
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Get page content
    const content = await page.content();
    const textContent = await extractTextContent(page);
    const extractedData = await extractStructuredData(page);
    
    // Generate business report
    const businessReport = await generateBusinessReport(url, textContent);

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

    // Save report to file
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = path.join(reportsDir, `report-${timestamp}.json`);
    fs.writeFileSync(reportFile, JSON.stringify({ extractedData, businessReport }, null, 2));

    if (process.env.NODE_ENV !== 'test') {
      console.log('Report saved to:', reportFile);
    }

    return { extractedData, businessReport };
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error during scraping:', error);
    }
    throw error;
  } finally {
    if (context) await context.close();
    if (browser) await browser.close();
  }
} 