import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, RotateCcw, Upload, X } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string, fileName: string) => void;
  onFallbackUpload: () => void;
}

export function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  onFallbackUpload,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraState, setCameraState] = useState<
    'starting' | 'ready' | 'captured' | 'error'
  >('starting');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [capturedUrl, setCapturedUrl] = useState<string>('');

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(
    async (mode: 'environment' | 'user') => {
      stopStream();
      setCapturedUrl('');
      setCameraState('starting');
      setErrorMessage('');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraState('error');
        setErrorMessage(
          'Live camera access is unavailable in this browser context. You can upload a photo from your device instead.',
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraState('ready');
      } catch (err) {
        const message =
          err instanceof Error && err.name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow camera access in your browser settings or upload a photo file instead.'
            : 'No active camera device was detected. You can upload an existing photo from your device.';
        setCameraState('error');
        setErrorMessage(message);
      }
    },
    [stopStream],
  );

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      setCapturedUrl('');
      return;
    }
    void startCamera(facingMode);
    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, startCamera, stopStream]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTakeSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const maxW = 1200;
    const scale = width > maxW ? maxW / width : 1;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
    setCapturedUrl(dataUrl);
    setCameraState('captured');
    stopStream();
  };

  const handleRetake = () => {
    void startCamera(facingMode);
  };

  const handleUsePhoto = () => {
    if (!capturedUrl) return;
    const stamp = new Date().toISOString().slice(0, 10);
    onCapture(capturedUrl, `camera_capture_${stamp}.jpg`);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E241E]/75 dark:bg-black/75 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-xl bg-[#F5F3EE] dark:bg-[#1C221B] border border-[#1F241D]/20 dark:border-white/15 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-[#1E241E] dark:bg-[#141814] text-[#F5F3EE] dark:border-b dark:border-white/10">
          <div>
            <h2
              id="camera-modal-title"
              className="font-display text-lg font-bold tracking-tight"
            >
              Take Issue Photo
            </h2>
            <p className="text-xs text-[#A9ADA3] mt-0.5">
              Capture a clear photo of the street, streetlight, drainage, or waste concern.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close camera modal"
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center text-[#F5F3EE] hover:text-[#E5989B] transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative aspect-[4/3] w-full bg-[#1E241E] border border-[#1F241D]/20 dark:border-white/15 rounded-xl overflow-hidden flex items-center justify-center">
            {cameraState === 'captured' && capturedUrl ? (
              <img
                src={capturedUrl}
                alt="Captured issue preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`w-full h-full object-cover ${
                  cameraState === 'ready' ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}

            {cameraState === 'starting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6 text-center">
                <Camera className="w-8 h-8 mb-2 opacity-80" aria-hidden="true" />
                <p className="text-sm font-medium">Starting camera preview...</p>
              </div>
            )}

            {cameraState === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1E241E] text-white px-6 text-center">
                <Camera className="w-9 h-9 mb-3 text-[#A9ADA3]" aria-hidden="true" />
                <p className="font-display text-xl font-bold">
                  Camera Unavailable
                </p>
                <p className="text-xs text-[#D2D4CC] mt-1.5 max-w-sm leading-relaxed">
                  {errorMessage}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onFallbackUpload();
                  }}
                  className="editorial-btn mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[#8D1B22] text-white hover:bg-[#701319]"
                >
                  <Upload className="w-4 h-4" aria-hidden="true" />
                  <span>Upload Photo File Instead</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {cameraState === 'ready' && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'))
                  }
                  className="editorial-btn min-h-[44px] inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] border border-[#1F241D]/20 dark:border-white/15 bg-white dark:bg-[#252C24] hover:bg-[#1E241E] dark:hover:bg-[#2F372E] hover:text-white whitespace-nowrap"
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  <span>Switch Camera</span>
                </button>
                <button
                  type="button"
                  onClick={handleTakeSnapshot}
                  className="editorial-btn min-h-[44px] inline-flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#8D1B22] hover:bg-[#701319] whitespace-nowrap"
                >
                  <Camera className="w-4 h-4" aria-hidden="true" />
                  <span>Capture Photo</span>
                </button>
              </>
            )}

            {cameraState === 'captured' && (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="editorial-btn min-h-[44px] inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] border border-[#1F241D]/20 dark:border-white/15 bg-white dark:bg-[#252C24] hover:bg-[#1E241E] dark:hover:bg-[#2F372E] hover:text-white whitespace-nowrap"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  <span>Retake</span>
                </button>
                <button
                  type="button"
                  onClick={handleUsePhoto}
                  className="editorial-btn min-h-[44px] inline-flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#8D1B22] hover:bg-[#701319] whitespace-nowrap"
                >
                  <span>Use This Photo</span>
                </button>
              </>
            )}

            {(cameraState === 'starting' || cameraState === 'error') && (
              <div className="w-full flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="editorial-btn min-h-[44px] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] border border-[#1F241D]/20 dark:border-white/15 bg-white dark:bg-[#252C24] hover:bg-[#1E241E] dark:hover:bg-[#2F372E] hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
