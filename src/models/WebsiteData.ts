import mongoose from 'mongoose';
import { BusinessReport } from '../types/BusinessReport';

const websiteDataSchema = new mongoose.Schema({
  url: { type: String, required: true },
  rawHtml: { type: String, required: true },
  extractedData: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    mainContent: [String],
    links: [String],
    images: [{
      src: { type: String, required: true },
      alt: String,
      title: String
    }],
    navigation: [{
      text: { type: String, required: true },
      url: { type: String, required: true },
      children: [{
        text: { type: String, required: true },
        url: { type: String, required: true }
      }]
    }],
    headings: [{
      level: { type: Number, required: true },
      text: { type: String, required: true }
    }],
    metadata: {
      socialLinks: [String],
      contactInfo: {
        phone: [String],
        email: [String],
        address: [String]
      },
      copyright: String
    }
  },
  businessReport: {
    companyOverview: { type: String, required: true },
    productsAndServices: { type: String, required: true },
    brandVoice: { type: String, required: true },
    customerAnalysis: { type: String, required: true },
    valueProposition: { type: String, required: true },
    competitiveLandscape: { type: String, required: true },
    salesAndMarketing: { type: String, required: true },
    customerSupport: { type: String, required: true },
    technicalInfrastructure: { type: String, required: true },
    businessOperations: { type: String, required: true },
    growthAndInnovation: { type: String, required: true }
  },
  timestamp: { type: Date, default: Date.now }
});

export const WebsiteData = mongoose.model('WebsiteData', websiteDataSchema); 