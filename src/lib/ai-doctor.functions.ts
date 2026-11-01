import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PROBLEM_TYPES = ["model", "api_key", "quota_overload", "other"] as const;

const inputSchema = z.object({
  problemType: z.enum(PROBLEM_TYPES),
  errorLog: z.string().min(1, "Error log is required").max(10000),
  selectedModel: z.string().max(80).optional(),
});

export type AiDoctorInput = z.infer<typeof inputSchema>;

const PROBLEM_LABELS: Record<(typeof PROBLEM_TYPES)[number], string> = {
  model: "মডেল সমস্যা (model not found / unsupported / overload)",
  api_key: "API Key সমস্যা (invalid key / permission denied / 403)",
  quota_overload: "Quota/Overload সমস্যা (429 / RESOURCE_EXHAUSTED / 503)",
  other: "অন্যান্য সমস্যা",
};

const SYSTEM_PROMPT = `You are an expert troubleshooting assistant for a browser-based microstock image metadata generator. The app calls the Google Gemini API (Interactions API, endpoint https://generativelanguage.googleapis.com/v1beta/interactions) directly from the user's browser using API keys the user provides themselves, with multi-key rotation.

Model fallback chain (in order): gemini-3.8-flash -> gemini-3.7-flash -> gemini-3.6-flash -> gemini-3.5-flash-lite -> gemini-3.1-flash-lite -> gemini-2.5-flash. When the selected model hits quota or overload, the app first rotates to the next API key, then falls through to the next model.

Free-tier rate limits the user has confirmed: Flash models (2.5/3.6/3.7/3.8) get 5 requests/minute, 250K tokens/minute, 20 requests/day; Flash Lite models (3.1/3.5) get 15 requests/minute, 250K tokens/minute, 500 requests/day.

Your job: analyze the user's pasted error log and reply ONLY in Bengali (বাংলা), plain text, no markdown code blocks. Structure the answer exactly like this:

সমস্যা: <এক লাইনে সমস্যাটি কী>

কারণ: <মূল কারণ, ২-৪ লাইন>

সমাধান: <নম্বর দিয়ে ২-৫টি সুনির্দিষ্ট ধাপ, ব্যবহারকারী যা এখনই করতে পারবেন>

প্রতিরোধ: <ভবিষ্যতে এড়াতে ১-২ লাইন>

Keep the whole answer under 220 words. Never invent quota numbers other than the ones above unless the log itself states them. Never ask the user to share a full API key; if the log contains one, tell the user to revoke and rotate that key since it was pasted in plain text.`;

export const diagnoseAiError = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    // Load the gateway SDK inside the handler so it never ships to the client bundle.
    const { generateChatCompletion } = await import("@lovable.dev/ai-gateway");

    const logExcerpt = data.errorLog.slice(0, 8000);

    try {
      const response = await generateChatCompletion({
        model: "openai/gpt-6-astra",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              `সমস্যার ধরন: ${PROBLEM_LABELS[data.problemType]}`,
              data.selectedModel ? `নির্বাচিত মডেল: ${data.selectedModel}` : null,
              `Error log:\n${logExcerpt}`,
            ]
              .filter(Boolean)
              .join("\n\n"),
          },
        ],
      });

      const advice = response.choices?.[0]?.message?.content?.trim() ?? "";
      if (!advice) {
        return { advice: "", error: "AI কোনো উত্তর দেয়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।" };
      }
      return { advice, error: null as string | null };
    } catch (err) {
      console.error("AI doctor gateway call failed:", err);
      const message = err instanceof Error ? err.message : String(err);
      return {
        advice: "",
        error: `AI বিশ্লেষণ এখন কাজ করছে না (${message.slice(0, 120)})। কিছুক্ষণ পরে আবার চেষ্টা করুন।`,
      };
    }
  });
