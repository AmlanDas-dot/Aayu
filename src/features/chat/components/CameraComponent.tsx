import { useState, useRef, useEffect } from "react";

interface CameraComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function CameraComponent({ isOpen, onClose, onCapture }: CameraComponentProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const startCamera = async () => {
    setIsInitializing(true);
    setErrorMessage(null);
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Camera access denied. Please enable camera permissions in your browser settings to proceed.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMessage("No camera found on this device.");
      } else {
        setErrorMessage("Unable to access camera. Please check your connections.");
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedDataUrl(null);
      setErrorMessage(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    context.clearRect(0, 0, width, height);
    if (facingMode === "user") {
      context.translate(width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0, width, height);
    if (facingMode === "user") {
      context.setTransform(1, 0, 0, 1, 0, 0);
    }

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedDataUrl(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (!capturedDataUrl) return;
    const fetchBlob = async () => {
      try {
        const response = await fetch(capturedDataUrl);
        const blob = await response.blob();
        const file = new File([blob], `camera_${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
        onClose();
      } catch (e: any) {
        console.error("Error creating image file:", e);
      }
    };
    fetchBlob();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}>
      <div style={{ width: "100%", maxWidth: "540px", background: "#ffffff", borderRadius: "16px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh", border: "1px solid rgba(15, 118, 110, 0.1)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f766e" }}>
            <i className="fa-solid fa-camera" style={{ marginRight: "8px" }}></i>
            Aayu Camera
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#64748b", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", transition: "background 0.2s" }} onMouseOver={(e) => (e.currentTarget.style.background = "#e2e8f0")} onMouseOut={(e) => (e.currentTarget.style.background = "none")}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div style={{ flex: 1, position: "relative", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "320px", overflow: "hidden" }}>
          {errorMessage ? (
            <div style={{ color: "#f87171", padding: "24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: "2.5rem" }}></i>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>{errorMessage}</p>
              <button onClick={startCamera} style={{ marginTop: "8px", padding: "8px 16px", background: "#0f766e", color: "#ffffff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>Retry Camera</button>
            </div>
          ) : capturedDataUrl ? (
            <img src={capturedDataUrl} alt="Captured" style={{ width: "100%", height: "100%", objectFit: "contain", maxHeight: "50vh" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", position: "relative" }}>
              {isInitializing && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", background: "#0f172a", zIndex: 1 }}>
                  <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: "8px" }}></i>
                  Initializing Camera...
                </div>
              )}
              <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: facingMode === "user" ? "scaleX(-1)" : "none", maxHeight: "50vh" }} />
            </div>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div style={{ padding: "16px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
          {errorMessage ? (
            <button onClick={onClose} style={{ padding: "8px 16px", background: "#64748b", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", width: "100%" }}>Close Camera</button>
          ) : capturedDataUrl ? (
            <>
              <button onClick={handleRetake} style={{ padding: "10px 20px", background: "#e2e8f0", color: "#334155", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <i className="fa-solid fa-rotate-left"></i> Retake
              </button>
              <button onClick={handleConfirm} style={{ padding: "10px 24px", background: "#0f766e", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 6px -1px rgba(15, 118, 110, 0.3)" }}>
                <i className="fa-solid fa-check"></i> Use Photo
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} style={{ padding: "10px 20px", background: "#cbd5e1", color: "#334155", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleCapture} disabled={isInitializing} style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#ef4444", border: "4px solid #ffffff", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)", cursor: isInitializing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "1.2rem", transition: "transform 0.2s" }} onMouseOver={(e) => !isInitializing && (e.currentTarget.style.transform = "scale(1.08)")} onMouseOut={(e) => !isInitializing && (e.currentTarget.style.transform = "scale(1)")}>
                <i className="fa-solid fa-camera"></i>
              </button>
              <button onClick={toggleFacingMode} disabled={isInitializing} style={{ padding: "10px 14px", background: "#ffffff", color: "#0f766e", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: 600, cursor: isInitializing ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <i className="fa-solid fa-camera-rotate"></i> Flip
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
