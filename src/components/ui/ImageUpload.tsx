import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { uploadFileToStorage, isFirebaseConfigured } from '../../lib/firebase';
import { Button } from './Button';
import { Input } from './Input';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  folder?: string;
  className?: string;
  label?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUploaded,
  folder = 'products',
  className = '',
  label,
}) => {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image file must be under 10MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const downloadUrl = await uploadFileToStorage(file, folder);
      onImageUploaded(downloadUrl);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err?.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleManualUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;
    onImageUploaded(manualUrl.trim());
    setManualUrl('');
  };

  const isConfigured = isFirebaseConfigured();

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
            {label}
          </label>
          <div className="flex items-center gap-1 text-[11px]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConfigured ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            />
            <span className="text-charcoal-400">
              {isConfigured ? 'Firebase Connected' : 'Local Fallback'}
            </span>
          </div>
        </div>
      )}

      {/* Mode Switcher */}
      <div className="flex rounded-xl bg-charcoal-50 p-1 border border-surface-border w-fit text-xs">
        <button
          type="button"
          onClick={() => {
            setMode('upload');
            setError(null);
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
            mode === 'upload'
              ? 'bg-white text-charcoal-900 shadow-soft-sm font-semibold'
              : 'text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Image</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('url');
            setError(null);
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
            mode === 'url'
              ? 'bg-white text-charcoal-900 shadow-soft-sm font-semibold'
              : 'text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Paste Image URL</span>
        </button>
      </div>

      {mode === 'upload' ? (
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-brand-500 bg-brand-50/50 scale-[1.01]'
                : 'border-surface-border hover:border-brand-300 hover:bg-surface-subtle/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
              disabled={isUploading}
            />

            {isUploading ? (
              <div className="flex flex-col items-center justify-center py-2 space-y-2">
                <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
                <p className="text-xs font-semibold text-charcoal-700">
                  Uploading to Firebase Storage...
                </p>
                <p className="text-[11px] text-charcoal-400">Optimizing and storing asset</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-charcoal-800">
                    Click to browse or drag & drop image
                  </p>
                  <p className="text-xs text-charcoal-400 mt-0.5">
                    Supports JPG, PNG, WEBP, GIF up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleManualUrlSubmit} className="flex gap-2">
          <Input
            placeholder="Paste image link (e.g. https://images.unsplash.com/...)"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" size="md">
            Add URL
          </Button>
        </form>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
