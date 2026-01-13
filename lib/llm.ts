import { z } from 'zod';
import type { NewsArticle } from './types';

const NarrativeAnalysisSchema = z.object({
  hypeSummary: z.string(),
  backlashSummary: z.string(),
  weeklyPulse: z.string(),
});

export type NarrativeAnalysis = z.infer<typeof NarrativeAnalysisSchema>;

const NewsSummarySchema = z.object({
  summaryShort: z.string(),
  summaryDetailed: z.string(),
  bullets: z.array(z.string()),
  keywords: z.array(z.string()),
});

export type NewsSummary = z.infer<typeof NewsSummarySchema>;

/**
 * Generate narrative analysis using Novita LLM API
 * @param topic - The topic being analyzed
 * @param tweets - Combined tweet texts
 * @returns Narrative analysis with hype, backlash, and weekly pulse summaries
 */
export async function analyzeNarratives(
  topic: string,
  tweets: string
): Promise<NarrativeAnalysis> {
  const apiKey = process.env.NOVITA_API_KEY;

  if (!apiKey) {
    throw new Error('NOVITA_API_KEY is not configured');
  }

  if (!tweets || tweets.trim().length === 0) {
    throw new Error('No tweet content provided for analysis');
  }

  const prompt = `You are a San Francisco cultural analyst. I will provide you with a collection of tweets about a specific topic. Your task is to analyze these tweets and return a JSON object with three keys: "hypeSummary", "backlashSummary", and "weeklyPulse".

- "hypeSummary": A 2-3 sentence summary of the positive, supportive, and excited viewpoints.
- "backlashSummary": A 2-3 sentence summary of the negative, critical, and skeptical viewpoints.
- "weeklyPulse": A comprehensive 4-5 sentence POST-BATTLE ANALYSIS that provides deep insight into:
  1. How this event reveals deeper tensions in SF's identity (tech hub vs livable city, progress vs preservation, etc.)
  2. What underlying values or fears are being expressed by both sides
  3. How this connects to SF's historical patterns or ongoing cultural debates
  4. What this says about power dynamics, economic forces, or community priorities
  5. The lasting impact or unresolved questions this leaves for the city

Make the weeklyPulse rich, nuanced, and thought-provoking. Go beyond surface-level observations to provide genuine cultural and sociological insight.

Here is the collection of tweets about ${topic}:
${tweets}

Return only the raw JSON object, with no other text.`;

  try {
    const response = await fetch('https://api.novita.ai/v3/openai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-v3.2-exp',
        messages: [
          {
            role: 'system',
            content: `You are a San Francisco cultural analyst specializing in urban sociology and tech culture. Provide deep, nuanced analysis that reveals underlying tensions and cultural dynamics.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Novita API request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from Novita API');
    }

    const content = data.choices[0].message.content;

    // Clean the response - remove markdown code blocks if present
    let cleanedContent = content.trim();
    
    // Remove ```json and ``` wrappers if present
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    // Try to parse the JSON response
    let parsedContent: unknown;
    try {
      parsedContent = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', content);
      console.error('Cleaned content:', cleanedContent);
      throw new Error(`LLM response is not valid JSON: ${parseError}`);
    }

    // Validate the structure
    const validatedAnalysis = NarrativeAnalysisSchema.parse(parsedContent);

    return validatedAnalysis;
  } catch (error) {
    console.error(`Error analyzing narratives for ${topic}:`, error);

    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.message);
      throw new Error(
        `Invalid response format from LLM. Expected hypeSummary, backlashSummary, and weeklyPulse fields.`
      );
    }

    throw error;
  }
}

/**
 * Generate narrative analysis with retry logic
 * @param topic - The topic being analyzed
 * @param tweets - Combined tweet texts
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Narrative analysis
 */
export async function analyzeNarrativesWithRetry(
  topic: string,
  tweets: string,
  maxRetries: number = 3
): Promise<NarrativeAnalysis> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await analyzeNarratives(topic, tweets);
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt} failed for ${topic}:`, error);

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed to analyze narratives after ${maxRetries} attempts: ${lastError?.message}`
  );
}

/**
 * Summarize weekly news for a specific category using LLM
 * @param category - News category (tech, politics, economy, sf-local)
 * @param articles - Array of news articles to summarize
 * @returns News summary with short/detailed summaries, bullets, and keywords
 */
/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function summarizeWeeklyNews(
  category: 'tech' | 'politics' | 'economy' | 'sf-local',
  articles: NewsArticle[]
): Promise<NewsSummary> {
  const apiKey = process.env.NOVITA_API_KEY;

  if (!apiKey) {
    throw new Error('NOVITA_API_KEY is not configured');
  }

  if (!articles || articles.length === 0) {
    throw new Error('No articles provided for summarization');
  }

  // Format articles for LLM
  const articlesText = articles
    .map((article, index) => {
      return `${index + 1}. ${article.title}\n   Source: ${article.source}\n   ${article.snippet}`;
    })
    .join('\n\n');

  const categoryLabels = {
    tech: 'San Francisco Technology',
    politics: 'San Francisco Politics',
    economy: 'San Francisco Economy & Business',
    'sf-local': 'San Francisco Local News',
  };

  const prompt = `You are a skilled San Francisco news editor creating a weekly digest for SF residents. I will provide you with a collection of news articles from the ${categoryLabels[category]} category. Your task is to analyze these articles and return a JSON object with four keys: "summaryShort", "summaryDetailed", "bullets", and "keywords".

IMPORTANT: All these articles are specifically about San Francisco, Bay Area, or Silicon Valley. Focus on the local impact and what matters to SF residents.

- "summaryShort": A compelling single-paragraph summary (3-5 sentences) that captures the most important developments of the week IN SAN FRANCISCO. This will be displayed on a card, so make it engaging and informative. Emphasize local impact and SF-specific angles.

- "summaryDetailed": A comprehensive narrative (2-3 paragraphs) that provides deeper context, analysis, and implications FOR SAN FRANCISCO RESIDENTS. Include:
  1. What are the major developments and trends in SF/Bay Area?
  2. Why do these stories matter to San Francisco residents specifically?
  3. How do these stories connect to SF's identity, culture, or ongoing issues?
  4. What should SF residents watch for going forward?

- "bullets": An array of 5-7 concise bullet points highlighting specific key developments, facts, or takeaways ABOUT SAN FRANCISCO. Each bullet should be locally relevant and informative to SF residents.

- "keywords": An array of 3-5 relevant keywords or phrases that capture the main themes IN SAN FRANCISCO (e.g., "SF Housing Crisis", "Bay Area Tech", "BART Updates"). Use title case and include "SF" or "Bay Area" when relevant.

Make the content authoritative, well-written, and valuable to San Francisco residents. Focus on what matters locally and why.

Here are this week's ${categoryLabels[category]} articles about San Francisco:

${articlesText}

Return only the raw JSON object, with no other text.`;

  try {
    console.log(`⏱️  Calling Novita API for ${category} with 30s timeout...`);
    const response = await fetchWithTimeout('https://api.novita.ai/v3/openai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-v3.2-exp',
        messages: [
          {
            role: 'system',
            content: `You are an expert news editor and analyst. Create clear, compelling, and informative news summaries that help readers understand what happened and why it matters.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    }, 30000);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Novita API request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from Novita API');
    }

    const content = data.choices[0].message.content;

    // Clean the response - remove markdown code blocks if present
    let cleanedContent = content.trim();

    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    // Parse and validate
    let parsedContent: unknown;
    try {
      parsedContent = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', content);
      throw new Error(`LLM response is not valid JSON: ${parseError}`);
    }

    const validatedSummary = NewsSummarySchema.parse(parsedContent);

    return validatedSummary;
  } catch (error) {
    console.error(`Error summarizing ${category} news:`, error);

    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.message);
      throw new Error(
        `Invalid response format from LLM. Expected summaryShort, summaryDetailed, bullets, and keywords fields.`
      );
    }

    throw error;
  }
}

