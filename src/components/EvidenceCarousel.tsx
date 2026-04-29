"use client";

import { TrendPost } from "@/lib/decayEngine";
import { Copy, Heart, MessageCircle, Repeat2, Share } from "lucide-react";
import { motion } from "framer-motion";

export default function EvidenceCarousel({ posts }: { posts: TrendPost[] }) {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Copy className="w-5 h-5 text-neon-blue" />
                Visual Evidence
            </h2>

            <div className="overflow-x-auto pb-6 scrollbar-hide flex gap-4 snap-x">
                {posts.map((post) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="min-w-[300px] md:min-w-[400px] p-4 rounded-xl bg-surface-1/50 border border-white/10 backdrop-blur-md snap-center flex flex-col gap-3 group hover:border-white/20 transition-colors"
                    >
                        {/* Author User Info */}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-black" />
                            <div>
                                <div className="text-sm font-bold text-white">{post.author}</div>
                                <div className="text-xs text-white/40">{post.handle} • {post.date}</div>
                            </div>
                            {/* Platform Badge */}
                            <span className="ml-auto text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/5 text-white/50">{post.platform}</span>
                        </div>

                        {/* Content */}
                        <p className="text-sm text-white/80 leading-relaxed font-sans">{post.content}</p>

                        {/* Mock Media */}
                        <div className="h-40 w-full rounded-lg bg-black/40 border border-white/5 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-neon-purple/10 to-transparent opacity-50" />
                            <span className="text-xs text-white/20 font-mono">MEDIA_PREVIEW_UNAVAILABLE</span>
                        </div>

                        {/* Metrics */}
                        <div className="flex items-center justify-between text-white/40 text-xs mt-2">
                            <div className="flex items-center gap-1 group-hover:text-pink-500 transition-colors"><Heart className="w-3 h-3" /> {post.likes}</div>
                            <div className="flex items-center gap-1 group-hover:text-green-500 transition-colors"><Repeat2 className="w-3 h-3" /> {post.retweets}</div>
                            <div className="flex items-center gap-1 group-hover:text-blue-500 transition-colors"><MessageCircle className="w-3 h-3" /> Replies</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
