import mongoose, { Schema, Types } from 'mongoose';
import { BusinessReport } from '../types/BusinessReport';

const imageSchema = new Schema({
  src: { type: String, required: true },
  alt: { type: String, default: '' },
  title: { type: String, default: '' }
}, { _id: false });

const navigationChildSchema = new Schema({
  text: { type: String, required: true },
  url: { type: String, required: true }
}, { _id: false });

const navigationItemSchema = new Schema({
  text: { type: String, required: true },
  url: { type: String, required: true },
  children: [navigationChildSchema]
}, { _id: false });

const headingSchema = new Schema({
  level: { type: Number, required: true },
  text: { type: String, required: true }
}, { _id: false });

const contactInfoSchema = new Schema({
  phones: [{ type: String }],
  emails: [{ type: String }],
  addresses: [{ type: String }]
}, { _id: false });

const metadataSchema = new Schema({
  socialLinks: [{ type: String }],
  contactInfo: { type: contactInfoSchema, default: () => ({}) },
  copyright: { type: String, default: '' }
}, { _id: false });

const extractedDataSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  mainContent: [{ type: String }],
  links: [{ type: String }],
  images: [imageSchema],
  navigation: [navigationItemSchema],
  headings: [headingSchema],
  metadata: { type: metadataSchema, default: () => ({}) }
}, { _id: false });

const businessReportSchema = new Schema({
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
}, { _id: false });

const websiteDataSchema = new Schema({
  url: { type: String, required: true },
  rawHtml: { type: String, required: true },
  extractedData: { type: extractedDataSchema, required: true },
  businessReport: { type: businessReportSchema, required: true },
  timestamp: { type: Date, default: Date.now }
});

export const WebsiteData = mongoose.model('WebsiteData', websiteDataSchema); 