# Microstock Image Metadata Generator — GitHub কোড থেকে ওয়েবসাইট

আপনার রিপো (`mnsiddik3/gemini-api-csv-selection`) হলো একটি AI মেটাডাটা জেনারেটর: ছবি আপলোড → Gemini API দিয়ে টাইটেল, ডেসক্রিপশন, ক্যাটাগরি ও ৫০টি কীওয়ার্ড → স্টক প্ল্যাটফর্মভিত্তিক CSV এক্সপোর্ট। এই অ্যাপটি হুবহু এই প্রজেক্টে তৈরি করা হবে।

## যা তৈরি হবে

**হোম পেজ (`/`)**
- হিরো সেকশন: গ্রেডিয়েন্ট ব্যাকগ্রাউন্ড, হিরো ইমেজ, "Microstock Image Metadata Generator" শিরোনাম — রিপোর ডিজাইন হুবহু
- API Key ইনপুট: ব্যবহারকারী নিজের Gemini API key দেবে, একাধিক কী যোগ করা যাবে, ব্রাউজারে (localStorage) সেভ থাকবে, একটি কী কোটা শেষ হলে পরেরটিতে অটো-রোটেশন
- ছবি আপলোড: ড্র্যাগ-এন্ড-ড্রপ, একাধিক ছবি, সাইজ/টাইপ ভ্যালিডেশন, প্রিভিউ
- Generate বোতাম + প্রগ্রেস বার, প্রতিটি ছবি একে একে প্রসেস
- ফলাফল কার্ড: টাইটেল (স্কোরসহ বিকল্প টাইটেল বাছাই), ডেসক্রিপশন, কীওয়ার্ড, ক্যাটাগরি — সবই সম্পাদনাযোগ্য, ব্যর্থ হলে রি-জেনারেট বোতাম
- প্ল্যাটফর্ম CSV এক্সপোর্ট: Shutterstock, Adobe Stock, Freepik, Vecteezy, Dreamstime ইত্যাদির নিজস্ব ফরম্যাট ও লিমিট অনুযায়ী

**অন্য পেজ**
- `/privacy` — প্রাইভেসি পলিসি
- `/contact` — যোগাযোগ
- ভুল URL-এর জন্য 404 পেজ

## কারিগরি অংশ

- রিপো Vite + React Router–ভিত্তিক; এই প্রজেক্ট TanStack Start। তাই পেজগুলো `src/routes/index.tsx`, `src/routes/privacy.tsx`, `src/routes/contact.tsx` হিসেবে পোর্ট হবে; `react-router-dom`-এর `Link` → TanStack `Link`।
- কম্পোনেন্ট পোর্ট: `ImageUpload`, `ApiKeyInput`, `ImageWithMetadata`, `KeywordResults`, `CsvExport`, `PlatformSpecificExport`, `ErrorBoundary`।
- লজিক পোর্ট: `useGeminiApi` হুক (মাল্টি-কী রোটেশন, quota/overload ডিটেকশন, রিট্রাই, মডেল ফলব্যাক), `lib/imageUtils` (ইমেজ অপটিমাইজেশন ও base64)।
- Gemini কল ব্রাউজার থেকেই হবে ব্যবহারকারীর নিজের কী দিয়ে — কোনো সার্ভার/ডাটাবেস বা Lovable Cloud লাগবে না। রিপোর Supabase ইন্টিগ্রেশন অব্যবহৃত, তাই বাদ।
- ডিজাইন টোকেন (`gradient-primary`, `brand-accent`, শ্যাডো ইত্যাদি) রিপোর `index.css`/`tailwind.config.ts` থেকে এই প্রজেক্টের `src/styles.css`-এ Tailwind v4 ফরম্যাটে আনা হবে।
- হিরো ইমেজ নতুন করে জেনারেট করা হবে (রিপোর ছবিটির অনুরূপ)।
- প্রতিটি পেজে আলাদা SEO টাইটেল ও ডেসক্রিপশন।

## নোট

আপনার রিপোতে `.env` ফাইল কমিট করা আছে — এতে কোনো আসল কী থাকলে সেটি বাতিল করে নতুন কী নেওয়া ভালো। এই অ্যাপে কোনো কী কোডে রাখা হবে না।
