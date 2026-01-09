import React, { useState, useEffect } from 'react';

export default function VirtualTryOn() {
  const [personUrl, setPersonUrl] = useState("");
  const [garmentUrl, setGarmentUrl] = useState("");
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");

  // --- PASTE YOUR RENDER URL HERE ---
  const BACKEND_URL = "https://manual-yolanthe-rtu-cdac-9c6af2a0.koyeb.app/generate-tryon"; 

  useEffect(() => {
    let interval;
    if (loading) {
      setProgress(0);
      setStatusText("Initializing AI...");
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90; 
          return prev + (prev < 50 ? 5 : 1);
        });
      }, 500);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleTryOn = async () => {
    if (!personUrl || !garmentUrl) return alert("Please enter both URLs");
    setLoading(true);
    setResultImage(null);

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personUrl, garmentUrl })
      });
      const data = await response.json();
      
      if (data.success) {
        setProgress(100);
        setStatusText("Complete!");
        setResultImage(data.url);
      } else {
        alert("Error: " + data.error);
        setProgress(0);
      }
    } catch (error) {
      console.error(error);
      alert("Backend connection failed.");
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg max-w-md mx-auto mt-10 bg-white shadow">
      <h2 className="text-xl font-bold mb-4">AI Virtual Try-On</h2>
      
      <div className="space-y-3">
        <input 
          className="w-full p-2 border rounded"
          placeholder="Person Image URL" 
          value={personUrl}
          onChange={(e) => setPersonUrl(e.target.value)}
        />
        <input 
          className="w-full p-2 border rounded"
          placeholder="Garment Image URL" 
          value={garmentUrl}
          onChange={(e) => setGarmentUrl(e.target.value)}
        />
        
        <button 
          onClick={handleTryOn} 
          disabled={loading}
          className={`w-full p-3 rounded text-white font-bold ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? "Generating..." : "Try On Now"}
        </button>
      </div>

      {loading && (
        <div className="mt-4">
          <p className="text-sm text-center text-gray-600 mb-1">{statusText} ({progress}%)</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {resultImage && (
        <div className="mt-6 text-center">
          <h3 className="font-semibold mb-2">Result:</h3>
          <img src={resultImage} alt="Try On" className="w-full rounded border" />
        </div>
      )}
    </div>
  );
}
