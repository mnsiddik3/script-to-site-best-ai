import { useState } from 'react';
import { Eye, EyeOff, Key, Save, Plus, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ApiKeyInputProps {
  apiKeys: string[];
  onApiKeysChange: (keys: string[]) => void;
  activeKeyIndex: number;
}

export const ApiKeyInput = ({ apiKeys, onApiKeysChange, activeKeyIndex }: ApiKeyInputProps) => {
  const [showKeys, setShowKeys] = useState<boolean[]>(apiKeys.map(() => false));
  const { toast } = useToast();

  const handleKeyChange = (index: number, value: string) => {
    const updated = [...apiKeys];
    updated[index] = value;
    onApiKeysChange(updated);
  };

  const handleAddKey = () => {
    onApiKeysChange([...apiKeys, '']);
    setShowKeys([...showKeys, false]);
  };

  const handleRemoveKey = (index: number) => {
    if (apiKeys.length <= 1) {
      toast({ title: "Error", description: "কমপক্ষে একটি API Key রাখতে হবে।", variant: "destructive" });
      return;
    }
    const updated = apiKeys.filter((_, i) => i !== index);
    const updatedShow = showKeys.filter((_, i) => i !== index);
    onApiKeysChange(updated);
    setShowKeys(updatedShow);
  };

  const toggleShowKey = (index: number) => {
    const updated = [...showKeys];
    updated[index] = !updated[index];
    setShowKeys(updated);
  };

  const handleSaveKeys = () => {
    const validKeys = apiKeys.filter(k => k.trim());
    if (validKeys.length > 0) {
      toast({
        title: "API Keys Saved",
        description: `${validKeys.length}টি API Key সফলভাবে সেভ হয়েছে।`,
      });
    } else {
      toast({
        title: "Error",
        description: "অন্তত একটি বৈধ API Key দিন।",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 bg-gradient-subtle border-brand-primary/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-brand-primary" />
            <Label className="text-sm font-medium">Google Gemini API Keys</Label>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <RotateCcw className="w-3 h-3 mr-1" />
              Auto-Rotate
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {apiKeys.filter(k => k.trim()).length} Key{apiKeys.filter(k => k.trim()).length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          {apiKeys.map((key, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKeys[index] ? 'text' : 'password'}
                  value={key}
                  onChange={(e) => handleKeyChange(index, e.target.value)}
                  placeholder={`API Key ${index + 1}...`}
                  className={`pr-10 border-brand-primary/30 focus:border-brand-primary ${
                    index === activeKeyIndex && key.trim() ? 'ring-2 ring-green-500/50 border-green-500/50' : ''
                  }`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8"
                  onClick={() => toggleShowKey(index)}
                >
                  {showKeys[index] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {index === activeKeyIndex && key.trim() && (
                <Badge className="bg-green-500/20 text-green-700 border-green-500/30 text-xs whitespace-nowrap">
                  Active
                </Badge>
              )}
              {apiKeys.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleRemoveKey(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleAddKey}
          className="w-full border-dashed border-brand-primary/30 text-brand-primary hover:bg-brand-primary/5"
        >
          <Plus className="w-4 h-4 mr-1" />
          আরেকটি API Key যোগ করুন
        </Button>

        <div className="bg-brand-primary/10 rounded-lg p-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <p className="text-xs text-muted-foreground flex-1">
              💡 <strong>Tips:</strong> একাধিক API Key যোগ করলে একটির লিমিট শেষ হলে স্বয়ংক্রিয়ভাবে পরেরটিতে সুইচ হবে।
            </p>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="brand"
                size="sm"
                onClick={handleSaveKeys}
                className="w-full sm:w-auto"
              >
                <Save className="w-4 h-4 mr-1" />
                Save API Keys
              </Button>
              <Button
                variant="brandOutline"
                size="sm"
                onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
                className="w-full sm:w-auto"
              >
                Generate API Key
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
