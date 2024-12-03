import { Router, Request, Response } from 'express';
import { crawlWebsite } from '../services/scraper';
import { WebsiteData } from '../models/WebsiteData';
import path from 'path';
import fs from 'fs';

const router = Router();

// Create reports directory at startup
const reportsDir = path.join(process.cwd(), 'reports');
if (!fs.existsSync(reportsDir)) {
  console.log(`Creating reports directory at: ${reportsDir}`);
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Endpoint to initiate crawling
router.post('/crawl', async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body as { url: string };
    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }
    
    const data = await crawlWebsite(url);
    
    // Save report to a file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = path.join(reportsDir, `report-${timestamp}.json`);
    
    console.log(`Saving report to: ${reportFile}`);
    fs.writeFileSync(reportFile, JSON.stringify(data, null, 2));
    
    res.json({ 
      success: true, 
      data,
      reportFile: `report-${timestamp}.json`
    });
  } catch (error) {
    console.error('Error in /api/crawl:', error);
    res.status(500).json({ error: 'Failed to crawl website' });
  }
});

// Endpoint to get all crawled data
router.get('/data', async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await WebsiteData.find().sort({ timestamp: -1 });
    res.json(data);
  } catch (error) {
    console.error('Error in /api/data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Endpoint to view reports in HTML format
router.get('/reports', async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log(`Looking for reports in: ${reportsDir}`);
    let reports: string[] = [];
    
    if (fs.existsSync(reportsDir)) {
      reports = fs.readdirSync(reportsDir)
        .filter(file => file.endsWith('.json'))
        .sort((a, b) => {
          const statA = fs.statSync(path.join(reportsDir, a));
          const statB = fs.statSync(path.join(reportsDir, b));
          return statB.mtime.getTime() - statA.mtime.getTime();
        });
      console.log(`Found ${reports.length} reports`);
    } else {
      console.log('Reports directory does not exist');
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Business Intelligence Reports</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            .report-list { margin: 20px 0; }
            .report-item {
              padding: 10px;
              margin: 5px 0;
              background: #f5f5f5;
              border-radius: 4px;
            }
            .report-item a { color: #0066cc; text-decoration: none; }
            .report-item a:hover { text-decoration: underline; }
            pre { background: #f8f8f8; padding: 15px; border-radius: 4px; overflow-x: auto; }
            .no-reports { color: #666; font-style: italic; }
          </style>
        </head>
        <body>
          <h1>Business Intelligence Reports</h1>
          <div class="report-list">
            ${reports.length > 0 ? reports.map(report => `
              <div class="report-item">
                <a href="/api/reports/${report}">${report}</a>
              </div>
            `).join('') : '<div class="no-reports">No reports found</div>'}
          </div>
        </body>
      </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Error in /api/reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Endpoint to view a specific report
router.get('/reports/:filename', async (req: Request, res: Response): Promise<void> => {
  try {
    const reportFile = path.join(reportsDir, req.params.filename);
    console.log(`Attempting to read report: ${reportFile}`);
    
    if (!fs.existsSync(reportFile)) {
      console.log('Report file not found');
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    const reportData = JSON.parse(fs.readFileSync(reportFile, 'utf-8'));
    console.log('Successfully read report data');
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Report: ${req.params.filename}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2 { color: #333; }
            .section { margin: 20px 0; }
            .back-link { margin-bottom: 20px; }
            .back-link a { color: #0066cc; text-decoration: none; }
            .back-link a:hover { text-decoration: underline; }
            pre { background: #f8f8f8; padding: 15px; border-radius: 4px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="back-link">
            <a href="/api/reports">← Back to Reports List</a>
          </div>
          <h1>Report: ${req.params.filename}</h1>
          <div class="section">
            <h2>Extracted Data</h2>
            <pre>${JSON.stringify(reportData.extractedData, null, 2)}</pre>
          </div>
          <div class="section">
            <h2>Business Report</h2>
            <pre>${JSON.stringify(reportData.businessReport, null, 2)}</pre>
          </div>
        </body>
      </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Error in /api/reports/:filename:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

export default router; 