"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Image as ImageIcon, X, Loader2, Sparkles } from "lucide-react";

interface ImageUploadProps {
    onTrendExtracted: (keyword: string) => void;
    disabled?: boolean;
}

export default function ImageUpload({ onTrendExtracted, disabled }: ImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [extractedTrend, setExtractedTrend] = useState<{ keyword: string; description: string; category: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file");
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);

        // Process with vision API
        setIsProcessing(true);
        setError(null);
        setExtractedTrend(null);

        try {
            const formData = new FormData();
            formData.append("image", file);

            const res = await fetch("/api/vision/analyze", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Analysis failed");
            }

            setExtractedTrend({
                keyword: data.keyword,
                description: data.description,
                category: data.category,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to analyze image");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleAnalyze = () => {
        if (extractedTrend) {
            onTrendExtracted(extractedTrend.keyword);
            reset();
        }
    };

    const reset = () => {
        setPreview(null);
        setExtractedTrend(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="relative">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
                disabled={disabled || isProcessing}
            />

            {/* Upload Area or Preview */}
            <AnimatePresence mode="wait">
                {!preview ? (
                    <motion.div
                        key="upload"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            relative cursor-pointer rounded-xl border-2 border-dashed p-6 transition-all
                            ${isDragging
                                ? "border-white bg-white/10"
                                : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
                            }
                        `}
                    >
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className={`p-3 rounded-full ${isDragging ? "bg-white/20" : "bg-white/10"}`}>
                                <Upload className={`w-6 h-6 ${isDragging ? "text-white" : "text-white/50"}`} />
                            </div>
                            <div>
                                <div className="text-white/70 font-medium">
                                    {isDragging ? "Drop image here" : "Upload an image"}
                                </div>
                                <div className="text-xs text-white/40 mt-1">
                                    Screenshot, meme, or trend photo
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative rounded-xl overflow-hidden bg-white/5 border border-white/10"
                    >
                        {/* Close button */}
                        <button
                            onClick={reset}
                            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/50 text-white/70 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Image preview */}
                        <div className="relative h-40 overflow-hidden">
                            <img
                                src={preview}
                                alt="Uploaded"
                                className="w-full h-full object-cover"
                            />
                            {isProcessing && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <div className="text-center">
                                        <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                                        <div className="text-sm text-white/70">Analyzing with AI...</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Extracted Trend */}
                        {extractedTrend && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 border-t border-white/10"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-4 h-4 text-white/70" />
                                    <span className="text-xs text-white/70 font-mono">DETECTED TREND</span>
                                </div>
                                <div className="text-lg font-bold text-white mb-1">{extractedTrend.keyword}</div>
                                <div className="text-xs text-white/50 mb-3">{extractedTrend.description}</div>
                                <button
                                    onClick={handleAnalyze}
                                    disabled={disabled}
                                    className="w-full py-2.5 rounded-lg font-semibold text-black bg-white hover:bg-white/90 transition-all disabled:opacity-50"
                                >
                                    Analyze "{extractedTrend.keyword}"
                                </button>
                            </motion.div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="p-4 border-t border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
