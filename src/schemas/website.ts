import { z } from 'zod';

export const websiteSchema = z.object({
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
      phones: z.array(z.string()).default([]),
      emails: z.array(z.string()).default([]),
      addresses: z.array(z.string()).default([])
    }),
    copyright: z.string().default('')
  })
}); 