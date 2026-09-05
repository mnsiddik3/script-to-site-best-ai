import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { optimizeImageForGemini, convertVideoToBase64 } from '@/lib/imageUtils';

interface MetadataResult {
  title: string;
  titleScore?: number;
  alternativeTitles?: string[];
  alternativeTitleScores?: number[];
  description: string;
  keywords: string[];
  category: string;
}

// Interactions API supported models (https://ai.google.dev/gemini-api/docs/migrate-to-interactions)
export type GeminiModel =
  | 'gemini-3.8-flash'
  | 'gemini-3.6-flash'
  | 'gemini-3.5-flash'
  | 'gemini-flash-latest'
  | 'gemini-2.5-flash';

export const GEMINI_MODEL_OPTIONS: { value: GeminiModel; label: string; hint: string }[] = [
  { value: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', hint: 'সর্বাধুনিক, সেরা মান' },
  { value: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', hint: 'ভালো মান, দ্রুত' },
  { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', hint: 'স্থিতিশীল' },
  { value: 'gemini-flash-latest', label: 'Gemini Flash Latest', hint: 'সর্বশেষ স্টেবল' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', hint: 'হালকা ও দ্রুত' },
];

export const DEFAULT_MODEL: GeminiModel = 'gemini-3.8-flash';

const INTERACTIONS_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

interface GeminiErrorResponse {
  error?: {
    message?: string;
    status?: string;
    details?: Array<{
      '@type'?: string;
      retryDelay?: string;
      quotaId?: string;
      quotaMetric?: string;
      quotaValue?: string;
      violations?: Array<{
        quotaId?: string;
        quotaMetric?: string;
        quotaValue?: string;
      }>;
    }>;
  };
}

const HIGH_DEMAND_PATTERNS = [
  'high demand',
  'experiencing high demand',
  'spikes in demand',
  'temporarily unavailable',
  'service unavailable',
  'model is overloaded',
  'overloaded',
  'try again later',
];

const QUOTA_EXHAUSTED_PATTERNS = [
  'exceeded your current quota',
  'quota exceeded',
  'quota has been exceeded',
  'exceeded your current quota',
  'daily limit exceeded',
  'per day',
  'per minute',
  'rate limit exceeded',
  'too many requests',
];

const MINUTE_QUOTA_PATTERNS = ['perminute', 'per minute'];
const DAILY_QUOTA_PATTERNS = ['perday', 'per day', 'daily'];

const includesQuotaPattern = (value: string, patterns: string[]) =>
  patterns.some(pattern => value.includes(pattern));

type GeminiErrorDetails = NonNullable<NonNullable<GeminiErrorResponse['error']>['details']>;

const getQuotaViolationText = (details?: GeminiErrorDetails) => {
  if (!details) return '';

  return details
    .flatMap(detail => {
      const baseValues = [detail.quotaId, detail.quotaMetric, detail.quotaValue];
      const violationValues = (detail.violations ?? []).flatMap(violation => [
        violation.quotaId,
        violation.quotaMetric,
        violation.quotaValue,
      ]);

      return [...baseValues, ...violationValues];
    })
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .toLowerCase();
};

// Interactions API returns an Interaction resource: steps[].content[] text blocks.
// Falls back to the legacy generateContent shape just in case.
const extractInteractionText = (data: any): string => {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text;
  }

  const steps = Array.isArray(data?.steps) ? data.steps : [];
  const text = steps
    .flatMap((step: any) => (Array.isArray(step?.content) ? step.content : []))
    .filter((block: any) => block?.type === 'text' && typeof block?.text === 'string')
    .map((block: any) => block.text)
    .join('\n')
    .trim();

  if (text) return text;

  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
};

const MODEL_FALLBACKS: Record<GeminiModel, GeminiModel | null> = {
  'gemini-3.6-flash': 'gemini-3.5-flash',
  'gemini-3.5-flash': 'gemini-flash-latest',
  'gemini-flash-latest': 'gemini-2.5-flash',
  'gemini-2.5-flash': null,
};

// Clean symbols from keywords
const cleanKeywords = (keywords: string[]): string[] => {
  return keywords.map(k => k.replace(/[^\w\s]/g, '').trim()).filter(k => k.length > 0);
};

// Clean title: keep letters, numbers, spaces, commas
const cleanTitle = (title: string): string => {
  return title.replace(/[^\w\s,]/g, '').trim();
};

// Clean description: keep letters, numbers, spaces, periods, commas
const cleanDescription = (description: string): string => {
  return description.replace(/[^\w\s.,]/g, '').trim();
};

// Filter unique keywords
const filterUniqueKeywords = (keywords: string[]): string[] => {
  const stopWords = [
    'and', 'with', 'of', 'the', 'a', 'an', 'is', 'are', 'in', 'on', 'for',
    'to', 'by', 'at', 'from', 'or', 'but', 'not', 'no', 'so', 'if', 'as',
    'it', 'its', 'be', 'was', 'were', 'been', 'has', 'had', 'do', 'does',
    'did', 'will', 'can', 'may', 'this', 'that', 'these', 'those', 'into'
  ];
  const genericWords = [
    'image', 'photo', 'picture', 'design', 'creative', 'beautiful', 'modern',
    'awesome', 'amazing', 'perfect', 'great', 'nice', 'good', 'best', 'new',
    'cool', 'fresh', 'clean', 'simple', 'elegant', 'stylish', 'trendy'
  ];
  const colorWords = [
    'white', 'black', 'red', 'blue', 'green', 'yellow', 'orange', 'purple',
    'pink', 'brown', 'gray', 'grey', 'silver', 'gold', 'colorful', 'bright',
    'dark', 'light', 'color', 'colors', 'colour', 'colours'
  ];
  const shapeWords = [
    'round', 'square', 'circle', 'triangle', 'rectangle', 'oval', 'diamond',
    'star', 'heart', 'arrow', 'line', 'curve', 'straight', 'shape', 'shapes'
  ];
  const technicalWords = [
    'vector', 'digital', 'file', 'quality', 'resolution', 'pixel', 'format',
    'jpg', 'png', 'svg', 'ai', 'eps', 'pdf', 'download', 'upload', 'size',
    'dimension', 'layer', 'transparent', 'background'
  ];
  const allFilteredWords = [...stopWords, ...genericWords, ...colorWords, ...shapeWords, ...technicalWords];

  const synonymGroups = [
    ['graphic', 'graphics'], ['element', 'elements'], ['icon', 'icons'],
    ['template', 'templates'], ['business', 'corporate'], ['app', 'application']
  ];

  const filtered: string[] = [];
  const usedGroups = new Set<number>();

  for (const keyword of keywords) {
    const kw = keyword.toLowerCase();
    if (allFilteredWords.includes(kw)) continue;

    let isUnique = true;
    for (let i = 0; i < synonymGroups.length; i++) {
      if (synonymGroups[i].some(syn => kw === syn)) {
        if (usedGroups.has(i)) { isUnique = false; break; }
        else usedGroups.add(i);
      }
    }

    if (isUnique) {
      const exists = filtered.some(ex => {
        const exL = ex.toLowerCase();
        return exL === kw || exL + 's' === kw || kw + 's' === exL;
      });
      if (!exists) filtered.push(keyword);
    }
  }
  return filtered.slice(0, 50);
};

const PROMPT = `
Analyze this {contentType} and create Adobe Stock metadata WITH SEO SCORES:

FOCUS ON IMAGE CONTENT: Describe exactly what you see, not generic terms.

TITLES (6-12 words):
- Primary title describing main subject + style + purpose
- CRITICAL: Include numbers ONLY if they are clearly visible and readable in the image itself
- DO NOT add random numbers or quantities unless they appear in the image
- If numbers are visible: include them in ALL THREE titles with proper formatting
- Examples with numbers: "Anniversary Badges 1, 5, 10, 15, 20, 25 - Gold Design Set"
- Examples without numbers: "Corporate Business Team Meeting - Professional Workplace"
- Use ONE hyphen only: "Main Subject - Style/Purpose"
- No symbols except hyphen and comma (for visible numbers only)
- Two alternative titles with different keyword angles

SEO SCORE CRITERIA (0-100):
- Keyword relevance (20 points): Does it contain high-value search terms?
- Clarity (20 points): Is the subject immediately clear?
- Specificity (20 points): Does it describe exact content vs generic terms?
- Commercial value (20 points): Will buyers search for this?
- Length optimization (20 points): 6-12 words, not too short or long?

Calculate realistic SEO scores for each title:
- 85-100 = Excellent (perfect keywords, clarity, commercial value)
- 70-84 = Good (strong but room for improvement)
- 50-69 = Needs Work (missing key elements or too generic)
- Below 50 = Poor (needs major revision)

DESCRIPTION (STRICTLY 160-190 characters, no more, no less):
- Count characters carefully before finalizing
- Must be a complete sentence, not truncated
- Commercial description focusing on the image content
- Only use letters, numbers, spaces, periods, and commas
- If numbers are visible, list them individually without explanatory text

CATEGORY:
Choose main theme: Business, Technology, Nature, People, Food, Travel, Art, etc.

KEYWORDS (exactly 50):
Create balanced keywords across these categories:
- IMAGE CONTENT (10 keywords): What you actually see in the image
- BUSINESS (8 keywords): Commercial terms, industries
- VISUAL STYLE (8 keywords): Colors, composition, design style
- PURPOSE (8 keywords): Usage, application, context
- INDUSTRY (8 keywords): Relevant sectors, markets
- MATERIALS/OBJECTS (8 keywords): Physical elements, textures

KEYWORD RULES:
- Each must be completely unique (no synonyms)
- Focus on buyer search behavior
- Single words preferred
- No generic terms like "image", "photo"
- Ensure commercial value

Response format:
TITLE- [title here]
TITLE_SCORE- [number 0-100]
ALT_TITLE_1- [alternative 1]
ALT_TITLE_1_SCORE- [number 0-100]
ALT_TITLE_2- [alternative 2]
ALT_TITLE_2_SCORE- [number 0-100]
DESCRIPTION- [description]
CATEGORY- [category]
KEYWORDS- word1, word2, word3, [continue to 50 words]
`;

export const useGeminiApi = () => {
  const [loading, setLoading] = useState(false);
  const [processingQueue, setProcessingQueue] = useState(false);
  const [activeKeyIndex, setActiveKeyIndex] = useState(0);
  const { toast } = useToast();
  const lastApiCallTime = useRef(0);
  const exhaustedKeys = useRef<Set<number>>(new Set());
  const keyUsageCount = useRef<number>(0);
  const currentRotationKey = useRef<number>(-1);

  const REQUESTS_PER_KEY = 10;
  const KEY_ROTATION_PAUSE = 120000; // 2 minutes

  const RATE_LIMIT = {
    minDelay: 6000,
    maxDelay: 8000,
    batchDelay: 10000,
    retryOn429: 65000,
    maxRPM: 10,
  };

  // Generate random delay between 6.5s to 8s to appear more human-like
  const getRandomDelay = (): number => {
    const delays = [6500, 7000, 7500, 8000];
    return delays[Math.floor(Math.random() * delays.length)];
  };

  const waitForRateLimit = async () => {
    const elapsed = Date.now() - lastApiCallTime.current;
    const randomDelay = getRandomDelay();
    if (elapsed < randomDelay) {
      await new Promise(r => setTimeout(r, randomDelay - elapsed));
    }
    lastApiCallTime.current = Date.now();
  };

  const getFirstValidKeyIndex = useCallback((keys: string[]): number => {
    return keys.findIndex(key => key.trim());
  }, []);

  // Find next available key, returns -1 if all valid keys are exhausted
  const getNextAvailableKey = useCallback((keys: string[], currentIndex: number): number => {
    const hasValidKey = keys.some(key => key.trim());
    if (!hasValidKey) return -1;

    for (let offset = 1; offset <= keys.length; offset++) {
      const candidateIndex = (currentIndex + offset) % keys.length;
      if (keys[candidateIndex]?.trim() && !exhaustedKeys.current.has(candidateIndex)) {
        return candidateIndex;
      }
    }

    return -1;
  }, []);

  const generateMetadata = async (
    imageFile: File,
    apiKeys: string[],
    keyIndex?: number
  ): Promise<{ result: MetadataResult | null; usedKeyIndex: number; error?: string }> => {
    // Key rotation: cycle through keys, REQUESTS_PER_KEY each, with pause between
    let currentKeyIndex = keyIndex ?? activeKeyIndex;
    if (keyIndex === undefined) {
      const validKeyIndices = apiKeys
        .map((k, i) => (k.trim() && !exhaustedKeys.current.has(i) ? i : -1))
        .filter(i => i !== -1);

      if (validKeyIndices.length > 1) {
        // Initialize rotation
        if (currentRotationKey.current === -1 || !validKeyIndices.includes(currentRotationKey.current)) {
          currentRotationKey.current = validKeyIndices[0];
          keyUsageCount.current = 0;
        }

        // If current key has hit its quota, rotate to next
        if (keyUsageCount.current >= REQUESTS_PER_KEY) {
          const currentPos = validKeyIndices.indexOf(currentRotationKey.current);
          const nextPos = (currentPos + 1) % validKeyIndices.length;
          const nextKey = validKeyIndices[nextPos];

          toast({
            title: "⏸️ Key Rotation Pause",
            description: `Key ${currentRotationKey.current + 1} এ ${REQUESTS_PER_KEY}টি request সম্পন্ন। ২ মিনিট বিরতি দিয়ে Key ${nextKey + 1}-এ সুইচ হচ্ছে...`,
          });

          await new Promise(r => setTimeout(r, KEY_ROTATION_PAUSE));

          currentRotationKey.current = nextKey;
          keyUsageCount.current = 0;
          setActiveKeyIndex(nextKey);

          toast({
            title: "▶️ Resumed",
            description: `এখন Key ${nextKey + 1} ব্যবহার হচ্ছে`,
          });
        }

        currentKeyIndex = currentRotationKey.current;
        keyUsageCount.current += 1;
      }
    }

    const apiKey = apiKeys[currentKeyIndex];

    if (!apiKey?.trim()) {
      toast({ title: "API Key Required", description: "API Key দিন।", variant: "destructive" });
      return { result: null, usedKeyIndex: currentKeyIndex, error: 'API Key দিন।' };
    }

    const isVideo = imageFile.type.startsWith('video/');

    const makeApiCall = async ({
      alternateOrder = false,
      tryKeyIndex = currentKeyIndex,
      model = DEFAULT_MODEL as GeminiModel,
      quotaRetryCount = 0,
      overloadRetryCount = 0,
      tempRateLimitRetryCount = 0,
    } = {}): Promise<any> => {
      try {
        const { base64Data, mimeType } = isVideo
          ? await convertVideoToBase64(imageFile)
          : await optimizeImageForGemini(imageFile);

        const contentType = isVideo ? 'video' : 'image';
        const prompt = PROMPT.replace('{contentType}', contentType);
        const isRateLimitedModel = model !== DEFAULT_MODEL;

        const mediaBlock = {
          type: contentType,
          data: base64Data,
          mime_type: mimeType,
        };
        const textBlock = { type: 'text', text: prompt };
        const input = alternateOrder ? [textBlock, mediaBlock] : [mediaBlock, textBlock];

        if (isRateLimitedModel) await waitForRateLimit();

        const currentKey = apiKeys[tryKeyIndex];
        const response = await fetch(INTERACTIONS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': currentKey ?? '',
          },
          body: JSON.stringify({ model, input }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null) as GeminiErrorResponse | null;
          const errorMessage = errorData?.error?.message?.toLowerCase() ?? '';
          const errorStatus = errorData?.error?.status ?? '';
          const retryDelayRaw = errorData?.error?.details?.find(detail => detail.retryDelay)?.retryDelay;
          const retryDelayMs = retryDelayRaw ? Math.max(parseInt(retryDelayRaw, 10) * 1000, 5000) : null;
          const isHighDemand = HIGH_DEMAND_PATTERNS.some(pattern => errorMessage.includes(pattern));
          const hasQuotaSignal = QUOTA_EXHAUSTED_PATTERNS.some(pattern => errorMessage.includes(pattern));
          const quotaViolationText = getQuotaViolationText(errorData?.error?.details);
          const hasDailyQuotaViolation = includesQuotaPattern(quotaViolationText, DAILY_QUOTA_PATTERNS);
          const hasMinuteQuotaViolation = includesQuotaPattern(quotaViolationText, MINUTE_QUOTA_PATTERNS);
          const isQuotaExhausted =
            !isHighDemand &&
            (response.status === 429 || errorStatus === 'RESOURCE_EXHAUSTED') &&
            (hasDailyQuotaViolation || (hasQuotaSignal && !hasMinuteQuotaViolation && !retryDelayMs));
          const isTemporaryRateLimit =
            !isHighDemand &&
            (response.status === 429 || errorStatus === 'RESOURCE_EXHAUSTED') &&
            !isQuotaExhausted &&
            (hasMinuteQuotaViolation || Boolean(retryDelayMs));
          const isModelOverloaded = response.status === 503 || errorStatus === 'UNAVAILABLE' || isHighDemand;

          if (isQuotaExhausted) {
            exhaustedKeys.current.add(tryKeyIndex);
            const nextKey = getNextAvailableKey(apiKeys, tryKeyIndex);

            if (nextKey !== -1 && nextKey !== tryKeyIndex) {
              toast({
                title: "🔄 API Key সুইচ হচ্ছে",
                description: `Key ${tryKeyIndex + 1} limit শেষ → Key ${nextKey + 1} ব্যবহার হচ্ছে`,
              });
              setActiveKeyIndex(nextKey);
              return makeApiCall({
                alternateOrder,
                tryKeyIndex: nextKey,
                model,
                quotaRetryCount: quotaRetryCount + 1,
              });
            }

            const fallbackModelForQuota = MODEL_FALLBACKS[model];
            if (fallbackModelForQuota) {
              const firstValidKeyIndex = getFirstValidKeyIndex(apiKeys);
              if (firstValidKeyIndex !== -1) {
                exhaustedKeys.current.clear();
                toast({
                  title: "🔄 Fallback মডেলে সুইচ হচ্ছে",
                  description: `${model} quota/limit → ${fallbackModelForQuota} ট্রাই হচ্ছে`,
                });
                setActiveKeyIndex(firstValidKeyIndex);
                return makeApiCall({
                  alternateOrder,
                  tryKeyIndex: firstValidKeyIndex,
                  model: fallbackModelForQuota,
                });
              }
            }

            if (!hasDailyQuotaViolation && quotaRetryCount < 2) {
              const delay = retryDelayMs ?? RATE_LIMIT.retryOn429;
              toast({
                title: "⏳ Quota reset এর জন্য অপেক্ষা",
                description: `${Math.round(delay / 1000)}s পরে আবার চেষ্টা করা হবে`,
              });
              exhaustedKeys.current.clear();
              await new Promise(r => setTimeout(r, delay));
              const firstValidKeyIndex = getFirstValidKeyIndex(apiKeys);
              return makeApiCall({
                alternateOrder,
                tryKeyIndex: firstValidKeyIndex === -1 ? tryKeyIndex : firstValidKeyIndex,
                model,
                quotaRetryCount: quotaRetryCount + 1,
              });
            }

            throw new Error(
              hasDailyQuotaViolation
                ? 'সব API Key-এর daily quota শেষ। নতুন API Key দিন বা quota reset হওয়া পর্যন্ত অপেক্ষা করুন।'
                : 'সব API Key-এর quota শেষ। কিছুক্ষণ পরে আবার চেষ্টা করুন।'
            );
          }

          if (isTemporaryRateLimit && tempRateLimitRetryCount < 4) {
            const delay = retryDelayMs ?? Math.min(8000 + tempRateLimitRetryCount * 4000, 25000);
            toast({
              title: "⏳ API rate limit",
              description: `${Math.round(delay / 1000)}s অপেক্ষা করে আবার চেষ্টা করা হচ্ছে`,
            });
            await new Promise(r => setTimeout(r, delay));
            return makeApiCall({
              alternateOrder,
              tryKeyIndex,
              model,
              quotaRetryCount,
              overloadRetryCount,
              tempRateLimitRetryCount: tempRateLimitRetryCount + 1,
            });
          }

          if (isModelOverloaded && overloadRetryCount < 5) {
            const delay = retryDelayMs ?? Math.min(4000 * Math.pow(2, overloadRetryCount), 30000);
            toast({
              title: "API Overloaded",
              description: `${Math.round(delay / 1000)}s অপেক্ষা করে একই মডেলে retry করা হচ্ছে`,
            });
            await new Promise(r => setTimeout(r, delay));
            return makeApiCall({
              alternateOrder,
              tryKeyIndex,
              model,
              quotaRetryCount,
              overloadRetryCount: overloadRetryCount + 1,
              tempRateLimitRetryCount,
            });
          }

          if (isModelOverloaded && MODEL_FALLBACKS[model]) {
            const firstValidKeyIndex = getFirstValidKeyIndex(apiKeys);
            if (firstValidKeyIndex !== -1) {
              const fallbackModel = MODEL_FALLBACKS[model] as GeminiModel;
              exhaustedKeys.current.clear();
              toast({
                title: "🔄 Fallback মডেল চালু হয়েছে",
                description: `${model} overloaded → ${fallbackModel} মডেলে retry করা হচ্ছে`,
              });
              setActiveKeyIndex(firstValidKeyIndex);
              return makeApiCall({
                alternateOrder,
                tryKeyIndex: firstValidKeyIndex,
                model: fallbackModel,
              });
            }
          }

          if (response.status === 400 && !alternateOrder) {
            return makeApiCall({
              alternateOrder: true,
              tryKeyIndex,
              model,
              quotaRetryCount,
              overloadRetryCount,
              tempRateLimitRetryCount,
            });
          }

          throw new Error(errorData?.error?.message || `API Error: ${response.status} ${response.statusText}`);
        }

        return { data: await response.json(), usedKeyIndex: tryKeyIndex };
      } catch (error) {
        if (overloadRetryCount < 3 && error instanceof Error && error.message.includes('503')) {
          const delay = Math.min(Math.pow(2, overloadRetryCount) * 2000, 15000);
          await new Promise(r => setTimeout(r, delay));
          return makeApiCall({
            alternateOrder,
            tryKeyIndex,
            model,
            quotaRetryCount,
            overloadRetryCount: overloadRetryCount + 1,
            tempRateLimitRetryCount,
          });
        }
        throw error;
      }
    };

    try {
      const { data, usedKeyIndex } = await makeApiCall();
      const text = extractInteractionText(data);
      if (!text) throw new Error('No response from API');

      const lines = text.split('\n');
      let title = '', description = '', category = '';
      let titleScore: number | undefined;
      let alternativeTitles: string[] = [];
      let alternativeTitleScores: number[] = [];
      let keywords: string[] = [];

      lines.forEach((line: string) => {
        if (line.startsWith('TITLE-') || line.startsWith('TITLE:'))
          title = cleanTitle(line.replace(/TITLE[-:]\s*/, '').trim());
        else if (line.startsWith('TITLE_SCORE-') || line.startsWith('TITLE_SCORE:'))
          titleScore = parseInt(line.replace(/TITLE_SCORE[-:]\s*/, '').trim()) || undefined;
        else if (line.startsWith('ALT_TITLE_1-') || line.startsWith('ALT_TITLE_1:'))
          alternativeTitles[0] = cleanTitle(line.replace(/ALT_TITLE_1[-:]\s*/, '').trim());
        else if (line.startsWith('ALT_TITLE_1_SCORE-') || line.startsWith('ALT_TITLE_1_SCORE:'))
          alternativeTitleScores[0] = parseInt(line.replace(/ALT_TITLE_1_SCORE[-:]\s*/, '').trim()) || 0;
        else if (line.startsWith('ALT_TITLE_2-') || line.startsWith('ALT_TITLE_2:'))
          alternativeTitles[1] = cleanTitle(line.replace(/ALT_TITLE_2[-:]\s*/, '').trim());
        else if (line.startsWith('ALT_TITLE_2_SCORE-') || line.startsWith('ALT_TITLE_2_SCORE:'))
          alternativeTitleScores[1] = parseInt(line.replace(/ALT_TITLE_2_SCORE[-:]\s*/, '').trim()) || 0;
        else if (line.startsWith('DESCRIPTION-') || line.startsWith('DESCRIPTION:'))
          description = cleanDescription(line.replace(/DESCRIPTION[-:]\s*/, '').trim());
        else if (line.startsWith('CATEGORY-') || line.startsWith('CATEGORY:'))
          category = line.replace(/CATEGORY[-:]\s*/, '').trim();
        else if (line.startsWith('KEYWORDS-') || line.startsWith('KEYWORDS:')) {
          const raw = line.replace(/KEYWORDS[-:]\s*/, '').trim().split(',').map(k => k.trim()).filter(k => k.length > 0);
          keywords = filterUniqueKeywords(cleanKeywords(raw));
        }
      });

      // Add title keywords
      const stopWords = ['and','with','of','the','a','an','is','are','in','on','for','to','by','at','from','or','but','not','no','so','if','as','it','its','be','was','were','been','has','had','do','does','did','will','can','may','this','that','these','those','into'];
      const titleKws = (title || '').replace(/[^\w\s]/g, '').split(/\s+/).map(w => w.trim().toLowerCase()).filter(w => w.length > 2 && !stopWords.includes(w));
      const allKws = [...keywords];
      for (const tk of titleKws) {
        if (!allKws.some(k => k.toLowerCase() === tk)) allKws.unshift(tk);
      }

      setActiveKeyIndex(usedKeyIndex);

      return {
        result: {
          title: title || 'Generated Title',
          titleScore,
          alternativeTitles: alternativeTitles.filter(t => t),
          alternativeTitleScores: alternativeTitleScores.filter(s => s > 0),
          description: description || 'Generated description',
          keywords: allKws.slice(0, 50).length > 0 ? allKws.slice(0, 50) : ['generated', 'metadata'],
          category: category || 'General',
        },
        usedKeyIndex,
        error: undefined,
      };
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'API call failed';
      toast({
        title: "Error Occurred",
        description: errorMessage,
        variant: "destructive",
      });
      return { result: null, usedKeyIndex: currentKeyIndex, error: errorMessage };
    }
  };

  const generateBulkMetadata = async (imageFiles: File[], apiKeys: string[]): Promise<MetadataResult[]> => {
    const validKeys = apiKeys.filter(k => k.trim());
    if (validKeys.length === 0) {
      toast({ title: "API Key Required", description: "অন্তত একটি API Key দিন।", variant: "destructive" });
      return [];
    }

    setLoading(true);
    setProcessingQueue(true);
    exhaustedKeys.current.clear();
    keyUsageCount.current = 0;
    currentRotationKey.current = -1;
    const results: MetadataResult[] = [];
    let hasErrors = false;

    toast({
      title: "Smart Bulk Processing Started",
      description: `${imageFiles.length}টি ইমেজ প্রসেস হচ্ছে ${validKeys.length}টি API Key দিয়ে`,
    });

    try {
      for (let i = 0; i < imageFiles.length; i++) {
        if (i > 0) {
          const delay = hasErrors ? 10000 : RATE_LIMIT.batchDelay;
          await new Promise(r => setTimeout(r, delay + i * 1000));
        }

        toast({ title: "Processing...", description: `Image ${i + 1}/${imageFiles.length}: ${imageFiles[i].name}` });

        const { result } = await generateMetadata(imageFiles[i], apiKeys);
        if (result) {
          results.push(result);
          toast({ title: "✅ Success", description: `Image ${i + 1} processed` });
        } else {
          hasErrors = true;
          toast({ title: "⚠️ Failed", description: `Image ${i + 1} failed`, variant: "destructive" });
        }
      }

      toast({
        title: "Bulk Processing Complete!",
        description: `${results.length}/${imageFiles.length} সফল`,
        variant: results.length === imageFiles.length ? "default" : "destructive",
      });
      return results;
    } catch (error) {
      console.error('Bulk error:', error);
      return results;
    } finally {
      setLoading(false);
      setProcessingQueue(false);
    }
  };

  return { generateMetadata, generateBulkMetadata, loading, processingQueue, activeKeyIndex };
};
