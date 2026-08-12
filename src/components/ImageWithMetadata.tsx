import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Copy, Star, Check, Plus, X, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
interface ImageWithMetadataProps {
  image: File;
  title: string;
  titleScore?: number;
  alternativeTitles?: string[];
  alternativeTitleScores?: number[];
  description: string;
  keywords: string[];
  category: string;
  index: number;
  onRegenerate?: () => void;
  onMetadataUpdate?: (updatedData: {
    title: string;
    alternativeTitles?: string[];
    description: string;
    keywords: string[];
    selectedTitleIndex?: number;
  }) => void;
  processing?: boolean;
  progress?: number;
  totalImages?: number;
  selectedTitleIndex?: number;
  failed?: boolean;
  errorMessage?: string;
}
export const ImageWithMetadata = ({
  image,
  title,
  titleScore,
  alternativeTitles,
  alternativeTitleScores,
  description,
  keywords,
  category,
  index,
  onRegenerate,
  onMetadataUpdate,
  processing = false,
  progress = 0,
  totalImages = 1,
  selectedTitleIndex = 0,
  failed = false,
  errorMessage,
}: ImageWithMetadataProps) => {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [topKeywords, setTopKeywords] = useState<string[]>(() => keywords.slice(0, 45));
  const [customKeywordInput, setCustomKeywordInput] = useState('');
  const [editingKeywordIndex, setEditingKeywordIndex] = useState<number | null>(null);
  const [editKeywordValue, setEditKeywordValue] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');

  // Edit states for title, alternative titles, and description
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(title);
  const [editingAltTitle, setEditingAltTitle] = useState<number | null>(null);
  const [editAltTitleValue, setEditAltTitleValue] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [editDescriptionValue, setEditDescriptionValue] = useState(description);
  const {
    toast
  } = useToast();

  // Create image URL when component mounts
  React.useEffect(() => {
    try {
      const url = URL.createObjectURL(image);
      setImageUrl(url);
      return () => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          console.warn('Failed to revoke object URL:', error);
        }
      };
    } catch (error) {
      console.error('Failed to create object URL:', error);
      setImageUrl('');
    }
  }, [image]);

  // Update title and description when props change
  React.useEffect(() => {
    setEditTitleValue(title);
    setEditDescriptionValue(description);
  }, [title, description]);

  // Update top keywords when keywords change
  React.useEffect(() => {
    setTopKeywords(keywords.slice(0, 45));
  }, [keywords]);
  const remainingKeywords = keywords.slice(45);
  const addToTopKeywords = (keyword: string) => {
    if (!topKeywords.includes(keyword)) {
      const newKeywords = [...topKeywords, keyword];
      setTopKeywords(newKeywords);
      onMetadataUpdate?.({
        title: editTitleValue,
        alternativeTitles,
        description: editDescriptionValue,
        keywords: newKeywords
      });
      toast({
        title: "Added!",
        description: `"${keyword}" added to Top Keywords.`
      });
    }
  };
  const addCustomKeywords = () => {
    if (!customKeywordInput.trim()) return;
    const newKeywords = customKeywordInput.split(',').map(k => k.trim()).filter(k => k.length > 0 && !topKeywords.includes(k));
    if (newKeywords.length > 0) {
      const updatedKeywords = [...topKeywords, ...newKeywords];
      setTopKeywords(updatedKeywords);
      setCustomKeywordInput('');
      onMetadataUpdate?.({
        title: editTitleValue,
        alternativeTitles,
        description: editDescriptionValue,
        keywords: updatedKeywords
      });
      toast({
        title: "Keywords Added!",
        description: `${newKeywords.length} keyword(s) added to Top Keywords.`
      });
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addCustomKeywords();
    }
  };
  const deleteKeyword = (keywordIndex: number) => {
    const updatedKeywords = topKeywords.filter((_, index) => index !== keywordIndex);
    setTopKeywords(updatedKeywords);
    onMetadataUpdate?.({
      title: editTitleValue,
      alternativeTitles,
      description: editDescriptionValue,
      keywords: updatedKeywords
    });
    toast({
      title: "Deleted!",
      description: "Keyword removed from Top Keywords."
    });
  };
  const startEditKeyword = (keywordIndex: number) => {
    setEditingKeywordIndex(keywordIndex);
    setEditKeywordValue(topKeywords[keywordIndex]);
  };
  const saveEditKeyword = () => {
    if (editingKeywordIndex !== null && editKeywordValue.trim()) {
      const keywords = editKeywordValue.split(',').map(k => k.trim()).filter(k => k.length > 0);
      const updatedKeywords = [...topKeywords];
      updatedKeywords.splice(editingKeywordIndex, 1, ...keywords);
      setTopKeywords(updatedKeywords);
      setEditingKeywordIndex(null);
      setEditKeywordValue('');
      onMetadataUpdate?.({
        title: editTitleValue,
        alternativeTitles,
        description: editDescriptionValue,
        keywords: updatedKeywords
      });
      toast({
        title: "Updated!",
        description: keywords.length > 1 ? `${keywords.length} keywords added successfully.` : "Keyword updated successfully."
      });
    }
  };
  const cancelEditKeyword = () => {
    setEditingKeywordIndex(null);
    setEditKeywordValue('');
  };
  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEditKeyword();
    } else if (e.key === 'Escape') {
      cancelEditKeyword();
    }
  };

  // Title selection function
  const handleTitleSelection = (titleIndex: number) => {
    onMetadataUpdate?.({
      title: editTitleValue,
      alternativeTitles,
      description: editDescriptionValue,
      keywords: topKeywords,
      selectedTitleIndex: titleIndex
    });
    toast({
      title: "Title Selected",
      description: `Title ${titleIndex === 0 ? 'Primary' : `#${titleIndex}`} selected for CSV export.`
    });
  };

  // Get all available titles
  const allTitles = [title, ...(alternativeTitles || [])];
  
  // Title edit functions
  const startEditTitle = () => {
    setEditingTitle(true);
    setEditTitleValue(title);
  };
  const saveEditTitle = () => {
    if (editTitleValue.trim()) {
      setEditingTitle(false);
      onMetadataUpdate?.({
        title: editTitleValue,
        alternativeTitles,
        description: editDescriptionValue,
        keywords: topKeywords
      });
      toast({
        title: "Updated!",
        description: "Title updated successfully."
      });
    }
  };
  const cancelEditTitle = () => {
    setEditingTitle(false);
    setEditTitleValue(title);
  };

  // Alternative title edit functions
  const startEditAltTitle = (altIndex: number, currentTitle: string) => {
    setEditingAltTitle(altIndex);
    setEditAltTitleValue(currentTitle);
  };
  const saveEditAltTitle = () => {
    if (editAltTitleValue.trim() && editingAltTitle !== null) {
      const updatedAltTitles = [...(alternativeTitles || [])];
      updatedAltTitles[editingAltTitle] = editAltTitleValue.trim();
      
      onMetadataUpdate?.({
        title: editTitleValue,
        alternativeTitles: updatedAltTitles,
        description: editDescriptionValue,
        keywords: topKeywords
      });
      
      setEditingAltTitle(null);
      setEditAltTitleValue('');
      toast({
        title: "Updated!",
        description: "Alternative title updated successfully."
      });
    }
  };
  const cancelEditAltTitle = () => {
    setEditingAltTitle(null);
    setEditAltTitleValue('');
  };

  // Description edit functions
  const startEditDescription = () => {
    setEditingDescription(true);
    setEditDescriptionValue(description);
  };
  const saveEditDescription = () => {
    if (editDescriptionValue.trim()) {
      setEditingDescription(false);
      onMetadataUpdate?.({
        title: editTitleValue,
        alternativeTitles,
        description: editDescriptionValue,
        keywords: topKeywords
      });
      toast({
        title: "Updated!",
        description: "Description updated successfully."
      });
    }
  };
  const cancelEditDescription = () => {
    setEditingDescription(false);
    setEditDescriptionValue(description);
  };
  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditTitle();
    }
  };
  const handleAltTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditAltTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditAltTitle();
    }
  };
  const handleDescriptionKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditDescription();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditDescription();
    }
  };
  const copyToClipboard = (text: string, copyIndex?: string) => {
    navigator.clipboard.writeText(text);
    if (copyIndex !== undefined) {
      setCopiedIndex(copyIndex);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
    toast({
      title: "Copied!",
      description: "Text copied to clipboard."
    });
  };

  // Show loading state for processing
  if (processing) {
    return <div className="space-y-4 sm:space-y-6">
        <Card className="p-4 sm:p-6 bg-gradient-subtle">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 mb-2 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground">Image {index + 1}:</h3>
              <span className="text-lg sm:text-xl font-semibold text-foreground">{image.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(image.name, `filename-${index}`)}
                className="h-6 w-6 shrink-0 ml-1"
                title="Copy file name"
              >
                {copiedIndex === `filename-${index}` ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
            <div className="flex justify-center">
              {imageUrl ? (
                image.type.startsWith('video/') ? (
                  <video src={imageUrl} controls className="max-w-full max-h-64 sm:max-h-80 lg:max-h-96 rounded-lg shadow-lg object-contain" />
                ) : (
                  <img src={imageUrl} alt={`Uploaded image ${index + 1}`} className="max-w-full max-h-64 sm:max-h-80 lg:max-h-96 rounded-lg shadow-lg object-contain" onError={e => {
                    console.error('Image failed to load:', e);
                    e.currentTarget.style.display = 'none';
                  }} />
                )
              ) : <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Media failed to load</p>
                </div>}
            </div>
            <div className="text-center py-3 sm:py-4">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm sm:text-base text-brand-primary font-medium">Processing metadata...</p>
            </div>
          </div>
        </Card>
      </div>;
  }

  if (failed) {
    return <div className="space-y-4 sm:space-y-6">
        <Card className="p-4 sm:p-6 bg-gradient-subtle">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground">Image {index + 1}:</h3>
              <span className="text-lg sm:text-xl font-semibold text-foreground">{image.name}</span>
            </div>
            <div className="flex justify-center">
              {imageUrl ? image.type.startsWith('video/') ? <video src={imageUrl} controls className="max-w-full max-h-64 sm:max-h-80 lg:max-h-96 rounded-lg shadow-lg object-contain" /> : <img src={imageUrl} alt={`Uploaded image ${index + 1}`} className="max-w-full max-h-64 sm:max-h-80 lg:max-h-96 rounded-lg shadow-lg object-contain" /> : <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Media failed to load</p>
                </div>}
            </div>

            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Metadata generation failed</h3>
                <p className="text-sm text-muted-foreground mt-1">{errorMessage || 'Please try again after a short while.'}</p>
              </div>

              {onRegenerate && <Button variant="brandOutline" onClick={onRegenerate} className="gap-2 w-full sm:w-auto">
                  <Copy className="w-4 h-4" />
                  Regenerate Metadata
                </Button>}
            </div>
          </div>
        </Card>
      </div>;
  }

  return <div className="space-y-4 sm:space-y-6">
      {/* Image Display */}
      <Card className="p-4 sm:p-6 bg-gradient-subtle">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 mb-2 sm:mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground">Image {index + 1}:</h3>
            <span className="text-lg sm:text-xl font-semibold text-foreground">{image.name}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(image.name, `filename-${index}`)}
              className="h-6 w-6 shrink-0 ml-1"
              title="Copy file name"
            >
              {copiedIndex === `filename-${index}` ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
          <div className="flex justify-center">
            {imageUrl ? (
              image.type.startsWith('video/') ? (
                <video src={imageUrl} controls className="max-w-full max-h-64 sm:max-h-80 lg:max-h-96 rounded-lg shadow-lg object-contain" />
              ) : (
                <img src={imageUrl} alt={`Uploaded image ${index + 1}`} className="max-w-full max-h-64 sm:max-h-80 lg:max-h-96 rounded-lg shadow-lg object-contain" onError={e => {
                  console.error('Image failed to load:', e);
                  e.currentTarget.style.display = 'none';
                }} />
              )
            ) : <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Media failed to load</p>
              </div>}
            </div>
            
            {/* Category Display */}
            {category && <div className="text-center mt-3 sm:mt-4">
                <Badge variant="outline" className="text-brand-primary border-brand-primary/50 bg-brand-primary/5 px-3 py-1 text-sm font-medium">
                  {category}
                </Badge>
              </div>}
            
            {/* Regenerate Button */}
            {onRegenerate && <div className="flex justify-center mt-3 sm:mt-4">
                <Button variant="brandOutline" onClick={onRegenerate} className="gap-2 w-full sm:w-auto">
                  <Copy className="w-4 h-4" />
                  Regenerate Metadata
                </Button>
              </div>}
        </div>
      </Card>

      {/* Title & Description */}
      <Card className="p-4 sm:p-6 bg-gradient-subtle">
        <div className="space-y-3 sm:space-y-4">
          {/* Title Selection Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">CSV Export এর জন্য টাইটেল সিলেক্ট করুন</h3>
              <Badge variant="outline" className="text-xs bg-brand-primary/10 border-brand-primary/30 text-brand-primary">
                Required for Export
              </Badge>
            </div>
            
            <div className="space-y-3">
              {allTitles.map((titleOption, titleIndex) => {
                // Get SEO score for this title
                const seoScore = titleIndex === 0 
                  ? titleScore 
                  : alternativeTitleScores?.[titleIndex - 1];
                
                // Determine score status
                const getScoreStatus = (score?: number) => {
                  if (!score) return { label: '', variant: 'outline' as const, color: '' };
                  if (score >= 85) return { label: 'Excellent', variant: 'default' as const, color: 'text-green-600' };
                  if (score >= 70) return { label: 'Good', variant: 'secondary' as const, color: 'text-yellow-600' };
                  return { label: 'Needs Work', variant: 'destructive' as const, color: 'text-red-600' };
                };
                
                const scoreStatus = getScoreStatus(seoScore);
                
                return (
                  <div 
                    key={titleIndex} 
                    className={`rounded-lg border p-3 transition-all ${
                      selectedTitleIndex === titleIndex 
                        ? 'border-brand-primary bg-brand-primary/5 ring-2 ring-brand-primary/20' 
                        : 'border-border bg-background'
                    }`}
                  >
                    <div 
                      className="flex items-start gap-3 cursor-pointer"
                      onClick={() => handleTitleSelection(titleIndex)}
                    >
                      <input
                        type="radio"
                        name={`title-selection-${index}`}
                        value={titleIndex}
                        checked={selectedTitleIndex === titleIndex}
                        onChange={() => handleTitleSelection(titleIndex)}
                        className="mt-1 text-brand-primary focus:ring-brand-primary focus:ring-offset-0"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="text-sm font-medium text-foreground cursor-pointer">
                            {titleIndex === 0 ? 'Primary Title' : `Alternative Title ${titleIndex}`}
                          </label>
                          {selectedTitleIndex === titleIndex && (
                            <Badge variant="default" className="text-xs bg-brand-primary text-white">
                              Selected for CSV
                            </Badge>
                          )}
                          {seoScore && (
                            <Badge variant={scoreStatus.variant} className="text-xs">
                              {scoreStatus.label}
                            </Badge>
                          )}
                        </div>
                        
                        {seoScore && (
                          <div className="flex items-center gap-3">
                            <Progress value={seoScore} className="h-2 flex-1" />
                            <span className={`text-sm font-semibold ${scoreStatus.color} min-w-[60px]`}>
                              {seoScore}/100
                            </span>
                          </div>
                        )}
                        
                        <p className="text-sm text-muted-foreground">{titleOption}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(titleOption);
                        }}
                        className="h-8 w-8 shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Primary Adobe Stock Title</h3>
            {editingTitle ? <div className="flex items-center gap-2 bg-muted/20 rounded-md p-2 border border-brand-primary/30">
                <Input value={editTitleValue} onChange={e => setEditTitleValue(e.target.value)} onKeyPress={handleTitleKeyPress} className="flex-1 border-0 bg-transparent focus:ring-1 focus:ring-brand-primary" autoFocus />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30" onClick={saveEditTitle}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30" onClick={cancelEditTitle}>
                  <X className="w-4 h-4" />
                </Button>
              </div> : <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <p className="text-sm sm:text-base text-muted-foreground flex-1 font-medium">{editTitleValue}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={startEditTitle} className="h-8 w-8 shrink-0" title="Edit title">
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(editTitleValue)} className="h-8 w-8 shrink-0">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>}
          </div>

          {/* Alternative Titles */}
          {alternativeTitles && alternativeTitles.length > 0 && <div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Alternative Title Variations</h3>
              <div className="space-y-2">
                {alternativeTitles.map((altTitle, altIndex) => <div key={altIndex}>
                    {editingAltTitle === altIndex ? <div className="flex items-center gap-2 bg-muted/20 rounded-md p-2 border border-brand-primary/30">
                        <span className="text-sm text-brand-primary font-medium">#{altIndex + 1}</span>
                        <Input value={editAltTitleValue} onChange={e => setEditAltTitleValue(e.target.value)} onKeyPress={handleAltTitleKeyPress} className="flex-1 border-0 bg-transparent focus:ring-1 focus:ring-brand-primary" autoFocus />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30" onClick={saveEditAltTitle}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30" onClick={cancelEditAltTitle}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div> : <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <span className="text-sm text-brand-primary font-medium">#{altIndex + 1}</span>
                        <p className="text-sm sm:text-base text-muted-foreground flex-1 font-medium">{altTitle}</p>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => startEditAltTitle(altIndex, altTitle)} className="h-8 w-8 shrink-0" title="Edit alternative title">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => copyToClipboard(altTitle)} className="h-8 w-8 shrink-0">
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>}
                  </div>)}
              </div>
            </div>}
          
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Description</h3>
            {editingDescription ? <div className="flex flex-col gap-2 bg-muted/20 rounded-md p-2 border border-brand-primary/30">
                <Input value={editDescriptionValue} onChange={e => setEditDescriptionValue(e.target.value)} onKeyPress={handleDescriptionKeyPress} className="border-0 bg-transparent focus:ring-1 focus:ring-brand-primary" autoFocus />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30" onClick={saveEditDescription}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30" onClick={cancelEditDescription}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div> : <div className="flex flex-col sm:flex-row items-start gap-2">
                <p className="text-sm sm:text-base text-muted-foreground flex-1">{editDescriptionValue}</p>
                <div className="flex gap-1 mt-1">
                  <Button variant="ghost" size="icon" onClick={startEditDescription} className="h-8 w-8 shrink-0" title="Edit description">
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(editDescriptionValue)} className="h-8 w-8 shrink-0">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>}
          </div>
        </div>
      </Card>

      {/* Keywords */}
      <Card className="p-4 sm:p-6 border-brand-primary/20 bg-gradient-primary/5">
        
        
        {/* Top Keywords - Enhanced */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3">
            <h4 className="text-sm sm:text-md font-medium text-foreground flex items-center gap-2">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-brand-accent fill-current" />
              Top Keywords ({topKeywords.length})
            </h4>
            <Button variant="brand" size="sm" onClick={() => copyToClipboard(topKeywords.join(', '))} className="w-full sm:w-auto text-xs sm:text-sm">
              Copy All Top Keywords
            </Button>
          </div>
           <div className="flex flex-wrap gap-1 sm:gap-2">
            {topKeywords.map((keyword, keywordIndex) => <div key={keywordIndex} className="group relative">
                {editingKeywordIndex === keywordIndex ? <div className="flex items-center gap-1 bg-muted/20 rounded-md p-1 border border-brand-primary/30">
                    <Input value={editKeywordValue} onChange={e => setEditKeywordValue(e.target.value)} onKeyPress={handleEditKeyPress} className="h-6 sm:h-7 px-2 text-xs sm:text-sm w-24 sm:w-32 border-0 bg-transparent focus:ring-1 focus:ring-brand-primary" autoFocus placeholder="keyword1, keyword2" />
                    <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30" onClick={saveEditKeyword}>
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30" onClick={cancelEditKeyword}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div> : <Badge variant="outline" className="border-brand-primary/50 text-brand-primary transition-all duration-300 text-xs sm:text-sm py-1.5 px-3 sm:px-4 flex items-center gap-2 hover:bg-brand-primary hover:text-white hover:border-brand-primary hover:shadow-md cursor-default group-hover:pr-14 sm:group-hover:pr-16">
                    <span className="truncate max-w-[60px] sm:max-w-[80px] md:max-w-none">{keyword}</span>
                    <div className="absolute right-1 sm:right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 flex gap-0.5 sm:gap-1">
                      <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 p-0 rounded-sm hover:scale-110 transition-all duration-200" onClick={() => startEditKeyword(keywordIndex)} title="Edit keyword">
                        <Edit3 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 p-0 rounded-sm hover:scale-110 transition-all duration-200" onClick={() => deleteKeyword(keywordIndex)} title="Delete keyword">
                        <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </Button>
                    </div>
                  </Badge>}
              </div>)}
          </div>
          
          {/* Custom Keyword Input */}
          <div className="mt-4 space-y-2">
            <h5 className="text-sm font-medium text-foreground">Add Custom Keywords</h5>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input placeholder="Enter keywords separated by commas (e.g., nature, beautiful, landscape)" value={customKeywordInput} onChange={e => setCustomKeywordInput(e.target.value)} onKeyPress={handleKeyPress} className="flex-1 text-sm" />
              <Button variant="brandOutline" size="sm" onClick={addCustomKeywords} disabled={!customKeywordInput.trim()} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Additional Keywords with Add Button */}
        {remainingKeywords.length > 0 && <div>
            <h4 className="text-sm sm:text-md font-medium text-foreground mb-3">Additional Keywords</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {remainingKeywords.map((keyword, keywordIndex) => <div key={`remaining-keyword-${keywordIndex}`} className="group p-2 border rounded-lg hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-foreground truncate cursor-pointer flex-1" onClick={() => copyToClipboard(keyword, `additional-${index}-${keywordIndex}`)} title="Click to copy">
                      {keyword}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-brand-accent hover:text-white" onClick={() => addToTopKeywords(keyword)} title="Add to Top Keywords">
                        <Plus className="w-3 h-3" />
                      </Button>
                      {copiedIndex === `additional-${index}-${keywordIndex}` ? <Check className="w-3 h-3 text-brand-accent flex-shrink-0" /> : <Copy className="w-3 h-3 text-muted-foreground group-hover:text-brand-primary flex-shrink-0 cursor-pointer" onClick={() => copyToClipboard(keyword, `additional-${index}-${keywordIndex}`)} />}
                    </div>
                  </div>
                </div>)}
            </div>
          </div>}
      </Card>
    </div>;
};