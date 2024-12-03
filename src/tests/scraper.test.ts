import { crawlWebsite } from '../services/scraper';
import { connectDB } from '../config/database';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { WebsiteData } from '../models/WebsiteData';

// Configure environment variables
dotenv.config();

// Set test environment
process.env.NODE_ENV = 'test';

jest.setTimeout(60000); // Increase timeout to 60 seconds

describe('Website Scraper', () => {
  beforeAll(async () => {
    try {
      await connectDB();
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // Clean up test data
      await WebsiteData.deleteMany({});
      await mongoose.connection.close();
    } catch (error) {
      console.error('Cleanup error:', error);
      throw error;
    }
  });

  describe('crawlWebsite', () => {
    it('should scrape website and generate business report', async () => {
      const url = 'https://www.rockrobotic.com/';
      let result;
      
      try {
        result = await crawlWebsite(url);
        
        // Assert basic structure
        expect(result).toBeDefined();
        expect(result.extractedData).toBeDefined();
        expect(result.businessReport).toBeDefined();

        // Assert extracted data
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
        expect(Array.isArray(result.extractedData.metadata.contactInfo.phones)).toBe(true);
        expect(Array.isArray(result.extractedData.metadata.contactInfo.emails)).toBe(true);
        expect(Array.isArray(result.extractedData.metadata.contactInfo.addresses)).toBe(true);

        // Assert business report
        expect(result.businessReport.companyOverview).toBeDefined();
        expect(result.businessReport.productsAndServices).toBeDefined();
        expect(result.businessReport.brandVoice).toBeDefined();
        expect(result.businessReport.customerAnalysis).toBeDefined();
        expect(result.businessReport.valueProposition).toBeDefined();
        expect(result.businessReport.competitiveLandscape).toBeDefined();
        expect(result.businessReport.salesAndMarketing).toBeDefined();
        expect(result.businessReport.customerSupport).toBeDefined();
        expect(result.businessReport.technicalInfrastructure).toBeDefined();
        expect(result.businessReport.businessOperations).toBeDefined();
        expect(result.businessReport.growthAndInnovation).toBeDefined();
      } catch (error) {
        console.error('Test error:', error);
        throw error;
      }
    }, 60000); // Set timeout for this specific test to 60 seconds

    it('should handle invalid URLs gracefully', async () => {
      const invalidUrl = 'https://invalid-url-that-does-not-exist.com';
      await expect(crawlWebsite(invalidUrl)).rejects.toThrow();
    });
  });
}); 