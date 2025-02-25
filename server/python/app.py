from flask import Flask, render_template, Response, jsonify
from flask_cors import CORS
import cv2
import logging
from datetime import datetime
from person_and_phone import detect_phone_and_person  # Add this import
from facemotion import detect_emotion
import sys
import os

# Add the Proctoring-AI folder to Python path
proctoring_ai_path = os.path.join(os.path.dirname(__file__), 'Proctoring-AI')
sys.path.append(proctoring_ai_path)

from eye_tracker import track_eye
from mouth_opening_detector import process_frame, get_face_detector, get_landmark_model
from head_pose_estimation import detect_head_pose


face_model = get_face_detector()
landmark_model = get_landmark_model()

mouth_open_count = 0

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
# phone_detection_count = 0
emotion_counts = {
    'angry': 0,
    'disgust': 0,
    'fear': 0,
    'happy': 0,
    'sad': 0,
    'surprise': 0,
    'neutral': 0
}
phone_detected_count = 0
eye_movement_counts = {
    'looking_left': 0,
    'looking_right': 0,
    'looking_up': 0,
    'looking_normal': 0
}
head_pose_counts = {
    'Head up': 0,
    'Head down': 0,
    'Head left': 0,
    'Head right': 0,
    'Normal': 0
}


def webcam_feed():
    camera = None
    global detection_history, phone_detection_count, emotion_counts, total_frames
    global mouth_open_count, eye_movement_counts, head_pose_counts, phone_detected_count
    try:
        camera = get_camera()
        while True:
            success, frame = camera.read()
            if not success:
                logger.error("Failed to grab frame")
                break
            
            total_frames += 1    
            processed_frame = frame.copy()
            
            try:
                # Process frame with all detections wrapped in try-except
                processed_frame, phone_results = detect_phone_and_person(processed_frame)
                if phone_results and isinstance(phone_results, list) and phone_results[0]:
                    phone_detected_count += 1
            except Exception as e:
                logger.error(f"Phone detection error: {str(e)}")
                phone_results = None
                
            try:
                processed_frame, eye_results = track_eye(processed_frame)
                if eye_results:
                    if eye_results.get('looking_left'):
                        eye_movement_counts['looking_left'] += 1
                    elif eye_results.get('looking_right'):
                        eye_movement_counts['looking_right'] += 1
                    elif eye_results.get('looking_up'):
                        eye_movement_counts['looking_up'] += 1
                    elif eye_results.get('looking_normal'):
                        eye_movement_counts['looking_normal'] += 1
            except Exception as e:
                logger.error(f"Eye tracking error: {str(e)}")
                eye_results = None
                
            try:
                processed_frame, mouth_results = process_frame(processed_frame, face_model, landmark_model)
                if mouth_results is None:
                  mouth_results = {'mouth_open': False, 'confidence': 0.0}
    
                # Only count if we have high confidence
                if mouth_results['mouth_open'] and mouth_results.get('confidence', 0) > 0.5:
                    mouth_open_count += 1
                    logger.debug(f"Mouth open detected at frame {total_frames} with confidence {mouth_results['confidence']}")
            except Exception as e:
                logger.error(f"Mouth detection error: {str(e)}")
                mouth_results = {'mouth_open': False, 'confidence': 0.0}
                
                
            try:
                processed_frame, head_pose_results = detect_head_pose(processed_frame)
                if head_pose_results and head_pose_results.get('direction'):
                    direction = head_pose_results['direction']
                    head_pose_counts[direction] = head_pose_counts.get(direction, 0) + 1
            except Exception as e:
                logger.error(f"Head pose detection error: {str(e)}")
                head_pose_results = None
                
            try:
                processed_frame, emotion_results = detect_emotion(processed_frame)
                # logger.info(f"Emotion detected: {emotion_results}")
                if emotion_results:  # Only update counts if emotion was detected
                   emotion_counts[emotion_results] = emotion_counts.get(emotion_results, 0) + 1
            except Exception as e:
                logger.error(f"Emotion detection error: {str(e)}")
                emotion_results = None
            
            # Update counters only if detection was successful
            if mouth_results and mouth_results['mouth_open']:
                mouth_open_count += 1
            
            # Create detection event if any detection was successful
            if any([phone_results, emotion_results, eye_results,
                   mouth_results['mouth_open'], head_pose_results]):
                detection_event = {
                    'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    'frame': total_frames,
                    'phone_detected_count': phone_detected_count,
                    'emotion_counts': emotion_counts.copy(),
                    'eye_movement_counts': eye_movement_counts.copy(),
                    'head_pose_counts': head_pose_counts.copy(),
                    'current_emotion': emotion_results if emotion_results else None,
                    'eye_tracking': eye_results,
                    'mouth_open': mouth_results['mouth_open'],
                    'mouth_open_count': mouth_open_count,
                    'head_pose': head_pose_results
                }
                detection_history.append(detection_event)
                logger.info(f"Detection: {detection_event}")
            
            if emotion_results:
                logger.info(f"Emotion detected: {emotion_results}")
            
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
            "phone_detected_count": phone_detected_count,
            "emotion_counts": emotion_counts,
            "eye_movement_counts": eye_movement_counts,
            "head_pose_counts": head_pose_counts,
            "mouth_open_count": mouth_open_count,
            "detection_history": detection_history[-10:],  # Only return last 10 events
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
    except Exception as e:
        logger.error(f"Error getting detection counts: {str(e)}")
        return jsonify({"error": str(e)}), 500
    

@app.route('/api/end-interview', methods=['GET'])
def end_interview():
    # Reset all counters
    global total_frames, phone_detected_count, eye_movement_counts
    global head_pose_counts, emotion_counts, mouth_open_count
    try:
        final_results = {
            "total_frames": total_frames,
            "phone_detection": {
                "total_detections": phone_detected_count,
                "percentage": (phone_detected_count / total_frames * 100) if total_frames > 0 else 0
            },
            "eye_movements": {
                "counts": eye_movement_counts,
                "percentages": {k: (v / total_frames * 100) if total_frames > 0 else 0 
                              for k, v in eye_movement_counts.items()}
            },
            "head_pose": {
                "counts": head_pose_counts,
                "percentages": {k: (v / total_frames * 100) if total_frames > 0 else 0 
                              for k, v in head_pose_counts.items()}
            },
            "emotions": {
                "counts": emotion_counts,
                "percentages": {k: (v / total_frames * 100) if total_frames > 0 else 0 
                              for k, v in emotion_counts.items()}
            },
            "mouth_movements": {
                "total_open_count": mouth_open_count,
                "percentage": (mouth_open_count / total_frames * 100) if total_frames > 0 else 0
            },
            "session_duration": total_frames / 30 if total_frames > 0 else 0,  # Assuming 30 fps
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        
        
        total_frames = 0
        phone_detected_count = 0
        eye_movement_counts = {k: 0 for k in eye_movement_counts}
        head_pose_counts = {k: 0 for k in head_pose_counts}
        emotion_counts = {k: 0 for k in emotion_counts}
        mouth_open_count = 0
        
        return jsonify(final_results)
    except Exception as e:
        logger.error(f"Error ending interview: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(threaded=True, host="0.0.0.0", port=6500)