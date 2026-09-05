import { useEffect, useState } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { Sparkles, Image as ImageIcon, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ImageUpload } from '@/components/ImageUpload';
import { ApiKeyInput } from '@/components/ApiKeyInput';
import { ImageWithMetadata } from '@/components/ImageWithMetadata';
import { PlatformSpecificExport } from '@/components/PlatformSpecificExport';
import { useGeminiApi, GEMINI_MODEL_OPTIONS, DEFAULT_MODEL, type GeminiModel } from '@/hooks/useGeminiApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import heroImage from '@/assets/hero-image.jpg';

function Index() {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [apiKeys, setApiKeys] = useState<string[]>(['']);
  const [results, setResults] = useState<{
    title: string;
    titleScore?: number;
    alternativeTitles?: string[];
    alternativeTitleScores?: number[];
    description: string;
    keywords: string[];
    category: string;
    image: File;
    processing?: boolean;
    selectedTitleIndex?: number;
    failed?: boolean;
    errorMessage?: string;
  }[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [selectedModel, setSelectedModel] = useState<GeminiModel>(DEFAULT_MODEL);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gemini-api-keys');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) setApiKeys(parsed);
      } else {
        const legacy = localStorage.getItem('gemini-api-key');
        if (legacy) setApiKeys([legacy]);
      }
    } catch { /* ignore */ }

    const savedModel = localStorage.getItem('gemini-model');
    if (GEMINI_MODEL_OPTIONS.some(o => o.value === savedModel)) {
      setSelectedModel(savedModel as GeminiModel);
    }
  }, []);

  const handleModelChange = (value: string) => {
    setSelectedModel(value as GeminiModel);
    localStorage.setItem('gemini-model', value);
  };

  const { generateMetadata, loading, activeKeyIndex } = useGeminiApi();

  const handleApiKeysChange = (keys: string[]) => {
    setApiKeys(keys);
    localStorage.setItem('gemini-api-keys', JSON.stringify(keys));
  };

  const hasValidKey = apiKeys.some(k => k.trim());

  const handleGenerate = async () => {
    if (!selectedImages.length || !hasValidKey) return;

    setResults([]);
    setProcessingProgress(0);
    
    const initialPlaceholders = selectedImages.map(imageFile => ({
      title: 'Waiting...',
      description: 'In queue...',
      keywords: [] as string[],
      category: '',
      image: imageFile,
      processing: false,
      failed: false,
    }));
    setResults(initialPlaceholders);
    
    for (let i = 0; i < selectedImages.length; i++) {
      const imageFile = selectedImages[i];
      
      setResults(prev => 
        prev.map((item, index) => 
          index === i 
            ? { ...item, title: 'Processing...', description: 'Generating metadata...', processing: true, failed: false, errorMessage: undefined }
            : item
        )
      );

      const { result, error } = await generateMetadata(imageFile, apiKeys, undefined, selectedModel);
      
      if (result) {
        setResults(prev => 
          prev.map((item, index) => 
            index === i 
              ? { ...result, image: imageFile, processing: false, selectedTitleIndex: 0, failed: false, errorMessage: undefined }
              : item
          )
        );
      } else {
        setResults(prev => 
          prev.map((item, index) => 
            index === i 
              ? {
                  ...item,
                  title: '',
                  description: '',
                  keywords: [],
                  category: '',
                  alternativeTitles: [],
                  alternativeTitleScores: [],
                  processing: false,
                  failed: true,
                  errorMessage: error || 'Metadata generation failed. Please try again.',
                }
              : item
          )
        );
      }
      
      setProcessingProgress(((i + 1) / selectedImages.length) * 100);
    }
  };

  const handleSingleRegenerate = async (image: File, index: number) => {
    setResults(prev => 
      prev.map((item, itemIndex) => 
        itemIndex === index
          ? {
              ...item,
              processing: true,
              failed: false,
              errorMessage: undefined,
              title: 'Processing...',
              description: 'Generating metadata...',
            }
          : item
      )
    );

    const { result, error } = await generateMetadata(image, apiKeys, undefined, selectedModel);
    if (result) {
      setResults(prev => prev.map((item, itemIndex) => itemIndex === index ? { image, ...result, selectedTitleIndex: 0, failed: false, errorMessage: undefined, processing: false } : item));
    } else {
      setResults(prev => 
        prev.map((item, itemIndex) => 
          itemIndex === index
            ? {
                ...item,
                title: '',
                description: '',
                keywords: [],
                category: '',
                alternativeTitles: [],
                alternativeTitleScores: [],
                processing: false,
                failed: true,
                errorMessage: error || 'Metadata generation failed. Please try again.',
              }
            : item
        )
      );
    }
  };

  const handleMetadataUpdate = (index: number, updatedData: {
    title: string;
    alternativeTitles?: string[];
    description: string;
    keywords: string[];
    selectedTitleIndex?: number;
  }) => {
    const updatedResults = [...results];
    updatedResults[index] = { ...updatedResults[index], ...updatedData };
    setResults(updatedResults);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-primary text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-4 lg:space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 lg:px-4 lg:py-2">
                <Sparkles className="w-3 h-3 lg:w-4 lg:h-4" />
                <span className="text-xs lg:text-sm font-medium">AI-Powered Metadata Generator</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold leading-tight">
                Microstock Image
                <br />
                <span className="bg-gradient-to-r from-brand-accent to-yellow-300 bg-clip-text text-transparent">
                  Metadata Generator
                </span>
              </h1>
              
              <p className="text-base lg:text-xl text-white/90 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Generate SEO-optimized titles, descriptions and 50 keywords for your microstock photos using AI. 
                Get instant results with Google Gemini AI for maximum sales potential.
              </p>
              
              <div className="flex flex-wrap gap-3 lg:gap-4 justify-center lg:justify-start">
                <div className="flex items-center gap-2 text-white/80 text-sm lg:text-base">
                  <Zap className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span>Instant Generation</span>
                </div>
                <div className="flex items-center gap-2 text-white/80 text-sm lg:text-base">
                  <ImageIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span>Multiple Formats</span>
                </div>
                <div className="flex items-center gap-2 text-white/80 text-sm lg:text-base">
                  <Sparkles className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span>50+ Keywords</span>
                </div>
              </div>
            </div>
            
            <div className="relative mt-8 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-secondary rounded-2xl lg:rounded-3xl blur-2xl lg:blur-3xl opacity-30 animate-pulse-glow"></div>
              <img
                src={heroImage}
                alt="Stock Image Metadata Generator"
                className="relative rounded-2xl lg:rounded-3xl shadow-2xl animate-float w-full max-w-md mx-auto lg:max-w-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 lg:py-12 space-y-6 lg:space-y-8">
        {/* API Key Input */}
        <ApiKeyInput apiKeys={apiKeys} onApiKeysChange={handleApiKeysChange} activeKeyIndex={activeKeyIndex} />

        {/* Image Upload */}
        <ImageUpload 
          selectedImages={selectedImages} 
          onImagesSelect={setSelectedImages} 
        />

        {/* Model Selector */}
        <div className="max-w-md mx-auto text-left space-y-2">
          <label className="text-sm font-medium text-foreground">AI মডেল নির্বাচন করুন</label>
          <Select value={selectedModel} onValueChange={handleModelChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="মডেল বেছে নিন" />
            </SelectTrigger>
            <SelectContent>
              {GEMINI_MODEL_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label} — {option.hint}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            নির্বাচিত মডেল প্রথমে চলবে; লিমিট/ক্রেডিট শেষ হলে স্বয়ংক্রিয়ভাবে পরের মডেলে সুইচ হবে।
          </p>
        </div>

        {/* Generate Button */}
        {selectedImages.length > 0 && hasValidKey && (
          <div className="text-center space-y-4">

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Button
                variant="brand"
                size="lg"
                onClick={handleGenerate}
                disabled={loading}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Generating Metadata...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Generate Metadata
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                asChild
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg border-brand-primary/20 text-brand-primary hover:bg-brand-primary/10"
              >
                <a 
                  href="https://ai.google.dev/gemini-api/docs/api-key" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Get API Key
                </a>
              </Button>
            </div>
            
            {/* Overall Progress Bar */}
            {(loading || processingProgress > 0) && (
              <div className="max-w-md mx-auto space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Processing Images</span>
                  <span className="text-brand-primary font-medium">{Math.round(processingProgress)}%</span>
                </div>
                <Progress value={processingProgress} className="h-3" />
                <p className="text-sm text-center text-muted-foreground">
                  {Math.floor((processingProgress / 100) * selectedImages.length)} of {selectedImages.length} images completed
                </p>
              </div>
            )}
          </div>
        )}

        {/* Platform-Specific CSV Export */}
        {results.some(r => !r.processing && !r.failed && r.title.trim() && r.description.trim() && r.keywords.length > 0) && (
          <div className="py-4 sm:py-6">
            <PlatformSpecificExport results={results} />
          </div>
        )}

        {/* Results */}
        {(results.length > 0 || loading) && (
          <div className="space-y-8 sm:space-y-12">
            {results.map((result, index) => (
              <ImageWithMetadata
                key={`${result.image.name}-${result.image.size}-${index}`}
                image={result.image}
                title={result.title}
                titleScore={result.titleScore}
                alternativeTitles={result.alternativeTitles}
                alternativeTitleScores={result.alternativeTitleScores}
                description={result.description}
                keywords={result.keywords}
                category={result.category}
                index={index}
                onRegenerate={() => handleSingleRegenerate(result.image, index)}
                onMetadataUpdate={(updatedData) => handleMetadataUpdate(index, updatedData)}
                processing={result.processing}
                selectedTitleIndex={result.selectedTitleIndex || 0}
                failed={result.failed}
                errorMessage={result.errorMessage}
              />
            ))}
            {loading && (
              <div className="text-center py-6 sm:py-8">
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm sm:text-base text-muted-foreground">Generating metadata...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-muted/30 border-t mt-12 sm:mt-20">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm sm:text-base text-muted-foreground text-center sm:text-left">
              Made with ❤️ using Google Gemini AI | 
              <span className="block sm:inline ml-0 sm:ml-2 text-brand-primary font-medium">Microstock Metadata Generator</span>
            </p>
            <div className="flex items-center gap-4 text-sm">
              <Link to="/privacy" className="text-muted-foreground hover:text-brand-primary transition-colors">
                Privacy Policy
              </Link>
              <span className="text-muted-foreground/50">|</span>
              <Link to="/contact" className="text-muted-foreground hover:text-brand-primary transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'AI Microstock Image Metadata Generator | Titles, Keywords & CSV' },
      { name: 'description', content: 'Generate SEO-optimized titles, descriptions and 50 keywords for microstock photos with Gemini AI, then export platform-ready CSV files.' },
      { property: 'og:title', content: 'AI Microstock Image Metadata Generator | Titles, Keywords & CSV' },
      { property: 'og:description', content: 'Generate SEO-optimized titles, descriptions and 50 keywords for microstock photos with Gemini AI, then export platform-ready CSV files.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: Index,
});
