import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CsvData {
  filename: string;
  title: string;
  description: string;
  keywords: string;
  category: string;
}

interface Platform {
  name: string;
  displayName: string;
  color: string;
  icon: string;
  titleMaxLength: number;
  descriptionMaxLength: number;
  keywordMaxCount: number;
  formatKeywords: (keywords: string[]) => string;
}

interface CsvExportProps {
  results: Array<{
    image: File;
    title: string;
    alternativeTitles?: string[];
    description: string;
    keywords: string[];
    category: string;
    selectedTitleIndex?: number;
  }>;
}

export const CsvExport = ({ results }: CsvExportProps) => {
  const { toast } = useToast();

  const platforms: Platform[] = [
    {
      name: 'shutterstock',
      displayName: 'Shutterstock',
      color: 'bg-red-500 hover:bg-red-600',
      icon: '📸',
      titleMaxLength: 200,
      descriptionMaxLength: 200,
      keywordMaxCount: 50,
      formatKeywords: (keywords) => keywords.slice(0, 50).join(', ')
    },
    {
      name: 'adobe-stock',
      displayName: 'Adobe Stock',
      color: 'bg-blue-600 hover:bg-blue-700',
      icon: '🎨',
      titleMaxLength: 200,
      descriptionMaxLength: 200,
      keywordMaxCount: 49,
      formatKeywords: (keywords) => keywords.slice(0, 49).join(', ')
    },
    {
      name: 'freepik',
      displayName: 'Freepik',
      color: 'bg-cyan-500 hover:bg-cyan-600',
      icon: '🖼️',
      titleMaxLength: 100,
      descriptionMaxLength: 300,
      keywordMaxCount: 20,
      formatKeywords: (keywords) => keywords.slice(0, 20).join(', ')
    },
    {
      name: 'vecteezy',
      displayName: 'Vecteezy',
      color: 'bg-purple-500 hover:bg-purple-600',
      icon: '🎯',
      titleMaxLength: 255,
      descriptionMaxLength: 1000,
      keywordMaxCount: 30,
      formatKeywords: (keywords) => keywords.slice(0, 30).join(', ')
    }
  ];

  const generateCsv = (platform: Platform) => {
    if (results.length === 0) {
      toast({
        title: "কোন ডেটা নেই",
        description: "প্রথমে ছবির জন্য মেটাডেটা তৈরি করুন।",
        variant: "destructive",
      });
      return;
    }

    // Prepare CSV data with platform-specific formatting
    const csvData: CsvData[] = results.map((result) => {
      // Get the selected title based on selectedTitleIndex
      const allTitles = [result.title, ...(result.alternativeTitles || [])];
      const selectedTitleIndex = result.selectedTitleIndex || 0;
      const selectedTitle = allTitles[selectedTitleIndex] || result.title;
      
      const title = selectedTitle.length > platform.titleMaxLength 
        ? selectedTitle.substring(0, platform.titleMaxLength - 3) + '...'
        : selectedTitle;
      
      const description = result.description.length > platform.descriptionMaxLength
        ? result.description.substring(0, platform.descriptionMaxLength - 3) + '...'
        : result.description;

      return {
        filename: result.image.name,
        title,
        description,
        keywords: platform.formatKeywords(result.keywords),
        category: result.category
      };
    });

    // Create CSV content
    const headers = ['filename', 'title', 'description', 'keywords', 'category'];
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header as keyof CsvData];
          // Escape quotes and wrap in quotes if contains comma or quote
          const escapedValue = value.replace(/"/g, '""');
          return value.includes(',') || value.includes('"') || value.includes('\n') 
            ? `"${escapedValue}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${platform.name}-metadata-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: `${platform.displayName} CSV এক্সপোর্ট সফল`,
      description: `${results.length}টি ছবির মেটাডেটা এক্সপোর্ট করা হয়েছে।`,
    });
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-subtle border-brand-primary/20">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Image className="w-5 h-5 text-brand-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Microstock সাইটের জন্য CSV এক্সপোর্ট করুন
          </h3>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          প্রতিটি প্ল্যাটফর্মের জন্য আলাদা আলাদা CSV ফাইল ডাউনলোড করুন। প্রতিটি সাইটের নিজস্ব requirements অনুযায়ী metadata format করা হবে।
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {platforms.map((platform) => (
            <Button
              key={platform.name}
              onClick={() => generateCsv(platform)}
              variant="outline"
              className={`relative overflow-hidden border-2 hover:border-transparent transition-all duration-200 ${platform.color} text-white border-white/20 hover:shadow-lg group`}
              size="lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{platform.icon}</span>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{platform.displayName}</span>
                  <span className="text-xs opacity-80">
                    {platform.keywordMaxCount} keywords
                  </span>
                </div>
                <Download className="w-4 h-4 ml-auto group-hover:scale-110 transition-transform" />
              </div>
            </Button>
          ))}
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>নোট:</strong> প্রতিটি প্ল্যাটফর্মের title, description এবং keyword এর সীমা আলাদা। CSV ফাইল সেই অনুযায়ী automatically format হয়ে যাবে।
          </p>
        </div>
      </div>
    </Card>
  );
};