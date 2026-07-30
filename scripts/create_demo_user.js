import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, getDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyA-v4xbfVwDTq70MMbdyKoNROxo8ju49lM",
    authDomain: "aayu-9ddfd.firebaseapp.com",
    projectId: "aayu-9ddfd",
    storageBucket: "aayu-9ddfd.firebasestorage.app",
    messagingSenderId: "797300319058",
    appId: "1:797300319058:web:be4d2f78047f62620f508b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const EMAIL = "arnavdas06@gmail.com";
const PASSWORD = "123456";

async function run() {
    let user;
    try {
        console.log("Attempting to sign in if user already exists...");
        const cred = await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
        user = cred.user;
        console.log("User signed in:", user.uid);
    } catch (e) {
        console.log("User not found or incorrect password. Attempting to create...");
        try {
            const cred = await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD);
            user = cred.user;
            console.log("User created:", user.uid);
        } catch (createErr) {
            console.error("Failed to create user:", createErr);
            process.exit(1);
        }
    }

    const uid = user.uid;

    const cal_goal = 2662;
    const protein_goal = 114;

    const nowIso = new Date().toISOString();

    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
        name: 'Arnav Das',
        email: EMAIL,
        role: 'doctor',
        gender: 'Male',
        bloodGroup: 'O+',
        profession: 'Doctor',
        dietPreference: 'Non-Vegetarian',
        onboardingComplete: true,
        onboardingTimestamp: nowIso,
        
        age: 32,
        height: 178,
        weight: 76,
        targetWeight: 74,
        bmi: 24.0,
        activityLevel: 'Moderately Active',
        
        waterGoal: 3,
        sleepGoal: 8,
        caloriesGoal: cal_goal,
        proteinGoal: protein_goal,
        
        emergencyContactName: 'Aman Das',
        emergencyContactPhone: '+919876543210',
        
        location: {
            city: 'Rajkot',
            state: 'Gujarat',
            country: 'India',
            locality: 'Kalawad Road',
            lat: 22.2882,
            lon: 70.7712,
            district: 'Rajkot'
        },
        
        workspaces: [{
            id: 'ws_phc_kuvadva',
            type: 'PHC',
            name: 'Kuvadva PHC'
        }, {
            id: 'ws_chc_padadhari',
            type: 'CHC',
            name: 'Padadhari CHC'
        }],
        healthProfile: {
            chronicConditions: [],
            allergies: [],
            addictionHistory: ['Smoking', 'Alcohol'],
            currentMedications: [],
            bloodGroup: 'O+',
            height: 178,
            weight: 76,
            bmi: 24.0,
            emergencyContact: {
                name: 'Aman Das',
                phoneNumber: '+919876543210',
                countryCode: '+91'
            }
        },
        nutritionProfile: {
            dietPreference: 'Non-Vegetarian',
            budgetTier: 'Standard',
            nutritionScore: 85,
            waterTarget: 3,
            mealPreferences: ['High Protein', 'Low Carb'],
            lastUpdated: nowIso
        },
        professionalProfile: {
            specialization: 'General Medicine',
            verificationStatus: 'Verified'
        }
    }, { merge: true });
    console.log("User profile saved with nested health, nutrition, and professional profiles.");

    const recoveryRef = doc(db, `users/${uid}/recovery_profile/current`);
    await setDoc(recoveryRef, {
        activeMissions: ['mission_quit_smoking', 'mission_hydrate'],
        completedMissions: [],
        habits: ['Smoking', 'Alcohol'],
        streak: 3,
        totalPoints: 120
    }, { merge: true });
    console.log("Recovery profile saved.");

    const familyMembers = [
        { name: 'Aman Das', relation: 'Father', age: 65, bloodGroup: 'O+', gender: 'Male' },
        { name: 'Priyanka Das', relation: 'Mother', age: 62, bloodGroup: 'A+', gender: 'Female' },
        { name: 'Aditi Das', relation: 'Spouse', age: 30, bloodGroup: 'B+', gender: 'Female' },
        { name: 'Anshuman Das', relation: 'Son', age: 5, bloodGroup: 'O+', gender: 'Male' }
    ];

    for (const member of familyMembers) {
        const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7);
        const memberRef = doc(db, `users/${uid}/family/${id}`);
        await setDoc(memberRef, member);
    }
    console.log("Family saved.");

    await setDoc(doc(db, `users/${uid}/medical_records/init`), { initialized: true, timestamp: nowIso });
    await setDoc(doc(db, `users/${uid}/medications/init`), { initialized: true, timestamp: nowIso });
    await setDoc(doc(db, `users/${uid}/chats/init`), { initialized: true, messages: [] });
    await setDoc(doc(db, `users/${uid}/alert_subscriptions/prefs`), {
        sms: true, push: true, email: true,
        categories: ['Disease', 'Weather', 'Environment']
    });
    await setDoc(doc(db, `users/${uid}/environment_prefs/current`), {
        trackAQI: true, trackHeat: true
    });
    await setDoc(doc(db, `users/${uid}/schemes_eligibility/profile`), {
        income: '< 5 LPA', caste: 'General', occupation: 'Doctor'
    });
    
    console.log("Subcollections initialized.");
    console.log("Successfully created demo user and initialized all required Firestore documents.");
    process.exit(0);
}

run();
