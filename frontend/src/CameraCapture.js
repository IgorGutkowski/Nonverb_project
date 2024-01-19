import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function CameraCapture() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [boundingBox, setBoundingBox] = useState(null);
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
      alert('Could not access the camera. Please ensure you have a camera connected and have granted access.');
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !videoRef.current.srcObject) {
      console.error('No video stream found. Please connect a camera.');
      alert('No video stream found. Please connect a camera.');
      return;
    }
    setLoading(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    video.srcObject.getTracks().forEach(track => track.stop());
    setPhotoTaken(true);
    canvas.toBlob(blob => sendPhoto(blob), 'image/jpeg');
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setLoading(true);
      setBoundingBox(null);
      setPhotoTaken(false);
      displayImage(file);
    }
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current.click();
  };

  const sendPhoto = (blob) => {
    const formData = new FormData();
    formData.append('file', blob);

    axios.post('http://localhost:5000/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then(response => {
      if (response.data) {
        setEmotion(response.data.emotion);
        setAudioUrl(response.data.audioUrl);
        setBoundingBox(response.data.boundingBox);
        setPhotoTaken(true);
      } else {
        throw new Error('No data received from server.');
      }
    })
    .catch(error => {
      console.error('Error sending photo:', error);
      alert('Failed to analyze the photo. Please try again.');
    })
    .finally(() => {
      setLoading(false);
    });
  };

  const displayImage = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(blob => sendPhoto(blob), 'image/jpeg');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (photoTaken && boundingBox) {
      drawBoundingBox(boundingBox);
    }
  }, [photoTaken, boundingBox]);

  const drawBoundingBox = (box) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 5;
    ctx.strokeRect(
      box.Left * canvas.width,
      box.Top * canvas.height,
      box.Width * canvas.width,
      box.Height * canvas.height
    );
  };

  const resetCamera = () => {
    if (videoRef.current) {
      const tracks = videoRef.current.srcObject?.getTracks();
      tracks?.forEach(track => track.stop());
    }
    setPhotoTaken(false);
    setBoundingBox(null);
    setEmotion('');
    setAudioUrl('');
    setLoading(false);
    startCamera();
  };

  return (
    <div className="container">
      <div className="camera-feed" style={{ display: !photoTaken ? 'block' : 'none' }}>
        <video ref={videoRef} autoPlay></video>
      </div>
      <div className="camera-capture" style={{ display: photoTaken ? 'block' : 'none' }}>
        <canvas ref={canvasRef}></canvas>
      </div>
      {loading && <p>Loading...</p>}
      {!loading && emotion && <p>Detected Emotion: {emotion}</p>}
      {!loading && audioUrl && <audio controls src={audioUrl} autoPlay />}
      {!photoTaken && (
        <>
          <button onClick={takePhoto}>Take Photo</button>
          <button onClick={handleUploadButtonClick}>Upload Photo</button>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            ref={fileInputRef}
          />
        </>
      )}
      {photoTaken && (
        <button onClick={resetCamera}>Reset Camera</button>
      )}
    </div>
  );
}

export default CameraCapture;
