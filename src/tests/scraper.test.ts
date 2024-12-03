import { crawlWebsite } from '../services/scraper';
import { connectDB } from '../config/database';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { WebsiteData } from '../models/WebsiteData';

// Configure environment variables
dotenv.config();

// Import Jest types
import '@types/jest';

describe('Website Scraper', () => {
  beforeAll(async () => {
    await connectDB();
    console.log('Connected to MongoDB');
  });

  afterAll(async () => {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  });

  describe('crawlWebsite', () => {
    it('should scrape website and generate business report', async () => {
      const url = 'https://www.rockrobotic.com/';
      const result = await crawlWebsite(url);

      // Assert basic structure
      expect(result).toBeDefined();
      expect(result).toHaveProperty('url', url);
      expect(result).toHaveProperty('rawHtml');
      expect(typeof result.rawHtml).toBe('string');

      // Assert extracted data
      expect(result.extractedData).toBeDefined();
      expect(result.extractedData.title).toBeDefined();
      expect(result.extractedData.description).toBeDefined();
      expect(Array.isArray(result.extractedData.mainContent)).toBe(true);
      expect(Array.isArray(result.extractedData.links)).toBe(true);
      expect(Array.isArray(result.extractedData.images)).toBe(true);
      expect(Array.isArray(result.extractedData.navigation)).toBe(true);
      expect(Array.isArray(result.extractedData.headings)).toBe(true);

      // Assert metadata
      expect(result.extractedData.metadata).toBeDefined();
      expect(Array.isArray(result.extractedData.metadata.socialLinks)).toBe(true);
      expect(result.extractedData.metadata.contactInfo).toBeDefined();
      expect(Array.isArray(result.extractedData.metadata.contactInfo.phone)).toBe(true);
      expect(Array.isArray(result.extractedData.metadata.contactInfo.email)).toBe(true);
      expect(Array.isArray(result.extractedData.metadata.contactInfo.address)).toBe(true);

      // Assert business report
      expect(result.businessReport).toBeDefined();
      expect(typeof result.businessReport.companyOverview).toBe('string');
      expect(typeof result.businessReport.productsAndServices).toBe('string');
      expect(typeof result.businessReport.brandVoice).toBe('string');
      expect(typeof result.businessReport.customerAnalysis).toBe('string');
      expect(typeof result.businessReport.valueProposition).toBe('string');
      expect(typeof result.businessReport.competitiveLandscape).toBe('string');
      expect(typeof result.businessReport.salesAndMarketing).toBe('string');
      expect(typeof result.businessReport.customerSupport).toBe('string');
      expect(typeof result.businessReport.technicalInfrastructure).toBe('string');
      expect(typeof result.businessReport.businessOperations).toBe('string');
      expect(typeof result.businessReport.growthAndInnovation).toBe('string');

      // Save report to file
      const reportsDir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportFile = path.join(reportsDir, `report-${timestamp}.json`);
      fs.writeFileSync(reportFile, JSON.stringify(result, null, 2));

      // Assert report file was created
      expect(fs.existsSync(reportFile)).toBe(true);
      const stats = fs.statSync(reportFile);
      expect(stats.size).toBeGreaterThan(0);

      // Log results for manual verification
      console.log('\nTest Results Summary:');
      console.log('----------------------------------------');
      console.log('Title:', result.extractedData.title);
      console.log('Description:', result.extractedData.description);
      console.log('Content Items:', result.extractedData.mainContent.length);
      console.log('Links:', result.extractedData.links.length);
      console.log('Images:', result.extractedData.images.length);
      console.log('Navigation Items:', result.extractedData.navigation.length);
      console.log('Headings:', result.extractedData.headings.length);
      console.log('Report File:', reportFile);
    }, 30000); // Increase timeout for this test

    it('should handle invalid URLs gracefully', async () => {
      const invalidUrl = 'https://invalid-url-that-does-not-exist.com';
      await expect(crawlWebsite(invalidUrl)).rejects.toThrow();
    });
  });
}); 