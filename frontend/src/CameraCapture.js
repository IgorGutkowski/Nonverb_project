import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function CameraCapture() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [boundingBox, setBoundingBox] = useState(null); // To store bounding box data
  const [photoTaken, setPhotoTaken] = useState(false);

  useEffect(() => {
    startCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error starting camera: ", err);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas element is not found.');
      return;
    }

    setLoading(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhotoTaken(true);
    setLoading(false);

    video.srcObject.getTracks().forEach(track => track.stop());

    canvas.toBlob(blob => sendPhoto(blob), 'image/jpeg');
  };

  const sendPhoto = (blob) => {
    const formData = new FormData();
    formData.append('file', blob);

    axios.post('http://localhost:5000/analyze', formData)
      .then(response => {
        setEmotion(response.data.emotion);
        setAudioUrl(response.data.audioUrl);
        setBoundingBox(response.data.boundingBox); // Save the bounding box data
      })
      .catch(error => {
        console.error('Error sending photo:', error);
      });
  };

  useEffect(() => {
    // Draw the bounding box when it's received
    if (boundingBox && photoTaken) {
      drawBoundingBox(boundingBox);
    }
  }, [boundingBox, photoTaken]);

  const drawBoundingBox = (box) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    const x = box.Left * canvas.width;
    const y = box.Top * canvas.height;
    const width = box.Width * canvas.width;
    const height = box.Height * canvas.height;

    context.strokeStyle = 'yellow';
    context.lineWidth = 5;
    context.strokeRect(x, y, width, height);
  };

  const resetCamera = () => {
    setPhotoTaken(false);
    setBoundingBox(null); // Clear the bounding box data
    startCamera();
  };

  return (
    <div className="container">
      <div className="camera-feed" style={{ display: photoTaken ? 'none' : 'block' }}>
        <video ref={videoRef} autoPlay></video>
      </div>
      <div className="camera-capture" style={{ display: photoTaken ? 'block' : 'none' }}>
        <canvas ref={canvasRef}></canvas>
      </div>
      {loading && <p>Loading...</p>}
      {!loading && emotion && <p>Detected Emotion: {emotion}</p>}
      {!loading && audioUrl && <audio controls src={audioUrl} autoPlay />}
      {!photoTaken && (
        <button onClick={takePhoto}>Take Photo</button>
      )}
      {photoTaken && (
        <button onClick={resetCamera}>Reset Camera</button>
      )}
    </div>
  );
}

export default CameraCapture;
