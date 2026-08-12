import { Star, Copy, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface KeywordResultsProps {
  keywords: string[];
  title: string;
  description: string;
  loading: boolean;
}

export const KeywordResults = ({ keywords, title, description, loading }: KeywordResultsProps) => {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [mostImportantKeywords, setMostImportantKeywords] = useState<string[]>([]);
  const [customKeywordInput, setCustomKeywordInput] = useState('');
  const [customTopKeywords, setCustomTopKeywords] = useState<string[]>([]);
  const { toast } = useToast();

  const baseTopKeywords = keywords.slice(0, 35);
  const topKeywords = [...baseTopKeywords, ...customTopKeywords];
  const remainingKeywords = keywords.slice(35);

  const addToMostImportant = (keyword: string) => {
    if (!mostImportantKeywords.includes(keyword)) {
      setMostImportantKeywords([...mostImportantKeywords, keyword]);
      toast({
        title: "Added!",
        description: `"${keyword}" added to Most Important keywords.`,
      });
    }
  };

  const addCustomKeywords = () => {
    if (!customKeywordInput.trim()) return;
    
    const newKeywords = customKeywordInput
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0 && !topKeywords.includes(k));
    
    if (newKeywords.length > 0) {
      setCustomTopKeywords(prev => [...prev, ...newKeywords]);
      setCustomKeywordInput('');
      toast({
        title: "Keywords Added!",
        description: `${newKeywords.length} keyword(s) added to Top Keywords.`,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addCustomKeywords();
    }
  };

  const copyToClipboard = (text: string, index?: string) => {
    navigator.clipboard.writeText(text);
    if (index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
    toast({
      title: "Copied!",
      description: "Text copied to clipboard.",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-6 bg-gradient-subtle">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded-lg w-full"></div>
              ))}
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="w-6 h-6 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-brand-primary font-medium">Generating keywords...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (keywords.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <Card className="p-6 bg-gradient-subtle">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Suggested Title</h3>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground flex-1">{title}</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(title)}
                className="h-8 w-8"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Description</h3>
            <div className="flex items-start gap-2">
              <p className="text-muted-foreground flex-1">{description}</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(description)}
                className="h-8 w-8 mt-1"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* All Keywords */}
      <Card className="p-6 border-brand-primary/20 bg-gradient-primary/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-brand-accent" />
            <h3 className="text-lg font-semibold text-foreground">Microstock Keywords ({keywords.length} total)</h3>
          </div>
          <Button
            variant="brand"
            size="sm"
            onClick={() => copyToClipboard(keywords.join(', '))}
          >
            Copy All Keywords
          </Button>
        </div>
        
        {/* Most Important Keywords - User Added */}
        {mostImportantKeywords.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-medium text-foreground flex items-center gap-2">
                <Star className="w-4 h-4 text-brand-accent fill-current" />
                Most Important Keywords ({mostImportantKeywords.length})
              </h4>
              <Button
                variant="brand"
                size="sm"
                onClick={() => copyToClipboard(mostImportantKeywords.join(', '))}
              >
                Copy All Keywords
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {mostImportantKeywords.map((keyword, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-brand-accent bg-brand-accent/10 text-brand-accent hover:bg-brand-accent hover:text-white cursor-pointer transition-all duration-200 text-sm py-1 px-3"
                  onClick={() => copyToClipboard(keyword, `important-${index}`)}
                >
                  {keyword}
                  {copiedIndex === `important-${index}` ? (
                    <Check className="w-3 h-3 ml-1" />
                  ) : (
                    <Copy className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Top 35 Keywords - Highlighted */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-medium text-foreground">Top 35 Keywords</h4>
            <Button
              variant="brandOutline"
              size="sm"
              onClick={() => copyToClipboard(topKeywords.join(', '))}
            >
              Copy All Top Keywords
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {topKeywords.map((keyword, index) => (
              <Badge
                key={index}
                variant="outline"
                className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white cursor-pointer transition-all duration-200 text-sm py-1 px-3"
                onClick={() => copyToClipboard(keyword, `top-${index}`)}
              >
                {keyword}
                {copiedIndex === `top-${index}` ? (
                  <Check className="w-3 h-3 ml-1" />
                ) : (
                  <Copy className="w-3 h-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
          
          {/* Custom Keyword Input */}
          <div className="mt-4 space-y-2">
            <h5 className="text-sm font-medium text-foreground">Add Custom Keywords</h5>
            <div className="flex gap-2">
              <Input
                placeholder="Enter keywords separated by commas (e.g., nature, beautiful, landscape)"
                value={customKeywordInput}
                onChange={(e) => setCustomKeywordInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                variant="brandOutline"
                size="sm"
                onClick={addCustomKeywords}
                disabled={!customKeywordInput.trim()}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Additional Keywords with Add Button */}
        {remainingKeywords.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-foreground mb-3">Additional Keywords</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {remainingKeywords.map((keyword, index) => (
                <div
                  key={`remaining-${index}`}
                  className="group p-2 border rounded-lg hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span 
                      className="text-xs text-foreground truncate cursor-pointer flex-1"
                      onClick={() => copyToClipboard(keyword, `additional-${index}`)}
                      title="Click to copy"
                    >
                      {keyword}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-brand-accent hover:text-white"
                        onClick={() => addToMostImportant(keyword)}
                        title="Add to Most Important"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      {copiedIndex === `additional-${index}` ? (
                        <Check className="w-3 h-3 text-brand-accent flex-shrink-0" />
                      ) : (
                        <Copy 
                          className="w-3 h-3 text-muted-foreground group-hover:text-brand-primary flex-shrink-0 cursor-pointer" 
                          onClick={() => copyToClipboard(keyword, `additional-${index}`)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};