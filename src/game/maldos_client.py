import time
import mediapipe as mp
import cv2
import numpy as np


NOSE = 0
LEFT_EYE_INNER = 1
LEFT_EYE = 2
LEFT_EYE_OUTER = 3
RIGHT_EYE_INNER = 4
RIGHT_EYE = 5
RIGHT_EYE_OUTER = 6
LEFT_EAR = 7
RIGHT_EAR = 8
MOUTH_LEFT = 9
MOUTH_RIGHT = 10
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_ELBOW = 13
RIGHT_ELBOW = 14
LEFT_WRIST = 15
RIGHT_WRIST = 16
LEFT_PINKY = 17
RIGHT_PINKY = 18
LEFT_INDEX = 19
RIGHT_INDEX = 20
LEFT_THUMB = 21
RIGHT_THUMB = 22
LEFT_HIP = 23
RIGHT_HIP = 24
LEFT_KNEE = 25
RIGHT_KNEE = 26
LEFT_ANKLE = 27
RIGHT_ANKLE = 28
LEFT_HEEL = 29
RIGHT_HEEL = 30
LEFT_FOOT_INDEX = 31
RIGHT_FOOT_INDEX = 32

mp_drawing = mp.solutions.mediapipe.python.solutions.drawing_utils
mp_pose = mp.solutions.mediapipe.python.solutions.pose

min_detection_confidence = 0.35
min_tracking_confidence = 0.3
model_complexity = 1

width = 1080
height = 720

def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b) # Mid
    c = np.array(c)
    
    radians = np.arctan2(c[1] - b[1], c[0]-b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    
    if angle > 180.0:
        angle = 360 - angle
        
    return angle


def midpoint(p1, p2):
    return (int((p1[0]+p2[0])/2), int((p1[1]+p2[1])/2))


def translate_landmark(landmark, dimensions):
    return tuple(np.multiply((1 - landmark.x, landmark.y), dimensions).astype(int))


def approximate(a, b, err=20.0):
    return b + err > a and b - err < a
    
    
def touching(a, b, x_err=100, y_err=100): 
    return approximate(a[0], b[0], x_err) and approximate(a[1], b[1], y_err)


def translate_landmarks(landmarks, dimensions):
    return [translate_landmark(landmark, dimensions) for landmark in landmarks]


def draw_star(img, center, size, color, thickness=1):
    center_x = center[0]
    center_y = center[1]
    
    pts = np.array([
        (center_x, center_y - size),  # Top point
        (center_x + int(size * 0.225), center_y - int(size * 0.309)),  # Top-right inner
        (center_x + size, center_y - int(size * 0.309)),  # Right point
        (center_x + int(size * 0.364), center_y + int(size * 0.118)),  # Bottom-right inner
        (center_x + int(size * 0.588), center_y + size),  # Bottom-right outer
        (center_x, center_y + int(size * 0.382)),  # Bottom point
        (center_x - int(size * 0.588), center_y + size),  # Bottom-left outer
        (center_x - int(size * 0.364), center_y + int(size * 0.118)),  # Bottom-left inner
        (center_x - size, center_y - int(size * 0.309)),  # Left point
        (center_x - int(size * 0.225), center_y - int(size * 0.309)),  # Top-left inner
    ], np.int32)

    # Reshape the points to fit the polylines function
    pts = pts.reshape((-1, 1, 2))

    if thickness < 0:
        cv2.fillPoly(img, [pts], color)
    
    cv2.polylines(img, [pts], isClosed=True, color=color, thickness=abs(thickness))


cap = cv2.VideoCapture(0)

cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)

timer_time_progress_bar = [0]
start_time = time.time()

with mp_pose.Pose(min_detection_confidence=min_detection_confidence,
                  min_tracking_confidence=min_tracking_confidence,
                  model_complexity=model_complexity) as pose:
    while True:
        ret, frame = cap.read()
        if not ret:
            continue
        frame = cv2.flip(frame, 1)

        frame.flags.writeable = False
        results = pose.process(cv2.cvtColor(cv2.flip(frame, 1), cv2.COLOR_BGR2RGB))
        frame.flags.writeable = True

        frame = cv2.flip(frame, 1)
        if results:
            if results.pose_landmarks:
                pose_coordinates = translate_landmarks(results.pose_landmarks.landmark, (width, height))
                mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
        frame = cv2.flip(frame, 1)

        def draw_empty_star(center):
            center = (center[0] + 90, center[1])
            draw_star(frame, center, 20, (0, 255, 255), 2)
            draw_star(frame, center, 23, (0, 0, 255), 1)
            
        draw_filled_star = lambda center: draw_star(frame, (center[0] + 90, center[1]), 20, (0, 255, 255), -5)
        
        def draw_star_if_true(center, expression):
            if expression:
                draw_filled_star(center)
            else:
                draw_empty_star(center)
                
        
        top_star_coord = (int(width / 2), 50)
        left_star_coord = (220, 440)
        right_star_coord = (width - 220, 440)
        
        if results:
            if results.pose_landmarks:
                
                left_wrist = pose_coordinates[LEFT_WRIST]
                right_wrist = pose_coordinates[RIGHT_WRIST]
            
                wrist_midpoint = midpoint(left_wrist, right_wrist)
                
                draw_star_if_true(wrist_midpoint, touching(left_wrist, right_wrist, 200, 200))
                    
                right_elbow = pose_coordinates[RIGHT_ELBOW]
                left_elbow = pose_coordinates[LEFT_ELBOW]
                right_elbow_angle = calculate_angle(right_wrist, right_elbow, pose_coordinates[RIGHT_SHOULDER])
                left_elbow_angle = calculate_angle(left_wrist, left_elbow, pose_coordinates[LEFT_SHOULDER])
                
                draw_star_if_true(left_elbow, left_elbow_angle > 140)
                draw_star_if_true(right_elbow, right_elbow_angle > 140)
                
                star_touch_err = 50
                draw_star_if_true(top_star_coord, touching(wrist_midpoint, top_star_coord, star_touch_err, star_touch_err))
                draw_star_if_true(left_star_coord, touching(wrist_midpoint, left_star_coord, star_touch_err, star_touch_err))
                draw_star_if_true(right_star_coord, touching(wrist_midpoint, right_star_coord, star_touch_err, star_touch_err))


        # timer bar

                
        # timer_width = 200
        # cv2.rectangle(frame, (0, 0), (timer_width, 50), (0, 0, 0), -1)
        # cv2.rectangle(frame, (0, 0), (int(timer_width * timer_time_progress_bar[0]), 50), (255, 0, 0), -1)
        
        
        
        if cv2.waitKey(5) & 0xFF == ord('q'):
            break
        cv2.imshow("", frame)

cap.release()
cv2.destroyAllWindows()
