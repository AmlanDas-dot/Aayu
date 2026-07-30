import firebase_admin
from firebase_admin import credentials, auth, firestore
import datetime
import uuid

# Initialize Firebase Admin
cred_path = r"d:\Aayu\backend\credentials\firebase-admin.json"
cred = credentials.Certificate(cred_path)
try:
    firebase_admin.get_app()
except ValueError:
    firebase_admin.initialize_app(cred)

db = firestore.client()

EMAIL = "arnavdas06@gmail.com"
PASSWORD = "1234"

try:
    try:
        user = auth.get_user_by_email(EMAIL)
        auth.update_user(user.uid, password=PASSWORD)
        print(f"User updated: {user.uid}")
    except auth.UserNotFoundError:
        user = auth.create_user(
            email=EMAIL,
            email_verified=True,
            password=PASSWORD,
            display_name="Arnav Das"
        )
        print(f"User created: {user.uid}")
except Exception as e:
    if "password must be" in str(e).lower() or "least 6 characters" in str(e).lower() or "weak" in str(e).lower() or "password" in str(e).lower():
        print("Password too short for Firebase (min 6). Using '123456' instead.")
        PASSWORD = "123456"
        try:
            user = auth.get_user_by_email(EMAIL)
            auth.update_user(user.uid, password=PASSWORD)
        except auth.UserNotFoundError:
            user = auth.create_user(
                email=EMAIL,
                email_verified=True,
                password=PASSWORD,
                display_name="Arnav Das"
            )
        print(f"User handled with updated password: {user.uid}")
    else:
        raise e

uid = user.uid

# BMR calculation (Mifflin-St Jeor)
cal_goal = 2662
protein_goal = 114

# 1. User Profile Document
user_ref = db.collection('users').document(uid)
user_data = {
    'name': 'Arnav Das',
    'email': EMAIL,
    'role': 'doctor',
    'gender': 'Male',
    'bloodGroup': 'O+',
    'profession': 'Doctor',
    'dietPreference': 'Non-Vegetarian',
    'onboardingComplete': True,
    'onboardingTimestamp': datetime.datetime.now().isoformat(),
    
    # Health Base Stats
    'age': 32,
    'height': 178,
    'weight': 76,
    'targetWeight': 74,
    'bmi': round(76 / ((178/100)**2), 1),
    'activityLevel': 'Moderately Active',
    
    # Goals
    'waterGoal': 3,
    'sleepGoal': 8,
    'caloriesGoal': cal_goal,
    'proteinGoal': protein_goal,
    
    # Emergency
    'emergencyContactName': 'Aman Das',
    'emergencyContactPhone': '+919876543210',
    
    # Location
    'location': {
        'city': 'Rajkot',
        'state': 'Gujarat',
        'country': 'India',
        'locality': 'Kalawad Road',
        'lat': 22.2882,
        'lon': 70.7712,
        'district': 'Rajkot'
    },
    
    # Healthcare Assigments
    'workspaces': [{
        'id': 'ws_phc_kuvadva',
        'type': 'PHC',
        'name': 'Kuvadva PHC'
    }, {
        'id': 'ws_chc_padadhari',
        'type': 'CHC',
        'name': 'Padadhari CHC'
    }]
}
user_ref.set(user_data, merge=True)

# 2. Health Profile
health_ref = user_ref.collection('health_profile').document('current')
health_data = {
    'chronicConditions': [],
    'allergies': [],
    'addictionHistory': ['Smoking', 'Alcohol'],
    'medications': []
}
health_ref.set(health_data, merge=True)

# 3. Nutrition Profile
nutrition_ref = user_ref.collection('nutrition_profile').document('current')
nutrition_data = {
    'dietPreference': 'Non-Vegetarian',
    'budgetTier': 'Standard',
    'nutritionScore': 85,
    'waterTarget': 3,
    'mealPreferences': ['High Protein', 'Low Carb'],
    'lastUpdated': datetime.datetime.now().isoformat()
}
nutrition_ref.set(nutrition_data, merge=True)

# 4. Recovery Profile
recovery_ref = user_ref.collection('recovery_profile').document('current')
recovery_data = {
    'activeMissions': ['mission_quit_smoking', 'mission_hydrate'],
    'completedMissions': [],
    'habits': ['Smoking', 'Alcohol'],
    'streak': 3,
    'totalPoints': 120
}
recovery_ref.set(recovery_data, merge=True)

# 5. Family
family_members = [
    {'name': 'Aman Das', 'relation': 'Father', 'age': 65, 'bloodGroup': 'O+', 'gender': 'Male'},
    {'name': 'Priyanka Das', 'relation': 'Mother', 'age': 62, 'bloodGroup': 'A+', 'gender': 'Female'},
    {'name': 'Aditi Das', 'relation': 'Spouse', 'age': 30, 'bloodGroup': 'B+', 'gender': 'Female'},
    {'name': 'Anshuman Das', 'relation': 'Son', 'age': 5, 'bloodGroup': 'O+', 'gender': 'Male'}
]

for member in family_members:
    member_id = str(uuid.uuid4())
    user_ref.collection('family').document(member_id).set(member)

# 6. Initialize Empty/Initial Collections
user_ref.collection('medical_records').document('init').set({'initialized': True, 'timestamp': datetime.datetime.now().isoformat()})
user_ref.collection('medications').document('init').set({'initialized': True, 'timestamp': datetime.datetime.now().isoformat()})
user_ref.collection('chats').document('init').set({'initialized': True, 'messages': []})
user_ref.collection('alert_subscriptions').document('prefs').set({
    'sms': True, 'push': True, 'email': True,
    'categories': ['Disease', 'Weather', 'Environment']
})
user_ref.collection('environment_prefs').document('current').set({
    'trackAQI': True, 'trackHeat': True
})
user_ref.collection('schemes_eligibility').document('profile').set({
    'income': '< 5 LPA', 'caste': 'General', 'occupation': 'Doctor'
})

print("Successfully created demo user and initialized all required Firestore documents.")