/**
 * Summarize weekly news with retry logic
 * @param category - News category
 * @param articles - Array of news articles
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns News summary
 */
export async function summarizeWeeklyNewsWithRetry(
  category: 'tech' | 'politics' | 'economy' | 'sf-local',
  articles: NewsArticle[],
  maxRetries: number = 3
): Promise<NewsSummary> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await summarizeWeeklyNews(category, articles);
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt} failed for ${category}:`, error);

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed to summarize ${category} news after ${maxRetries} attempts: ${lastError?.message}`
  );
}

/**
 * Extract SF neighborhoods mentioned in a news article using LLM
 * @param article - News article to analyze
 * @returns Array of neighborhood names (defaults to ["General SF"] on error)
 */
export async function extractNeighborhoods(
  article: NewsArticle
): Promise<string[]> {
  const apiKey = process.env.NOVITA_API_KEY;

  if (!apiKey) {
    console.warn('NOVITA_API_KEY not configured for neighborhood extraction');
    return [];
  }

  // Improved prompt with better examples
  const prompt = `Extract SPECIFIC San Francisco neighborhoods mentioned in this article.
Return ONLY a JSON array of neighborhood names.
If NO SPECIFIC neighborhood is mentioned, return empty array [].

Examples:
- Article about Mission District crime → ["Mission"]
- Article about SOMA tech startup → ["South of Market"]
- Article about Castro parade and Noe Valley shops → ["Castro/Upper Market", "Noe Valley"]
- Article about general SF policy with no specific location → []

SF Neighborhoods: Bayview, Bernal Heights, Castro/Upper Market, Chinatown,
Crocker Amazon, Diamond Heights, Downtown/Civic Center, Excelsior, Financial District,
Glen Park, Golden Gate Park, Haight Ashbury, Inner Richmond, Inner Sunset, Lakeshore,
Marina, Mission, Nob Hill, Noe Valley, North Beach, Ocean View, Outer Mission,
Outer Richmond, Outer Sunset, Pacific Heights, Parkside, Potrero Hill, Presidio,
Presidio Heights, Russian Hill, Seacliff, South of Market, Treasure Island/YBI,
Twin Peaks, Visitacion Valley, West of Twin Peaks, Western Addition

Title: ${article.title}
Snippet: ${article.snippet}

JSON array:`;

  // Retry logic - 2 attempts
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased to 15s

      const response = await fetch('https://api.novita.ai/v3/openai/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.2-3b-instruct',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150, // Increased from 100
          temperature: 0.1,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (attempt === 0) {
          console.warn(`LLM API failed (attempt ${attempt + 1}/2), retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
          continue;
        }
        throw new Error('API failed after retries');
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from API');
      }

      const content = data.choices[0].message.content.trim();

      let neighborhoods: string[];
      try {
        neighborhoods = JSON.parse(content);
      } catch (parseError) {
        // Try to extract JSON array from response
        const jsonMatch = content.match(/\[(.*?)\]/);
        if (jsonMatch) {
          neighborhoods = JSON.parse(`[${jsonMatch[1]}]`);
        } else {
          throw parseError;
        }
      }

      if (Array.isArray(neighborhoods) &&
          neighborhoods.every(n => typeof n === 'string')) {
        return neighborhoods.filter(n => n.length > 0);
      }

      return [];
    } catch (error) {
      if (attempt === 0) {
        console.warn(`LLM extraction failed (attempt ${attempt + 1}/2):`, error);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      console.error('LLM neighborhood extraction failed after retries:', error);
      return [];
    }
  }

  return [];
}
