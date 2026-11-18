import React, { useState, useRef } from 'react';
import {
  Search,
  Globe,
  FileText,
  Camera,
  UploadCloud,
  ArrowRight,
  Loader2,
  Info,
  X,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import PresetSelector from './PresetSelector';

export default function ClaimInputForm({ onSubmit, isLoading }) {
  const [inputMode, setInputMode] = useState('headline'); // 'headline' | 'text' | 'url' | 'image'
  const [inputText, setInputText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [showPresets, setShowPresets] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (inputMode === 'image') {
      if (!imageFile) return;
      onSubmit({
        originalInput: caption.trim() || '',
        inputType: 'image',
        imageFile,
        caption: caption.trim()
      });
    } else {
      if (!inputText.trim()) return;
      onSubmit({
        originalInput: inputText.trim(),
        inputType: inputMode
      });
    }
  };

  const handleSelectPreset = (preset) => {
    setInputMode(preset.inputType || 'headline');

    if (preset.inputType === 'image') {
      setCaption(preset.text);
      setInputText(preset.text);
      // Generate synthetic benchmark image canvas file if no file selected yet
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      // Create editorial benchmark test banner
      ctx.fillStyle = '#F28A45';
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('TruthLens Media Benchmark Fixture', 20, 150);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], preset.imageFixtureName || 'wildfire_smoke.jpg', { type: 'image/jpeg' });
          setImageFile(file);
          setImagePreview(canvas.toDataURL());
        }
      }, 'image/jpeg');
    } else {
      setInputText(preset.text);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Only JPG, JPEG, PNG, and WebP images are supported.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert('Image file size cannot exceed 20MB.');
      return;
    }

    // Client-side auto-optimization: downscale high-res mobile photos to max 1200px for instant cloud upload & inference
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDim = 1200;
      let { width, height } = img;
      
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          setImageFile(optimizedFile);
          setImagePreview(canvas.toDataURL('image/jpeg', 0.88));
        } else {
          setImageFile(file);
          setImagePreview(canvas.toDataURL());
        }
      }, 'image/jpeg', 0.88);
    };
    img.onerror = () => {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result);
      reader.readAsDataURL(file);
    };
    img.src = objectUrl;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const placeholders = {
    headline: 'Paste a news headline, social media post, or factual assertion to verify...',
    text: 'Paste a multi-paragraph article, press release, or long text. Each claim will be extracted and audited independently...',
    url: 'Enter article or news URL (e.g. https://apnews.com/article/...) with automated SSRF & redirect defense...'
  };

  return (
    <div className="bg-surface rounded-2xl border border-slate-border shadow-editorial p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      {/* Input Type Selector Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-5 gap-3">
        <div className="grid grid-cols-2 sm:flex sm:flex-row p-1 bg-slate-100 rounded-xl text-xs font-semibold gap-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setInputMode('headline')}
            className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg transition-all ${inputMode === 'headline'
                ? 'bg-surface text-brand-blue shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Headline / Claim</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode('text')}
            className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg transition-all ${inputMode === 'text'
                ? 'bg-surface text-brand-blue shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Article Text</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode('url')}
            className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg transition-all ${inputMode === 'url'
                ? 'bg-surface text-brand-blue shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Article URL</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode('image')}
            className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg transition-all ${inputMode === 'image'
                ? 'bg-surface text-brand-orange shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Image Forensics</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className="text-xs font-bold text-brand-blue hover:text-blue-700 transition-colors self-end sm:self-center"
        >
          {showPresets ? 'Hide Benchmark Presets' : 'Show Benchmark Presets'}
        </button>
      </div>

      {/* Preset Selector */}
      {showPresets && (
        <PresetSelector onSelect={handleSelectPreset} disabled={isLoading} />
      )}

      {/* Verification Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {inputMode === 'image' ? (
          /* Image Upload Viewport */
          <div className="space-y-4">
            {!imagePreview ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragActive
                    ? 'border-brand-orange bg-orange-50/50'
                    : 'border-slate-border hover:border-slate-400 bg-canvas/30'
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center mx-auto mb-3 border border-orange-100">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h4 className="font-heading font-bold text-sm text-slate-main">
                  Click to upload or drag &amp; drop image
                </h4>
                <p className="text-xs text-slate-muted mt-1">
                  Supports JPG, PNG, and WebP (Up to 10MB). Protected against code execution.
                </p>
                <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-500">
                  <span>OCR Text Extraction</span> &bull; <span>EXIF Provenance</span> &bull; <span>Reverse-Search Recycling Audit</span>
                </div>
              </div>
            ) : (
              /* Image Selected Preview */
              <div className="relative bg-canvas/50 border border-slate-border rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-36 h-28 shrink-0 rounded-lg overflow-hidden border border-slate-border bg-slate-100 flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Uploaded media"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-1 right-1 p-1 bg-white/90 hover:bg-white text-slate-700 rounded-full border border-slate-200 shadow-xs transition-colors"
                    title="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-heading font-bold text-sm text-slate-800 truncate">
                      {imageFile?.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    File size: {imageFile ? Math.round(imageFile.size / 1024) : 0} KB &bull; Format: {imageFile?.type}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Image binary validated in-memory. Zero persistent disk leakage.
                  </p>
                </div>
              </div>
            )}

            {/* Accompanying Caption / Claim Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Accompanying News Headline or Claim (Optional / Auto-Extracted)
                </label>
                <span className="text-[11px] text-brand-blue font-semibold">
                  Vision AI scans overlay text
                </span>
              </div>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Leave blank to auto-detect text from image, or enter headline (e.g. Dhoni Retirement Buzz | IPL 2025)..."
                className="w-full p-3 text-sm bg-canvas/40 border border-slate-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange text-slate-main placeholder-slate-400"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                TruthLens Vision OCR automatically transcribes overlay headlines, breaking news banners, and graphic text.
              </p>
            </div>
          </div>
        ) : (
          /* Text / Headline / URL Input Viewport */
          <div className="relative">
            <textarea
              rows={inputMode === 'headline' ? 3 : inputMode === 'url' ? 2 : 6}
              required
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              placeholder={placeholders[inputMode]}
              className="w-full p-4 text-sm sm:text-base bg-canvas/40 border border-slate-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-slate-main placeholder-slate-400 resize-none transition-all"
            />

            <div className="absolute right-3 bottom-3 flex items-center gap-3">
              <span className="text-[11px] text-slate-400 font-mono">
                {inputText.length} chars
              </span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-2 text-xs text-slate-muted">
            <Info className="w-3.5 h-3.5 text-brand-teal shrink-0" />
            <span>
              {inputMode === 'url'
                ? 'Safe crawler with strict SSRF defense, redirect re-validation, and robots.txt compliance.'
                : inputMode === 'image'
                  ? 'Distinguishes authenticity, manipulation, origin discovery, and recycled miscaptioning.'
                  : 'Dual search over Google Fact Check Tools API and primary web wire archives.'}
            </span>
          </div>

          <button
            type="submit"
            disabled={
              isLoading ||
              (inputMode === 'image' && !imageFile) ||
              (inputMode !== 'image' && inputText.trim().length < 5)
            }
            className={`w-full sm:w-auto px-6 py-3 disabled:opacity-50 text-white font-heading font-extrabold text-sm rounded-xl transition-all shadow-editorial flex items-center justify-center gap-2 shrink-0 ${inputMode === 'image'
                ? 'bg-brand-orange hover:bg-orange-600'
                : 'bg-brand-blue hover:bg-blue-700'
              }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Investigating Evidence...</span>
              </>
            ) : (
              <>
                <span>
                  {inputMode === 'image' ? 'Analyze & Verify Media' : 'Verify Claim'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
