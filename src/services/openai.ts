import OpenAI from 'openai';
import { BusinessReport } from '../types/BusinessReport';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI with organization configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION_ID
});

export async function generateBusinessReport(url: string, textContent: string): Promise<BusinessReport> {
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

    // Parse the response into our BusinessReport structure
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