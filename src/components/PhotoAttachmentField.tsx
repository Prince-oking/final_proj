import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Camera, ImagePlus, Trash2, Upload } from 'lucide-react';
import { CameraCaptureModal } from './CameraCaptureModal';

interface PhotoAttachmentFieldProps {
  photoDataUrl?: string;
  photoName?: string;
  onChange: (dataUrl?: string, fileName?: string) => void;
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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-sm font-semibold text-slate-900">
          Photo Evidence <span className="font-normal text-slate-500">(Recommended)</span>
        </label>
        <span className="text-xs text-slate-500">Take a live photo or upload from device</span>
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
        <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
          <div className="aspect-[16/9] max-h-64 w-full bg-slate-100 overflow-hidden">
            <img
              src={photoDataUrl}
              alt={photoName ? `Attached evidence: ${photoName}` : 'Attached issue photo'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-900 truncate">
                {photoName || 'Captured photo evidence'}
              </p>
              <p className="text-xs text-slate-500">Ready to attach to report</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCameraModalOpen(true)}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 whitespace-nowrap"
              >
                <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Retake</span>
              </button>
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={() => onChange(undefined, undefined)}
                aria-label="Remove attached photo"
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 whitespace-nowrap"
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
          className={`border border-dashed rounded-xl p-5 transition-colors ${
            isDragging
              ? 'border-blue-700 bg-blue-50/50'
              : 'border-slate-300 bg-slate-50/70'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                <ImagePlus className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Add a photo of the problem
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Use your camera directly or drag and drop a JPG/PNG image here.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCameraModalOpen(true)}
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 whitespace-nowrap"
              >
                <Camera className="w-4 h-4" aria-hidden="true" />
                <span>Take Photo</span>
              </button>
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 whitespace-nowrap"
              >
                <Upload className="w-4 h-4" aria-hidden="true" />
                <span>Upload Photo</span>
              </button>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2 sm:hidden">
            <span className="text-[11px] text-slate-500">Using a phone?</span>
            <button
              type="button"
              onClick={() => mobileCameraInputRef.current?.click()}
              className="text-xs font-semibold text-blue-800 underline underline-offset-2"
            >
              Open Native Phone Camera
            </button>
          </div>
        </div>
      )}

      {uploadError && (
        <p role="alert" className="text-xs font-medium text-red-700">
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
