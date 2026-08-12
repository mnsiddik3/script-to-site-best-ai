import { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, Image as ImageIcon, Video, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';


const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const VideoAwareThumbnail = ({ file, index, isVideo, onRemove }: {
  file: File; index: number; isVideo: boolean; onRemove: (i: number) => void;
}) => {
  const [duration, setDuration] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileUrl = URL.createObjectURL(file);

  useEffect(() => {
    if (isVideo) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        setDuration(formatDuration(video.duration));
        URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(file);
    }
  }, [file, isVideo]);

  return (
    <div className="relative group">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-lg overflow-hidden shadow-lg">
        {isVideo ? (
          <video
            ref={videoRef}
            src={fileUrl}
            className="w-full h-full object-cover"
            muted
            onLoadedData={() => {
              setTimeout(() => { try { URL.revokeObjectURL(fileUrl); } catch {} }, 100);
            }}
          />
        ) : (
          <img
            src={fileUrl}
            alt={`Selected ${index + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            onLoad={() => {
              setTimeout(() => { try { URL.revokeObjectURL(fileUrl); } catch {} }, 100);
            }}
          />
        )}
        {isVideo && (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5" />
              </div>
            </div>
            {duration && (
              <div className="absolute bottom-1 right-1 bg-black/70 rounded px-1.5 py-0.5 text-[10px] sm:text-xs text-white font-medium">
                {duration}
              </div>
            )}
          </>
        )}
        <Button variant="destructive" size="icon" className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onRemove(index)}>
          <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </Button>
      </div>
      <div className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1">
        <p className="text-xs text-muted-foreground truncate max-w-full" title={file.name}>
          {file.name}
        </p>
        <div className="text-xs text-muted-foreground/70 space-y-0.5 hidden sm:block">
          <div>Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</div>
          <div>Type: {file.type.split('/')[1]?.toUpperCase()}</div>
        </div>
      </div>
    </div>
  );
};

interface ImageUploadProps {
  onImagesSelect: (files: File[]) => void;
  selectedImages: File[];
}
export const ImageUpload = ({
  onImagesSelect,
  selectedImages
}: ImageUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const mediaFiles = files.filter(file => 
      (file.type.startsWith('image/') && file.size <= 60 * 1024 * 1024) ||
      (file.type.startsWith('video/') && file.size <= 100 * 1024 * 1024)
    ).slice(0, 100);
    if (mediaFiles.length > 0) {
      onImagesSelect([...selectedImages, ...mediaFiles].slice(0, 100));
    }
  }, [onImagesSelect, selectedImages]);
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    try {
      const files = e.target.files ? Array.from(e.target.files) : [];
      const maxSize = type === 'video' ? 100 * 1024 * 1024 : 60 * 1024 * 1024;
      const mediaFiles = files.filter(file => {
        if (!file.type.startsWith(`${type}/`)) return false;
        if (file.size > maxSize) return false;
        return true;
      }).slice(0, 100);
      
      if (mediaFiles.length > 0) {
        onImagesSelect([...selectedImages, ...mediaFiles].slice(0, 100));
      }
      
      e.target.value = '';
    } catch (error) {
      console.error('Error handling file input:', error);
    }
  }, [onImagesSelect, selectedImages]);
  const removeImage = useCallback((index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    onImagesSelect(newImages);
  }, [selectedImages, onImagesSelect]);
  return <Card className="p-4 sm:p-6 lg:p-8">
      <div className={`relative border-2 border-dashed rounded-lg p-6 sm:p-8 lg:p-12 text-center transition-all duration-300 ${isDragOver ? 'border-brand-primary bg-brand-primary/5 scale-105' : 'border-muted-foreground/25 hover:border-brand-primary/50'}`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
        {selectedImages.length > 0 ? <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                {selectedImages.length} Files Selected
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedImages.length >= 100 ? 'Maximum 100 files reached' : `You can add ${100 - selectedImages.length} more files`}
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 max-h-80 sm:max-h-96 overflow-y-auto">
              {selectedImages.map((file, index) => {
                const isVideo = file.type.startsWith('video/');
                return (
                  <VideoAwareThumbnail
                    key={`${file.name}-${file.size}-${index}`}
                    file={file}
                    index={index}
                    isVideo={isVideo}
                    onRemove={removeImage}
                  />
                );
              })}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="brandOutline" size="sm" onClick={() => document.getElementById('file-input-image')?.click()} disabled={selectedImages.length >= 100} className="w-full sm:w-auto">
                <ImageIcon className="w-4 h-4 mr-1" />
                Add Images
              </Button>
              <Button variant="brandOutline" size="sm" onClick={() => document.getElementById('file-input-video')?.click()} disabled={selectedImages.length >= 100} className="w-full sm:w-auto">
                <Video className="w-4 h-4 mr-1" />
                Add Videos
              </Button>
              <Button variant="outline" size="sm" onClick={() => onImagesSelect([])} className="w-full sm:w-auto">
                Clear All
              </Button>
            </div>
          </div> : <div className="space-y-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gradient-primary rounded-full flex items-center justify-center animate-float">
              <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                Upload Your Files
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">Drag and drop or click to select up to 100 microstock images or videos</p>
              <p className="text-xs text-muted-foreground mt-1">Images: PNG, JPG, JPEG (Max 60MB) | Videos: MP4, MOV, AVI (Max 100MB)</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="brand" onClick={() => document.getElementById('file-input-image')?.click()} className="w-full sm:w-auto">
                <ImageIcon className="w-4 h-4 mr-2" />
                Select Images
              </Button>
              <Button variant="brandSecondary" onClick={() => document.getElementById('file-input-video')?.click()} className="w-full sm:w-auto">
                <Video className="w-4 h-4 mr-2" />
                Select Videos
              </Button>
            </div>
          </div>}
        
        <input id="file-input-image" type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileInput(e, 'image')} />
        <input id="file-input-video" type="file" accept="video/mp4,video/quicktime,video/x-msvideo,video/webm" multiple className="hidden" onChange={(e) => handleFileInput(e, 'video')} />
      </div>
    </Card>;
};