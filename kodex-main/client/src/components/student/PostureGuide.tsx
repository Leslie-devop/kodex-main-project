import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PostureTutorial from "@/components/PostureTutorial";
import { CheckCircle, AlertTriangle, Play, Monitor, Hand, Eye, X, Activity } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface PostureGuideProps {
  autoStart?: boolean;
}

export default function PostureGuide({ autoStart = false }: PostureGuideProps) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [isDetectionActive, setIsDetectionActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [postureStatus, setPostureStatus] = useState<'good' | 'warning' | 'poor'>('good');
  const [postureScore, setPostureScore] = useState(95);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (autoStart && !isDetectionActive) {
      startDetection();
    }
  }, [autoStart]);

  const startDetection = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: "user"
        } 
      });
      setStream(mediaStream);
      setIsDetectionActive(true);
    } catch (err: any) {
      console.error("Camera access failed", err);
      setCameraError(err.message || "Failed to access camera");
      setIsDetectionActive(false);
    }
  };

  useEffect(() => {
    if (isDetectionActive && videoRef.current && stream) {
      const video = videoRef.current;
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play().catch(e => console.error("Video auto-play failed", e));
      };
    }
  }, [isDetectionActive, stream]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDetectionActive) {
      interval = setInterval(() => {
        setPostureScore(prev => {
          const change = Math.floor(Math.random() * 5) - 2;
          const newScore = Math.max(70, Math.min(100, prev + change));
          if (newScore > 90) setPostureStatus('good');
          else if (newScore > 80) setPostureStatus('warning');
          else setPostureStatus('poor');
          return newScore;
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isDetectionActive]);

  const stopDetection = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsDetectionActive(false);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
      <CardHeader className="p-4 pb-2 border-b border-white/5 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-400" />
          <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest">AI POSTURE</CardTitle>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="text-[9px] h-5 border-emerald-500/30 text-emerald-400 px-2">
            {postureScore}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Integrated Feed & Status */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/5 group ring-1 ring-white/5 shadow-inner">
          {isDetectionActive ? (
            <>
              <video 
                ref={videoRef}
                autoPlay 
                muted 
                playsInline 
                className="w-full h-full object-cover"
                onCanPlay={(e) => (e.target as HTMLVideoElement).play()}
              />
              <div className="absolute top-2 left-2">
                <div className="flex items-center gap-1 bg-red-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-lg">
                  <div className="h-0.5 w-0.5 bg-white rounded-full animate-pulse"></div>
                  LIVE
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10 shadow-xl">
                 <span className={`text-[8px] font-black uppercase tracking-widest ${postureStatus === 'good' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {postureStatus === 'good' ? 'OPTIMAL' : 'ADJUSTING'}
                </span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-2 p-4 text-center">
              {cameraError ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <p className="text-[7px] font-black text-red-400 uppercase">ACCESS DENIED</p>
                  <Button variant="ghost" size="sm" className="h-5 text-[7px] uppercase font-bold text-gray-400 hover:text-white" onClick={startDetection}>RETRY</Button>
                </>
              ) : (
                <>
                  <Monitor className="h-5 w-5 text-gray-600" />
                  <p className="text-[7px] font-black text-gray-600 uppercase">STDBY</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Compact Grid of Checks */}
        <div className="grid grid-cols-2 gap-1.5">
          {['Shoulder', 'Head', 'Back', 'Wrist'].map((part) => (
            <div key={part} className="flex items-center justify-between p-1.5 bg-white/[0.02] border border-white/5 rounded-lg">
               <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">{part}</span>
               <CheckCircle className={`h-2.5 w-2.5 ${postureScore > 85 ? 'text-emerald-400' : 'text-amber-400'}`} />
            </div>
          ))}
        </div>

        {/* Action Button - Slender */}
        {!isDetectionActive ? (
          <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-8 text-[8px] font-black uppercase tracking-[0.2em]" onClick={startDetection}>
            <Play className="h-2.5 w-2.5 mr-2" />
            INITIALIZE SCAN
          </Button>
        ) : (
          <Button variant="destructive" className="w-full rounded-xl h-8 text-[8px] font-black uppercase tracking-[0.2em]" onClick={stopDetection}>
            <X className="h-2.5 w-2.5 mr-2" />
            TERMINATE SCAN
          </Button>
        )}
      </CardContent>
      <PostureTutorial isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </Card>
  );
}
