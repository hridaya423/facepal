'use client'
import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Zap, Sparkles } from 'lucide-react';

const FaceDetection = dynamic(() => import('../components/FaceDetection'), { ssr: false });

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-16 px-4 selection:bg-indigo-200">
      <div className="max-w-5xl mx-auto space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 100, 
            damping: 15,
            duration: 0.8 
          }}
          className="text-center mb-12"
        >
          <div className="flex justify-center items-center mb-6">
            <Sparkles 
              className="text-indigo-500 mr-3" 
              size={32} 
              strokeWidth={2.5}
            />
            <h2 className="text-4xl font-extrabold bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              FacePal
            </h2>
            <Zap 
              className="text-purple-500 ml-3" 
              size={32} 
              strokeWidth={2.5}
            />
          </div>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Next.js face recognition project with MediaPipe
          </p>
        </motion.div>

        <AnimatePresence>
          <Suspense 
            fallback={
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex justify-center items-center h-[500px] bg-white/50 backdrop-blur-xl rounded-3xl border-2 border-indigo-100 shadow-2xl"
              >
                <div className="text-xl text-indigo-600 flex items-center space-x-3">
                  <Camera 
                    className="animate-pulse" 
                    size={48} 
                    strokeWidth={1.5} 
                  />
                  <span className="font-semibold">Preparing AI Vision...</span>
                </div>
              </motion.div>
            }
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 120, 
                damping: 20,
                duration: 0.6
              }}
              className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50"
            >
              <FaceDetection />
            </motion.div>
          </Suspense>
        </AnimatePresence>
      </div>
    </div>
  );
}