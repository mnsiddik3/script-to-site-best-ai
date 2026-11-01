import { useState } from "react";
import { Bot, ClipboardPaste, Loader2, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { diagnoseAiError } from "@/lib/ai-doctor.functions";

type ProblemType = "model" | "api_key" | "quota_overload" | "other";

const PROBLEM_OPTIONS: { value: ProblemType; label: string }[] = [
  { value: "quota_overload", label: "Quota / Overload (429, 503)" },
  { value: "api_key", label: "API Key সমস্যা (403, PERMISSION_DENIED)" },
  { value: "model", label: "মডেল সমস্যা (model not found, overload)" },
  { value: "other", label: "অন্যান্য" },
];

export function AiErrorDoctor({ lastError }: { lastError?: string }) {
  const [problemType, setProblemType] = useState<ProblemType>("quota_overload");
  const [errorLog, setErrorLog] = useState("");
  const [advice, setAdvice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDiagnose = async () => {
    if (!errorLog.trim()) return;
    setLoading(true);
    setAdvice(null);
    setError(null);
    try {
      const result = await diagnoseAiError({
        data: { problemType, errorLog: errorLog.trim() },
      });
      if (result.error) {
        setError(result.error);
      } else {
        setAdvice(result.advice);
      }
    } catch {
      setError("বিশ্লেষণ করা যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-brand-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Bot className="h-5 w-5 text-brand-primary" />
          AI এরর ডাক্তার
        </CardTitle>
        <CardDescription>
          মডেল, API Key বা quota/overload-সংক্রান্ত error log পেস্ট করুন — AI সমস্যার
          কারণ ও সমাধানের পরামর্শ বাংলায় দেবে।
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>সমস্যার ধরন</Label>
          <Select value={problemType} onValueChange={(v) => setProblemType(v as ProblemType)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="সমস্যার ধরন বেছে নিন" />
            </SelectTrigger>
            <SelectContent>
              {PROBLEM_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Error log</Label>
          <Textarea
            value={errorLog}
            onChange={(e) => setErrorLog(e.target.value)}
            placeholder={'যেমন:\n{\n  "error": {\n    "code": 429,\n    "message": "RESOURCE_EXHAUSTED ...",\n    "status": "RESOURCE_EXHAUSTED"\n  }\n}'}
            rows={7}
            className="font-mono text-xs"
          />
          {lastError && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setErrorLog(lastError)}
              className="gap-2"
            >
              <ClipboardPaste className="h-4 w-4" />
              শেষ error log বসান
            </Button>
          )}
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            সতর্কতা: পুরো API Key কখনো এখানে দেবেন না — প্রয়োজনে শুধু প্রথম ৬টি
            অক্ষর দিন।
          </p>
        </div>

        <Button
          variant="brand"
          onClick={handleDiagnose}
          disabled={loading || !errorLog.trim()}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              বিশ্লেষণ হচ্ছে...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              বিশ্লেষণ করুন
            </>
          )}
        </Button>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {advice && (
          <div className="rounded-md border border-brand-primary/20 bg-brand-primary/5 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {advice}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
