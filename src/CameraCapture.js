import React, { useState, useRef } from 'react';
import axios from 'axios';

function CameraCapture() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [cameraStarted, setCameraStarted] = useState(false); // Track camera start

  const startCamera = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        videoRef.current.srcObject = stream;
        setCameraStarted(true); // Set camera as started
      })
      .catch(err => console.error("error: ", err));
  };

  const takePhoto = () => {
    setLoading(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => sendPhoto(blob), 'image/jpeg');
  };

  const sendPhoto = (blob) => {
    const formData = new FormData();
    formData.append('file', blob);

    axios.post('http://localhost:5000/analyze', formData)
      .then(response => {
        setLoading(false);
        setEmotion(response.data.emotion);
        setAudioUrl(response.data.audioUrl);
      })
      .catch(error => {
        setLoading(false);
        console.error('Error:', error);
      });
  };

  return (
    <div className="container">
      <div className="video-container">
        <video ref={videoRef} autoPlay></video>
      </div>
      {loading && <p className="loading-message">Loading...</p>}
      {!loading && emotion && <div className="emotion-display">Detected Emotion: {emotion}</div>}
      {!loading && audioUrl && (
        <audio controls src={audioUrl} autoPlay />
      )}
      {cameraStarted ? null : (
        <div className="controls">
          <button onClick={startCamera}>Start Camera</button>
        </div>
      )}
      <button onClick={takePhoto} disabled={loading || !cameraStarted}>Take Photo</button>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
}

export default CameraCapture;
