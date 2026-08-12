import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Image, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Platform {
  name: string;
  displayName: string;
  color: string;
  icon: string;
  titleMaxLength: number;
  descriptionMaxLength: number;
  keywordMaxCount: number;
  requirements: string[];
  formatKeywords: (keywords: string[]) => string;
}

interface PlatformSpecificExportProps {
  results: Array<{
    image: File;
    title: string;
    alternativeTitles?: string[];
    description: string;
    keywords: string[];
    category: string;
    selectedTitleIndex?: number;
    failed?: boolean;
  }>;
}

export const PlatformSpecificExport = ({ results }: PlatformSpecificExportProps) => {
  const { toast } = useToast();
  const exportableResults = results.filter(result => !result.failed && result.title.trim() && result.description.trim() && result.keywords.length > 0);

  // Valid Shutterstock categories mapping
  const shutterstockCategories = {
    'Abstract': 'Abstract',
    'Animals': 'Animals/Wildlife',
    'Wildlife': 'Animals/Wildlife',
    'Architecture': 'Buildings/Landmarks',
    'Buildings': 'Buildings/Landmarks',
    'Landmarks': 'Buildings/Landmarks',
    'Arts': 'Arts',
    'Art': 'Arts',
    'Backgrounds': 'Backgrounds/Textures',
    'Textures': 'Backgrounds/Textures',
    'Beauty': 'Beauty/Fashion',
    'Fashion': 'Beauty/Fashion',
    'Business': 'Business/Finance',
    'Finance': 'Business/Finance',
    'Celebrities': 'Celebrities',
    'Celebrity': 'Celebrities',
    'Computers': 'Technology',
    'Education': 'Education',
    'Family': 'People',
    'Food': 'Food and drink',
    'Drink': 'Food and drink',
    'Healthcare': 'Healthcare/Medical',
    'Medical': 'Healthcare/Medical',
    'Health': 'Healthcare/Medical',
    'Holidays': 'Holidays',
    'Holiday': 'Holidays',
    'Industrial': 'Industrial',
    'Industry': 'Industrial',
    'Interiors': 'Interiors',
    'Interior': 'Interiors',
    'Landscapes': 'Nature',
    'Lifestyle': 'People',
    'Miscellaneous': 'Miscellaneous',
    'Nature': 'Nature',
    'Natural': 'Nature',
    'Objects': 'Objects',
    'Object': 'Objects',
    'Parks': 'Parks/Outdoor',
    'Outdoor': 'Parks/Outdoor',
    'People': 'People',
    'Person': 'People',
    'Places': 'Buildings/Landmarks',
    'Religion': 'Religion',
    'Religious': 'Religion',
    'Science': 'Science',
    'Scientific': 'Science',
    'Signs': 'Signs/Symbols',
    'Symbols': 'Signs/Symbols',
    'Sports': 'Sports/Recreation',
    'Recreation': 'Sports/Recreation',
    'Technology': 'Technology',
    'Tech': 'Technology',
    'Transportation': 'Transportation',
    'Transport': 'Transportation',
    'Travel': 'Transportation',
    'Vintage': 'Vintage'
  };

  const mapToShutterstockCategory = (category: string): string => {
    // First try exact match
    if (shutterstockCategories[category as keyof typeof shutterstockCategories]) {
      return shutterstockCategories[category as keyof typeof shutterstockCategories];
    }
    
    // Try partial matching
    const lowerCategory = category.toLowerCase();
    for (const [key, value] of Object.entries(shutterstockCategories)) {
      if (lowerCategory.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerCategory)) {
        return value;
      }
    }
    
    // Default fallback
    return 'Abstract';
  };

  const mapToAdobeStockCategory = (category: string): string => {
    const adobeCategories = {
      'Animals': '1',
      'Animal': '1',
      'Wildlife': '1',
      'Buildings': '2',
      'Architecture': '2',
      'Building': '2',
      'Business': '3',
      'Finance': '3',
      'Drinks': '4',
      'Drink': '4',
      'Environment': '5',
      'Environmental': '5',
      'Nature': '5',
      'States of Mind': '6',
      'Mind': '6',
      'Mental': '6',
      'Emotion': '6',
      'Food': '7',
      'Graphic Resources': '8',
      'Graphic': '8',
      'Design': '8',
      'Graphics': '8',
      'Hobbies and Leisure': '9',
      'Hobbies': '9',
      'Leisure': '9',
      'Hobby': '9',
      'Industry': '10',
      'Industrial': '10',
      'Landscapes': '11',
      'Landscape': '11',
      'Lifestyle': '12',
      'Life': '12',
      'People': '13',
      'Person': '13',
      'Human': '13',
      'Plants and Flowers': '14',
      'Plants': '14',
      'Flowers': '14',
      'Plant': '14',
      'Flower': '14',
      'Culture and Religion': '15',
      'Culture': '15',
      'Religion': '15',
      'Religious': '15',
      'Cultural': '15',
      'Science': '16',
      'Scientific': '16',
      'Social Issues': '17',
      'Social': '17',
      'Society': '17',
      'Sports': '18',
      'Sport': '18',
      'Recreation': '18',
      'Technology': '19',
      'Tech': '19',
      'Transport': '20',
      'Transportation': '20',
      'Vehicle': '20',
      'Travel': '21',
      'Tourism': '21',
      'Vacation': '21'
    };

    // First try exact match
    if (adobeCategories[category as keyof typeof adobeCategories]) {
      return adobeCategories[category as keyof typeof adobeCategories];
    }
    
    // Try partial matching
    const lowerCategory = category.toLowerCase();
    for (const [key, value] of Object.entries(adobeCategories)) {
      if (lowerCategory.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerCategory)) {
        return value;
      }
    }
    
    // Default fallback to Graphic Resources
    return '8';
  };

  const platforms: Platform[] = [
    {
      name: 'shutterstock',
      displayName: 'Shutterstock',
      color: 'bg-red-500 hover:bg-red-600 border-red-200',
      icon: '📸',
      titleMaxLength: 200,
      descriptionMaxLength: 200,
      keywordMaxCount: 50,
      requirements: [
        'Max 50 keywords',
        '200 character description',
        'Filename with extension required',
        'Categories from approved list'
      ],
      formatKeywords: (keywords) => keywords.slice(0, 50).join(', ')
    },
    {
      name: 'adobe-stock',
      displayName: 'Adobe Stock',
      color: 'bg-blue-600 hover:bg-blue-700 border-blue-200',
      icon: '🎨',
      titleMaxLength: 200,
      descriptionMaxLength: 200,
      keywordMaxCount: 49,
      requirements: [
        'Max 49 keywords',
        '200 character limit',
        'High commercial value'
      ],
      formatKeywords: (keywords) => keywords.slice(0, 49).join(', ')
    },
    {
      name: 'freepik',
      displayName: 'Freepik',
      color: 'bg-cyan-500 hover:bg-cyan-600 border-cyan-200',
      icon: '🖼️',
      titleMaxLength: 100,
      descriptionMaxLength: 300,
      keywordMaxCount: 20,
      requirements: [
        'Max 20 keywords',
        '100 character title',
        'Semicolon (;) separated CSV',
        'Includes Prompt & Model columns'
      ],
      formatKeywords: (keywords) => keywords.slice(0, 20).join(',')
    },
    {
      name: 'vecteezy',
      displayName: 'Vecteezy',
      color: 'bg-purple-500 hover:bg-purple-600 border-purple-200',
      icon: '🎯',
      titleMaxLength: 255,
      descriptionMaxLength: 1000,
      keywordMaxCount: 49,
      requirements: [
        'Max 49 keywords',
        '255 character title',
        '1000 character description'
      ],
      formatKeywords: (keywords) => keywords.slice(0, 49).join(', ')
    }
  ];

  const generatePlatformCsv = (platform: Platform) => {
    if (exportableResults.length === 0) {
      toast({
        title: "কোন ডেটা নেই",
        description: "শুধু সফলভাবে জেনারেট হওয়া মেটাডেটা এক্সপোর্ট করা যাবে।",
        variant: "destructive",
      });
      return;
    }

    // Platform-specific CSV data preparation
    const csvData = exportableResults.map((result) => {
      // Get the selected title based on selectedTitleIndex
      const allTitles = [result.title, ...(result.alternativeTitles || [])];
      const selectedTitleIndex = result.selectedTitleIndex || 0;
      const selectedTitle = allTitles[selectedTitleIndex] || result.title;
      
      // Truncate title if exceeds platform limit
      let title = selectedTitle;
      if (title.length > platform.titleMaxLength) {
        title = title.substring(0, platform.titleMaxLength - 3) + '...';
      }
      
      // Truncate description if exceeds platform limit
      let description = result.description;
      if (description.length > platform.descriptionMaxLength) {
        description = description.substring(0, platform.descriptionMaxLength - 3) + '...';
      }

      const baseData = {
        filename: platform.name === 'shutterstock' 
          ? result.image.name.replace(/\.[^/.]+$/, ".eps").replace(/[\/\\\r\n\t]/g, "-") // Replace extension with .eps, clean special chars
          : platform.name === 'adobe-stock'
          ? result.image.name.replace(/\.[^/.]+$/, ".eps") // Replace extension with .eps for Adobe Stock
          : platform.name === 'vecteezy'
          ? result.image.name.replace(/\.[^/.]+$/, ".jpg") // Replace extension with .jpg for Vecteezy
          : result.image.name.replace(/\.[^/.]+$/, ""), // Remove extension for others
        title,
        keywords: platform.formatKeywords(result.keywords),
      };

      // Add platform-specific fields
      if (platform.name === 'shutterstock') {
        return {
          Filename: baseData.filename,
          Description: description,
          Keywords: baseData.keywords,
          Categories: mapToShutterstockCategory(result.category)
        };
      } else if (platform.name === 'adobe-stock') {
        return {
          Filename: baseData.filename, // Use .eps extension for Adobe Stock
          Title: title,
          Keywords: baseData.keywords,
          Category: mapToAdobeStockCategory(result.category), // Auto-mapped category number
          Releases: '' // Empty when no recognizable people or property
        };
      } else if (platform.name === 'freepik') {
        return {
          ...baseData,
          prompt: description, // Use description as prompt for Freepik
          model: '' // Empty model field for manual entry
        };
      } else if (platform.name === 'vecteezy') {
        return {
          Filename: baseData.filename,
          Title: title,
          Description: description,
          Keywords: baseData.keywords,
          Category: result.category
        };
      } else {
        return {
          ...baseData,
          description,
          category: result.category
        };
      }
    });

    // Platform-specific headers and formatting
    let headers: string[];
    let separator: string;
    
    if (platform.name === 'shutterstock') {
      headers = ['Filename', 'Description', 'Keywords', 'Categories'];
      separator = ',';
    } else if (platform.name === 'adobe-stock') {
      headers = ['Filename', 'Title', 'Keywords', 'Category', 'Releases'];
      separator = ',';
    } else if (platform.name === 'freepik') {
      headers = ['filename', 'title', 'keywords', 'prompt', 'model'];
      separator = ';';
    } else if (platform.name === 'vecteezy') {
      headers = ['Filename', 'Title', 'Description', 'Keywords', 'Category'];
      separator = ',';
    } else {
      headers = ['filename', 'title', 'description', 'keywords', 'category'];
      separator = ',';
    }
    
    // Create CSV content with proper escaping
    console.log('Platform:', platform.name);
    console.log('Headers:', headers);
    console.log('Sample row:', csvData[0]);
    
    const csvContent = [
      headers.join(separator),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row] || '';
          console.log(`Header: ${header}, Value: ${value}`);
          
          // For Vecteezy, only quote fields that contain commas
          if (platform.name === 'vecteezy') {
            if (value.toString().includes(',') || value.toString().includes('"')) {
              const escapedValue = value.toString().replace(/"/g, '""');
              return `"${escapedValue}"`;
            }
            return value.toString();
          }
          
          // For other platforms, wrap all fields in quotes
          const escapedValue = value.toString().replace(/"/g, '""');
          return `"${escapedValue}"`;
        }).join(separator)
      )
    ].join('\n');

    // Debug: Check for BOM and header structure
    console.log('CSV Headers line:', headers.join(separator));
    console.log('First header character code:', headers[0].charCodeAt(0));
    console.log('CSV first line bytes:', [...csvContent.split('\n')[0]].map(c => c.charCodeAt(0)));

    // Add BOM for better Excel compatibility  
    const csvWithBOM = '\uFEFF' + csvContent;

    // Download CSV
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${platform.name}-metadata-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: `${platform.displayName} CSV সফলভাবে ডাউনলোড হয়েছে`,
      description: `${exportableResults.length}টি ছবির মেটাডেটা এক্সপোর্ট করা হয়েছে।`,
    });
  };

  if (exportableResults.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-subtle border-brand-primary/20">
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <Image className="w-6 h-6 text-brand-primary" />
          <div>
            <h3 className="text-xl font-bold text-foreground">
              Microstock Platform Export
            </h3>
            <p className="text-sm text-muted-foreground">
              প্রতিটি প্ল্যাটফর্মের requirement অনুযায়ী CSV ডাউনলোড করুন
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map((platform) => (
            <Card key={platform.name} className={`p-4 border-2 ${platform.color.split(' ')[2]} hover:shadow-lg transition-all duration-200 group cursor-pointer`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{platform.icon}</span>
                    <div>
                      <h4 className="font-semibold text-foreground">{platform.displayName}</h4>
                      <Badge variant="outline" className="text-xs">
                        {platform.keywordMaxCount} keywords max
                      </Badge>
                    </div>
                  </div>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    <strong>Requirements:</strong>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {platform.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-brand-primary rounded-full"></span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => generatePlatformCsv(platform)}
                  className={`w-full ${platform.color} text-white border-0 hover:shadow-md transition-all duration-200 group-hover:scale-[1.02]`}
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download {platform.displayName} CSV
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-brand-primary/10">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-brand-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                প্রতিটি প্ল্যাটফর্মের বিশেষ সুবিধা:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Title এবং Description automatic formatting</li>
                <li>• Platform অনুযায়ী keyword limit</li>
                <li>• Excel compatible CSV format</li>
                <li>• Auto-update যখন metadata edit করবেন</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};