import { useState, useRef, useCallback } from 'react';

export interface VideoRecorderConfig {
  mimeType?: string;
  videoBitsPerSecond?: number;
}

export interface VideoRecorderError {
  type: 'not-supported' | 'stream-error' | 'recording-error' | 'unknown';
  message: string;
}

export interface UseVideoRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  elapsedTime: number;
  error: VideoRecorderError | null;
  isSupported: boolean;
  videoBlob: Blob | null;
  videoUrl: string | null;
  
  startRecording: (stream: MediaStream) => Promise<boolean>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearRecording: () => void;
}

export function useVideoRecorder(config?: VideoRecorderConfig): UseVideoRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<VideoRecorderError | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Check if MediaRecorder is supported
  const isSupported = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm');

  const clearRecording = useCallback(() => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoBlob(null);
    setVideoUrl(null);
    setElapsedTime(0);
    chunksRef.current = [];
  }, [videoUrl]);

  const startRecording = useCallback(async (stream: MediaStream): Promise<boolean> => {
    if (!isSupported) {
      setError({
        type: 'not-supported',
        message: 'Video recording is not supported in your browser. Please try Chrome, Firefox, or Edge.',
      });
      return false;
    }

    try {
      clearRecording();
      setError(null);

      // Determine the best supported mime type
      let mimeType = config?.mimeType || 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }

      const options: MediaRecorderOptions = {
        mimeType,
        videoBitsPerSecond: config?.videoBitsPerSecond || 2500000, // 2.5 Mbps
      };

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setVideoBlob(blob);
        setVideoUrl(url);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError({
          type: 'recording-error',
          message: 'An error occurred during recording. Please try again.',
        });
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;

      // Start elapsed time counter
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000);
        setElapsedTime(elapsed);
      }, 1000);

      return true;
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError({
        type: 'stream-error',
        message: 'Failed to start recording. Please check camera permissions.',
      });
      return false;
    }
  }, [isSupported, config, clearRecording]);

  const stopRecording = useCallback(async (): Promise<void> => {
    if (mediaRecorderRef.current && isRecording) {
      return new Promise((resolve) => {
        const recorder = mediaRecorderRef.current!;
        
        recorder.onstop = () => {
          const mimeType = recorder.mimeType || 'video/webm';
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          setVideoBlob(blob);
          setVideoUrl(url);
          setIsRecording(false);
          setIsPaused(false);
          
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          
          resolve();
        };
        
        recorder.stop();
      });
    }
  }, [isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      const pauseDuration = Date.now() - startTimeRef.current - pausedTimeRef.current - (elapsedTime * 1000);
      pausedTimeRef.current += pauseDuration;
      
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
  }, [isRecording, isPaused, elapsedTime]);

  return {
    isRecording,
    isPaused,
    elapsedTime,
    error,
    isSupported,
    videoBlob,
    videoUrl,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
  };
}
