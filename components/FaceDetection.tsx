import React, { useRef, useState, useEffect, useCallback } from 'react';
import '@mediapipe/face_detection';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle, Camera, Upload } from 'lucide-react';

const FaceDetectionComponent: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detectionCount, setDetectionCount] = useState(0);
  const [mode, setMode] = useState<'webcam' | 'file'>('webcam');
  const detectorRef = useRef<FaceDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null; 
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (detectorRef.current) {
      detectorRef.current.close();
      detectorRef.current = null;
    }
  }, []);

  const initFaceDetection = useCallback(async (imageSource?: HTMLImageElement | HTMLVideoElement) => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      
      const detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
          delegate: "GPU"
        },
        minDetectionConfidence: 0.5,
        minSuppressionThreshold: 0.3,
      });
      
      detectorRef.current = detector;

      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('Cannot get canvas context');
        return;
      }
      
      canvas.width = imageSource ? imageSource.width : 1280;
      canvas.height = imageSource ? imageSource.height : 720;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (imageSource) {
        ctx.drawImage(imageSource, 0, 0, canvas.width, canvas.height);
      }

      const detectionResults = await detectorRef.current.detect(canvas);

      if (detectionResults && detectionResults.detections) {
        const detections = detectionResults.detections;
        setDetectionCount(detections.length);

        for (const detection of detections) {
          if (!detection.boundingBox) continue;

          ctx.beginPath();
          ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)'; 
          ctx.lineWidth = 3;
          ctx.setLineDash([10, 5]); 

          const bbox = detection.boundingBox;
          ctx.strokeRect(
            bbox.originX * canvas.width, 
            bbox.originY * canvas.height, 
            bbox.width * canvas.width, 
            bbox.height * canvas.height
          );
          ctx.setLineDash([]); 

          if (detection.keypoints) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.7)'; 
            for (const point of detection.keypoints) {
              ctx.beginPath();
              ctx.arc(
                point.x * canvas.width, 
                point.y * canvas.height, 
                4, 0, 2 * Math.PI
              );
              ctx.fill();
            }
          }
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Face detection initialization error:', err);
      setError(`Failed to initialize face detection: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  }, []);

  const startWebcam = useCallback(async () => {
    try {
      cleanup();
      setLoading(true);
      setError(null);
      setDetectionCount(0);
      setMode('webcam');

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              setLoading(false);
              resolve();
            };
          }
        });

        const detectFaces = async () => {
          try {
            if (!videoRef.current || !canvasRef.current || !detectorRef.current) {
              animationFrameRef.current = requestAnimationFrame(detectFaces);
              return;
            }

            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            if (video.videoWidth <= 0 || video.videoHeight <= 0) {
              animationFrameRef.current = requestAnimationFrame(detectFaces);
              return;
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              console.error('Cannot get canvas context');
              return;
            }
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const detectionResults = await detectorRef.current.detect(canvas);

            if (detectionResults && detectionResults.detections) {
              const detections = detectionResults.detections;
              setDetectionCount(detections.length);

              for (const detection of detections) {
                if (!detection.boundingBox) continue;

                ctx.beginPath();
                ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)'; 
                ctx.lineWidth = 3;
                ctx.setLineDash([10, 5]); 

                const bbox = detection.boundingBox;
                ctx.strokeRect(
                  bbox.originX * canvas.width, 
                  bbox.originY * canvas.height, 
                  bbox.width * canvas.width, 
                  bbox.height * canvas.height
                );
                ctx.setLineDash([]); 

                if (detection.keypoints) {
                  ctx.fillStyle = 'rgba(239, 68, 68, 0.7)'; 
                  for (const point of detection.keypoints) {
                    ctx.beginPath();
                    ctx.arc(
                      point.x * canvas.width, 
                      point.y * canvas.height, 
                      4, 0, 2 * Math.PI
                    );
                    ctx.fill();
                  }
                }
              }
            }
          } catch (detectionError) {
            console.error('Face detection error:', detectionError);
          }

          animationFrameRef.current = requestAnimationFrame(detectFaces);
        };

        await initFaceDetection();
        animationFrameRef.current = requestAnimationFrame(detectFaces);
      }
    } catch (err) {
      console.error('Webcam initialization error:', err);
      setError(`Failed to start webcam: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  }, [cleanup, initFaceDetection]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      cleanup();
      setLoading(true);
      setError(null);
      setDetectionCount(0);
      setMode('file');

      const file = event.target.files?.[0];
      if (!file) return;

      const img = new Image();
      img.onload = async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = URL.createObjectURL(file);
        }
        
        await initFaceDetection(img);
      };
      img.src = URL.createObjectURL(file);
    } catch (err) {
      console.error('File upload error:', err);
      setError(`Failed to process image: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  }, [cleanup, initFaceDetection]);

  useEffect(() => {
    const initializeOnLoad = async () => {
      await startWebcam();
    };

    initializeOnLoad();

    return () => {
      cleanup();
    };
  }, [startWebcam, cleanup]);

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center items-center h-[500px] bg-red-50 text-red-600 p-6 rounded-3xl shadow-2xl"
      >
        <div className="text-center">
          <AlertCircle className="mx-auto mb-6 text-red-400" size={64} strokeWidth={1.5} />
          <h3 className="text-2xl font-bold mb-4 text-red-700">Oops! Something went wrong</h3>
          <p className="font-medium max-w-md mx-auto">{error}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden">
      {loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex flex-col justify-center items-center"
        >
          <Loader2 className="animate-spin text-indigo-600 mb-4" size={64} strokeWidth={1.5} />
          <p className="text-xl font-semibold text-indigo-800">Initializing AI Vision...</p>
        </motion.div>
      )}
      
      <div className="absolute top-4 left-4 z-20 flex space-x-2">
        <button 
          onClick={startWebcam}
          className={`p-2 rounded-full ${mode === 'webcam' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          <Camera size={24} />
        </button>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className={`p-2 rounded-full ${mode === 'file' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          <Upload size={24} />
        </button>
        <input 
          type="file" 
          ref={fileInputRef}
          accept="image/*"
          className="hidden" 
          onChange={handleFileUpload}
        />
      </div>
      
      <div className="relative w-full aspect-video">
        <video 
          ref={videoRef} 
          muted 
          playsInline 
          className="w-full h-full object-cover transform -scale-x-100 rounded-b-3xl"
        />
        <canvas 
          ref={canvasRef} 
          className="absolute top-0 left-0 w-full h-full pointer-events-none" 
        />
      </div>

      {detectionCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 right-4 bg-green-500/20 text-green-800 px-4 py-2 rounded-full text-base font-semibold flex items-center space-x-2"
        >
          <CheckCircle2 size={20} strokeWidth={2.5} />
          <span>Faces Detected: {detectionCount}</span>
        </motion.div>
      )}
    </div>
  );
};

export default FaceDetectionComponent;