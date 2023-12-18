from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import boto3
import os
import time

app = Flask(__name__, static_folder='static')
CORS(app)

@app.route('/analyze', methods=['POST'])
def analyze_image():
    if 'file' not in request.files:
        return jsonify(error='No file part'), 400

    file = request.files['file']
    aws_region = 'eu-central-1'

    rekognition_client = boto3.client('rekognition', region_name=aws_region)
    polly_client = boto3.client('polly', region_name=aws_region)

    try:
        response = rekognition_client.detect_faces(
            Image={'Bytes': file.read()},
            Attributes=['ALL']
        )
        emotions = response['FaceDetails'][0]['Emotions']
        primary_emotion = max(emotions, key=lambda x: x['Confidence'])['Type']

        polly_response = polly_client.synthesize_speech(
            Text=f"The primary emotion is {primary_emotion}",
            OutputFormat='mp3',
            VoiceId='Joanna'
        )
        
        # Use the current timestamp as a unique identifier for the audio file
        timestamp = int(time.time())
        audio_filename = f'polly_audio_{timestamp}.mp3'
        audio_filepath = os.path.join(app.static_folder, audio_filename)
        with open(audio_filepath, 'wb') as audio_file:
            audio_file.write(polly_response['AudioStream'].read())
        
        # Construct the unique audio file URL
        audio_url = request.url_root + f'audio/{audio_filename}'

        return jsonify(emotion=primary_emotion, audioUrl=audio_url)
    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route('/audio/<filename>')
def audio(filename):
    return send_from_directory(app.static_folder, filename)

@app.route('/test')
def test():
    access_key = os.getenv('AWS_ACCESS_KEY_ID')
    secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
    return jsonify(
        accessKeySet=bool(access_key),
        secretKeySet=bool(secret_key)
    )

if __name__ == '__main__':
    app.run(debug=True)
