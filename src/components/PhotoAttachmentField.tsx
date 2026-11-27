import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Camera, ImagePlus, Trash2, Upload } from 'lucide-react';
import { CameraCaptureModal } from './CameraCaptureModal';

interface PhotoAttachmentFieldProps {
  photoDataUrl?: string;
  photoName?: string;
  onChange: (dataUrl?: string, fileName?: string) => void;
  label?: string;
  optionalLabel?: string;
  helperText?: string;
  promptTitle?: string;
  promptSubtitle?: string;
  readySubtitle?: string;
  compact?: boolean;
}

async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        reject(new Error('Selected image appears empty.'));
        return;
      }

      const img = new Image();
      img.onerror = () => resolve(result);
      img.onload = () => {
        const maxDim = 1200;
        const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
        const targetW = Math.max(1, Math.round(img.width * ratio));
        const targetH = Math.max(1, Math.round(img.height * ratio));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

export function PhotoAttachmentField({
  photoDataUrl,
  photoName,
  onChange,
  label = 'Photo Evidence',
  optionalLabel = '(Recommended)',
  helperText = 'Take a live photo or upload from device',
  promptTitle = 'Add a photo of the problem',
  promptSubtitle = 'Use your camera directly or drag and drop a JPG/PNG image here.',
  readySubtitle = 'Ready to attach',
  compact = false,
}: PhotoAttachmentFieldProps) {
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);

  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFile = async (file?: File) => {
    if (!file) return;
    setUploadError('');

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (JPG, PNG, or WebP).');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setUploadError('Image exceeds 12 MB. Please choose a smaller photo.');
      return;
    }

    try {
      const compressed = await compressImageFile(file);
      onChange(compressed, file.name);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Unable to process this image.',
      );
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    void handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    void handleFile(file);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA]">
          {label}{' '}
          {optionalLabel && (
            <span className="font-normal text-[#565A51] dark:text-[#B4B9AE]">{optionalLabel}</span>
          )}
        </label>
        {!compact && <span className="text-xs text-[#565A51] dark:text-[#B4B9AE]">{helperText}</span>}
      </div>

      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="sr-only"
        aria-label="Upload photo file"
      />
      <input
        ref={mobileCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="sr-only"
        aria-label="Capture photo with device camera"
      />

      {photoDataUrl ? (
        <div className="border border-[#1F241D]/15 dark:border-white/15 rounded-2xl bg-white dark:bg-[#1C221B] overflow-hidden">
          <div
            className={`w-full bg-[#1E241E] overflow-hidden ${
              compact ? 'max-h-44 aspect-[16/10]' : 'aspect-[16/9] max-h-64'
            }`}
          >
            <img
              src={photoDataUrl}
              alt={photoName ? `Attached photo: ${photoName}` : 'Attached photo'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#1F241D]/10 dark:border-white/10 bg-[#ECE9E2] dark:bg-[#252C24]">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1F241D] dark:text-[#F2F0EA] truncate">
                {photoName || 'Captured photo'}
              </p>
              <p className="text-xs text-[#565A51] dark:text-[#B4B9AE]">{readySubtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCameraModalOpen(true)}
                className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] border border-[#1F241D]/20 dark:border-white/15 bg-white dark:bg-[#1C221B] hover:bg-[#1E241E] dark:hover:bg-[#8D1B22] hover:text-white transition-colors whitespace-nowrap"
              >
                <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Retake</span>
              </button>
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] border border-[#1F241D]/20 dark:border-white/15 bg-white dark:bg-[#1C221B] hover:bg-[#1E241E] dark:hover:bg-[#8D1B22] hover:text-white transition-colors whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={() => onChange(undefined, undefined)}
                aria-label="Remove attached photo"
                className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#8D1B22] dark:text-[#FAD2D4] border border-[#8D1B22]/40 dark:border-[#E5989B]/40 bg-red-50 dark:bg-[#3A1719] hover:bg-[#8D1B22] hover:text-white transition-colors whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border border-dashed rounded-2xl transition-colors ${
            compact ? 'p-3.5' : 'p-5'
          } ${
            isDragging
              ? 'border-[#8D1B22] dark:border-[#E5989B] bg-red-50/40 dark:bg-[#3A1719]/50'
              : 'border-[#1F241D]/20 dark:border-white/20 bg-[#F5F3EE]/50 dark:bg-[#141814]'
          }`}
        >
          <div
            className={`flex gap-3 ${
              compact
                ? 'flex-col'
                : 'flex-col sm:flex-row sm:items-center sm:justify-between'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`${
                  compact ? 'w-9 h-9' : 'w-10 h-10'
                } rounded-xl bg-[#ECE9E2] dark:bg-[#252C24] border border-[#1F241D]/12 dark:border-white/12 flex items-center justify-center text-[#1F241D] dark:text-[#F2F0EA] shrink-0`}
              >
                <ImagePlus className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#1F241D] dark:text-[#F2F0EA]">
                  {promptTitle}
                </p>
                <p className="text-xs text-[#565A51] dark:text-[#B4B9AE] mt-0.5 leading-relaxed">
                  {promptSubtitle}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCameraModalOpen(true)}
                className={`${
                  compact ? 'min-h-[38px] px-3.5 py-1.5' : 'min-h-[42px] px-4 py-2'
                } rounded-full inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-[#1E241E] dark:bg-[#8D1B22] hover:bg-[#2B332B] dark:hover:bg-[#701319] transition-colors whitespace-nowrap`}
              >
                <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Take Photo</span>
              </button>
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className={`${
                  compact ? 'min-h-[38px] px-3.5 py-1.5' : 'min-h-[42px] px-4 py-2'
                } rounded-full inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] border border-[#1F241D]/20 dark:border-white/15 bg-white dark:bg-[#1C221B] hover:bg-[#1E241E] dark:hover:bg-[#252C24] hover:text-white transition-colors whitespace-nowrap`}
              >
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Upload Photo</span>
              </button>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#1F241D]/10 dark:border-white/10 flex items-center justify-between gap-2 sm:hidden">
            <span className="text-[11px] text-[#565A51] dark:text-[#B4B9AE]">Using a phone?</span>
            <button
              type="button"
              onClick={() => mobileCameraInputRef.current?.click()}
              className="text-xs font-bold text-[#8D1B22] dark:text-[#E5989B] underline underline-offset-2"
            >
              Open Native Phone Camera
            </button>
          </div>
        </div>
      )}

      {uploadError && (
        <p role="alert" className="text-xs font-bold text-[#8D1B22] dark:text-[#E5989B]">
          {uploadError}
        </p>
      )}

      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(dataUrl, name) => onChange(dataUrl, name)}
        onFallbackUpload={() => uploadInputRef.current?.click()}
      />
    </div>
  );
}
