from flask import Flask, render_template, Response, jsonify
from flask_cors import CORS
import cv2
import logging
from datetime import datetime
from person_and_phone import detect_phone_and_person  # Add this import
from facemotion import detect_emotion


# Configure logging with timestamps
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, supports_credentials=True, origins="http://localhost:5173")

def get_camera():
    """Initialize camera with error handling"""
    try:
        camera = cv2.VideoCapture(0)
        
        if not camera.isOpened():
            raise RuntimeError("Could not initialize camera")
        return camera
    except Exception as e:
        logger.error(f"Camera initialization failed: {str(e)}")
        raise

detection_history = []
total_frames = 0
phone_detection_count = 0
emotion_counts = {
    'angry': 0,
    'disgust': 0,
    'fear': 0,
    'happy': 0,
    'sad': 0,
    'surprise': 0,
    'neutral': 0
}


def webcam_feed():
    camera = None
    global detection_history, phone_detection_count, emotion_counts, total_frames

    try:
        camera = get_camera()
        while True:
            success, frame = camera.read()
            if not success:
                logger.error("Failed to grab frame")
                break
            total_frames += 1    
            # Process frame with both detections
            processed_frame, phone_results = detect_phone_and_person(frame)
            processed_frame, emotion_results = detect_emotion(processed_frame)
            
            if phone_results or emotion_results:
                # Check phone
                if phone_results:
                    has_phone = any(result['type'] == 'Phone' for result in phone_results)
                    if has_phone:
                        phone_detection_count += 1
                
                # Check emotion
                if emotion_results:
                    current_emotion = emotion_results[0]['emotion'].lower()
                    if current_emotion in emotion_counts:
                        emotion_counts[current_emotion] += 1

                # Store detailed event
                detection_event = {
                    'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    'frame': total_frames,
                    'phone_count': phone_detection_count,
                    'emotion_counts': emotion_counts.copy(),
                    'current_emotion': current_emotion if emotion_results else 'unknown'
                }
                detection_history.append(detection_event)
                logger.info(f"Detection: {detection_event}")
            if emotion_results:
                logger.info(f"Emotion detected: {emotion_results}")
            
                
            # # Display counts on frame
            # y_offset = 30
            # cv2.putText(processed_frame, f"Phones: {phone_detection_count}", 
            #            (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            # for emotion, count in emotion_counts.items():
            #     y_offset += 25
            #     cv2.putText(processed_frame, f"{emotion}: {count}", 
            #                (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
                    
            # Add timestamp
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cv2.putText(processed_frame, timestamp, (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                
            ret, buffer = cv2.imencode('.jpg', processed_frame)
            if not ret:
                logger.error("Failed to encode frame")
                break
                
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                  b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
    except Exception as e:
        logger.error(f"Error in webcam_feed: {str(e)}")
        yield b''
    finally:
        if camera is not None:
            camera.release()

@app.route('/video_feed1')
def video_feed1():
    logger.info("Received request for video_feed1")
    try:
        return Response(
            webcam_feed(),
            mimetype='multipart/x-mixed-replace; boundary=frame'
        )
    except Exception as e:
        logger.error(f"Error in video_feed1: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/test', methods=['GET'])
def test():
    try:
        camera = get_camera()
        camera.release()
        return jsonify({
            "status": "Server is running",
            "camera": "Camera is accessible",
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Test endpoint error: {str(e)}")
        return jsonify({
            "status": "Server is running",
            "camera": f"Camera error: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }), 500
        
        
@app.route('/api/detection-counts', methods=['GET'])
def get_detection_counts():
    try:
        return jsonify({
            "total_frames": total_frames,
            "phone_detections": phone_detection_count,
            "emotion_counts": emotion_counts,
            "detection_history": detection_history,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
    except Exception as e:
        logger.error(f"Error getting detection counts: {str(e)}")
        return jsonify({"error": str(e)}), 500        

if __name__ == '__main__':
    app.run(threaded=True, host="0.0.0.0", port=6500)