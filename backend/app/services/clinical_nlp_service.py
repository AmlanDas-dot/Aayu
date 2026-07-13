import re
from typing import Any

# ---------------------------------------------------------------------------
# 300+ Canonical Mappings
# ---------------------------------------------------------------------------
_CANONICAL_MAP = {
    # General / Constitutional
    "hungry": "polyphagia", "always hungry": "polyphagia", "increased appetite": "polyphagia", "eating a lot": "polyphagia",
    "peeing frequently": "polyuria", "urinating a lot": "polyuria", "frequent urination": "polyuria", "peeing more": "polyuria",
    "thirsty all the time": "polydipsia", "very thirsty": "polydipsia", "excessive thirst": "polydipsia", "always thirsty": "polydipsia",
    "tired": "fatigue", "tiredness": "fatigue", "exhausted": "fatigue", "exhaustion": "fatigue", "weak": "weakness", "weakness": "weakness",
    "lethargy": "fatigue", "feeling weak": "weakness", "lack of energy": "fatigue", "sluggish": "fatigue",
    "weight loss": "weight loss", "losing weight": "weight loss", "dropped weight": "weight loss", "clothes loose": "weight loss",
    "weight gain": "weight gain", "gaining weight": "weight gain", "putting on weight": "weight gain",
    "fever": "fever", "high temperature": "fever", "running a fever": "fever", "hot": "fever", "pyrexia": "fever",
    "chills": "chills", "shivering": "chills", "shivers": "chills", "feeling cold": "chills",
    "night sweats": "night sweats", "sweating at night": "night sweats", "waking up sweating": "night sweats",
    "sweating": "diaphoresis", "sweaty": "diaphoresis", "heavy sweating": "diaphoresis",
    "dizziness": "dizziness", "dizzy": "dizziness", "lightheaded": "dizziness", "faint": "dizziness",
    "spinning": "vertigo", "room spinning": "vertigo", "vertigo": "vertigo",
    "fainting": "syncope", "fainted": "syncope", "passed out": "syncope", "blacked out": "syncope", "syncope": "syncope",
    "loss of appetite": "anorexia", "not hungry": "anorexia", "poor appetite": "anorexia", "anorexia": "anorexia",
    "malaise": "malaise", "feeling unwell": "malaise", "general discomfort": "malaise",
    
    # Head & Neck
    "headache": "headache", "head ache": "headache", "head pain": "headache", "migraine": "headache", "head hurts": "headache",
    "stiff neck": "neck stiffness", "neck pain": "neck pain", "neck hurts": "neck pain", "neck stiffness": "neck stiffness",
    
    # Eyes
    "blurry vision": "blurred vision", "blurred vision": "blurred vision", "can't see clearly": "blurred vision", "vision changes": "visual disturbance",
    "double vision": "diplopia", "diplopia": "diplopia", "seeing double": "diplopia",
    "eye pain": "eye pain", "eyes hurt": "eye pain", "pain in eye": "eye pain",
    "red eye": "red eye", "bloodshot eye": "red eye", "pink eye": "red eye",
    "dry eyes": "dry eyes", "itchy eyes": "itchy eyes", "watery eyes": "watery eyes",
    "photophobia": "photophobia", "sensitivity to light": "photophobia", "light hurts eyes": "photophobia",
    "nyctalopia": "nyctalopia", "night blindness": "nyctalopia", "can't see at night": "nyctalopia",
    "keratomalacia": "keratomalacia", "soft eye": "keratomalacia",
    
    # Ears
    "earache": "earache", "ear pain": "earache", "ear hurts": "earache", "otalgia": "earache",
    "ringing in ears": "tinnitus", "tinnitus": "tinnitus", "buzzing in ears": "tinnitus",
    "hearing loss": "hearing loss", "deafness": "hearing loss", "can't hear": "hearing loss", "muffled hearing": "hearing loss",
    "ear discharge": "otorrhea", "fluid from ear": "otorrhea", "pus from ear": "otorrhea",
    
    # Nose
    "runny nose": "rhinorrhea", "rhinorrhea": "rhinorrhea", "nasal discharge": "rhinorrhea",
    "stuffy nose": "nasal congestion", "nasal congestion": "nasal congestion", "blocked nose": "nasal congestion",
    "nosebleed": "epistaxis", "epistaxis": "epistaxis", "bleeding from nose": "epistaxis", "bloody nose": "epistaxis",
    "sneezing": "sneezing", "loss of smell": "anosmia", "anosmia": "anosmia", "can't smell": "anosmia",
    
    # Mouth & Throat
    "sore throat": "sore throat", "throat pain": "sore throat", "throat hurts": "sore throat",
    "difficulty swallowing": "dysphagia", "dysphagia": "dysphagia", "hard to swallow": "dysphagia",
    "painful swallowing": "odynophagia", "odynophagia": "odynophagia", "hurts to swallow": "odynophagia",
    "toothache": "toothache", "tooth pain": "toothache", "teeth hurt": "toothache",
    "bleeding gums": "bleeding gums", "mouth ulcers": "mouth ulcers", "canker sores": "mouth ulcers",
    "dry mouth": "dry mouth", "xerostomia": "dry mouth",
    
    # Respiratory / Chest
    "cough": "cough", "coughing": "cough", "persistent cough": "persistent cough", "chronic cough": "persistent cough",
    "coughing up blood": "hemoptysis", "hemoptysis": "hemoptysis", "blood in spit": "hemoptysis", "bloody sputum": "hemoptysis",
    "breathlessness": "dyspnea", "shortness of breath": "dyspnea", "dyspnea": "dyspnea", "short of breath": "dyspnea", "difficulty breathing": "dyspnea", "hard to breathe": "dyspnea", "can't breathe": "dyspnea",
    "wheezing": "wheezing", "wheeze": "wheezing", "whistling breath": "wheezing",
    "chest pain": "chest pain", "chest hurts": "chest pain", "chest discomfort": "chest pain", "chest tightness": "chest pain", "tight chest": "chest pain",
    "orthopnea": "orthopnea", "can't breathe lying down": "orthopnea", "breathless lying flat": "orthopnea",
    "palpitations": "palpitations", "heart racing": "palpitations", "heart pounding": "palpitations", "fast heart rate": "tachycardia", "tachycardia": "tachycardia", "slow heart rate": "bradycardia", "bradycardia": "bradycardia",
    
    # Gastrointestinal
    "stomach ache": "abdominal pain", "stomach pain": "abdominal pain", "tummy ache": "abdominal pain", "belly pain": "abdominal pain", "abdominal pain": "abdominal pain",
    "nausea": "nausea", "feeling sick": "nausea", "sick to stomach": "nausea", "nauseous": "nausea",
    "vomiting": "vomiting", "throwing up": "vomiting", "puking": "vomiting",
    "vomiting blood": "hematemesis", "hematemesis": "hematemesis", "throwing up blood": "hematemesis", "blood in vomit": "hematemesis",
    "diarrhea": "diarrhea", "loose stools": "diarrhea", "watery stools": "diarrhea", "runs": "diarrhea", "loose motions": "diarrhea",
    "constipation": "constipation", "can't poop": "constipation", "hard stools": "constipation",
    "bloating": "bloating", "bloated": "bloating", "swollen stomach": "bloating", "gassy": "flatulence", "flatulence": "flatulence",
    "heartburn": "heartburn", "acid reflux": "heartburn", "burning in chest": "heartburn",
    "black stool": "melena", "black stools": "melena", "tarry stools": "melena", "melena": "melena",
    "blood in stool": "hematochezia", "hematochezia": "hematochezia", "bloody poop": "hematochezia",
    "pale stools": "acholic stools", "fatty stools": "steatorrhea", "steatorrhea": "steatorrhea", "oily stools": "steatorrhea",
    "jaundice": "jaundice", "yellow skin": "jaundice", "yellow eyes": "jaundice",
    "dyspepsia": "indigestion", "indigestion": "indigestion", "upset stomach": "indigestion",
    
    # Urinary
    "dysuria": "dysuria", "painful urination": "dysuria", "burning when peeing": "dysuria", "hurts to pee": "dysuria",
    "blood in urine": "hematuria", "hematuria": "hematuria", "red urine": "hematuria",
    "nocturia": "nocturia", "waking up to pee": "nocturia", "peeing at night": "nocturia",
    "urinary urgency": "urinary urgency", "have to pee bad": "urinary urgency", "can't hold urine": "urinary incontinence", "incontinence": "urinary incontinence",
    
    # Musculoskeletal
    "joint pain": "arthralgia", "arthralgia": "arthralgia", "joints hurt": "arthralgia", "aching joints": "arthralgia",
    "joint stiffness": "joint stiffness", "stiff joints": "joint stiffness",
    "joint swelling": "joint swelling", "swollen joints": "joint swelling",
    "muscle pain": "myalgia", "myalgia": "myalgia", "muscles hurt": "myalgia", "body ache": "myalgia", "body aches": "myalgia",
    "muscle weakness": "muscle weakness", "weak muscles": "muscle weakness", "hypotonia": "hypotonia", "reduced muscle tone": "hypotonia",
    "muscle cramps": "muscle cramps", "cramps": "muscle cramps", "spasms": "muscle spasms",
    "back pain": "back pain", "backache": "back pain", "back hurts": "back pain",
    "swollen feet": "pedal edema", "pedal edema": "pedal edema", "swollen ankles": "pedal edema", "edema": "edema", "swelling": "swelling",
    
    # Neurological / Mental
    "confusion": "confusion", "confused": "confusion", "disorientation": "confusion",
    "memory loss": "memory loss", "forgetfulness": "memory loss", "forgetful": "memory loss", "amnesia": "memory loss",
    "seizures": "seizures", "convulsions": "seizures", "fits": "seizures",
    "tremors": "tremors", "shaking": "tremors",
    "numbness": "numbness", "numb": "numbness", "loss of sensation": "numbness",
    "tingling": "tingling", "pins and needles": "tingling", "paresthesia": "paresthesia",
    "ataxia": "ataxia", "poor balance": "ataxia", "clumsiness": "ataxia",
    "paralysis": "paralysis", "can't move": "paralysis",
    "anxiety": "anxiety", "anxious": "anxiety", "nervous": "anxiety", "panic": "anxiety",
    "depression": "depression", "depressed": "depression", "sadness": "depression", "feeling low": "depression",
    "insomnia": "insomnia", "can't sleep": "insomnia", "trouble sleeping": "insomnia",
    "hallucinations": "hallucinations", "seeing things": "hallucinations", "hearing voices": "hallucinations",
    
    # Skin
    "rash": "rash", "skin rash": "rash", "red spots": "rash", "eruption": "rash",
    "itchy skin": "pruritus", "pruritus": "pruritus", "itching": "pruritus", "itchiness": "pruritus", "itchy": "pruritus",
    "ring shaped rash": "annular rash", "ring shaped patches": "annular rash", "ring rash": "annular rash", "annular rash": "annular rash",
    "dry skin": "xerosis", "xerosis": "xerosis", "flaky skin": "dry skin",
    "blisters": "vesicles", "vesicles": "vesicles", "bullae": "blisters",
    "hives": "urticaria", "urticaria": "urticaria", "welts": "urticaria",
    "peeling skin": "desquamation", "desquamation": "desquamation",
    "pale skin": "pallor", "pallor": "pallor", "paleness": "pallor",
    "bluish skin": "cyanosis", "cyanosis": "cyanosis", "blue lips": "cyanosis",
    "bruising": "ecchymosis", "ecchymosis": "ecchymosis", "bruises": "ecchymosis",
    "tiny red spots": "petechiae", "petechiae": "petechiae",
    "hair loss": "alopecia", "alopecia": "alopecia", "losing hair": "alopecia", "bald patches": "alopecia",
    "ulcer": "ulcer", "sore": "ulcer", "open sore": "ulcer",
    
    # Female specific
    "heavy periods": "menorrhagia", "menorrhagia": "menorrhagia", "heavy bleeding": "menorrhagia",
    "painful periods": "dysmenorrhea", "dysmenorrhea": "dysmenorrhea", "menstrual cramps": "dysmenorrhea",
    "irregular periods": "oligomenorrhea", "missed period": "amenorrhea",
    "vaginal discharge": "vaginal discharge", "leukorrhea": "vaginal discharge",
}

# Add standalone symptoms that don't need mapping
_STANDALONE = [
    "pain", "hurts", "swelling", "bleeding", "discharge", "lump", "bump", "mass",
    "stiffness", "cramp", "spasm", "burning", "ache"
]
for s in _STANDALONE:
    if s not in _CANONICAL_MAP:
        _CANONICAL_MAP[s] = s

_BODY_PARTS = {
    # Musculoskeletal
    "knee": "Musculoskeletal", "knees": "Musculoskeletal", "joint": "Musculoskeletal", "joints": "Musculoskeletal",
    "shoulder": "Musculoskeletal", "shoulders": "Musculoskeletal", "elbow": "Musculoskeletal", "elbows": "Musculoskeletal",
    "wrist": "Musculoskeletal", "wrists": "Musculoskeletal", "hand": "Musculoskeletal", "hands": "Musculoskeletal",
    "finger": "Musculoskeletal", "fingers": "Musculoskeletal", "thumb": "Musculoskeletal", "hip": "Musculoskeletal", "hips": "Musculoskeletal",
    "leg": "Musculoskeletal", "legs": "Musculoskeletal", "thigh": "Musculoskeletal", "calf": "Musculoskeletal", "calves": "Musculoskeletal",
    "ankle": "Musculoskeletal", "ankles": "Musculoskeletal", "foot": "Dermatology_Musculoskeletal", "feet": "Dermatology_Musculoskeletal",
    "toe": "Musculoskeletal", "toes": "Musculoskeletal", "back": "Musculoskeletal", "spine": "Musculoskeletal",
    "neck": "Musculoskeletal", "muscle": "Musculoskeletal", "muscles": "Musculoskeletal", "bone": "Musculoskeletal", "bones": "Musculoskeletal",
    
    # Head & Face
    "head": "Neurology", "face": "Dermatology", "eye": "Ophthalmology", "eyes": "Ophthalmology",
    "ear": "ENT", "ears": "ENT", "nose": "ENT", "mouth": "Oral", "lip": "Oral", "lips": "Oral",
    "tongue": "Oral", "tooth": "Oral", "teeth": "Oral", "gum": "Oral", "gums": "Oral", "jaw": "Oral",
    "throat": "ENT", "tonsil": "ENT", "tonsils": "ENT",
    
    # Chest & Respiratory
    "chest": "Cardiology_Respiratory", "heart": "Cardiology", "lung": "Respiratory", "lungs": "Respiratory",
    "breast": "Womens_Health", "breasts": "Womens_Health",
    
    # Abdomen & GI
    "stomach": "Gastroenterology", "abdomen": "Gastroenterology", "belly": "Gastroenterology", "tummy": "Gastroenterology",
    "gut": "Gastroenterology", "bowel": "Gastroenterology", "intestine": "Gastroenterology", "liver": "Gastroenterology",
    
    # Genitourinary
    "kidney": "Urology", "kidneys": "Urology", "bladder": "Urology", "groin": "Urology",
    "penis": "Mens_Health", "testicle": "Mens_Health", "testicles": "Mens_Health", "scrotum": "Mens_Health",
    "vagina": "Womens_Health", "vulva": "Womens_Health", "uterus": "Womens_Health", "ovary": "Womens_Health", "cervix": "Womens_Health",
    
    # Skin
    "skin": "Dermatology", "scalp": "Dermatology", "nail": "Dermatology", "nails": "Dermatology"
}

_COLLECTION_ROUTING = {
    "Musculoskeletal": ["chronic_diseases", "elderly_health"],
    "Dermatology": ["skin_diseases", "child_health"],
    "Dermatology_Musculoskeletal": ["skin_diseases", "chronic_diseases"],
    "Ophthalmology": ["common_diseases", "elderly_health"],
    "ENT": ["common_diseases", "child_health", "respiratory_health"],
    "Oral": ["oral_health", "child_health"],
    "Cardiology": ["chronic_diseases", "emergency_conditions"],
    "Respiratory": ["respiratory_health", "infectious_diseases", "chronic_diseases"],
    "Cardiology_Respiratory": ["respiratory_health", "chronic_diseases", "emergency_conditions"],
    "Gastroenterology": ["common_diseases", "infectious_diseases", "water_sanitation"],
    "Urology": ["common_diseases", "chronic_diseases"],
    "Mens_Health": ["mens_health", "infectious_diseases"],
    "Womens_Health": ["maternal_health", "menstrual_health", "infectious_diseases"],
    "Neurology": ["chronic_diseases", "elderly_health", "emergency_conditions"],
}

_NEGATORS = {"no", "not", "without", "deny", "denies", "zero", "never"}
_LATERALITY = {"left", "right", "bilateral", "both"}
_SEVERITY = {"mild", "moderate", "severe", "extreme", "slight", "intense", "terrible", "bad", "worst"}
_DURATION = {"days", "weeks", "months", "years", "hours", "since", "long time"}
_PROGRESSION = {"worsening", "improving", "constant", "intermittent", "spreading", "sudden", "gradual"}

def extract_clinical_entities(text: str) -> dict[str, Any]:
    """
    Deterministic extraction of clinical entities from natural language text.
    """
    text_lower = text.lower()
    
    # Extract Demographics
    age = None
    gender = None
    age_match = re.search(r'\b(\d{1,3})\s*(years? old|yo|years? of age)\b', text_lower)
    if not age_match:
        age_match = re.search(r'\bage\s*(\d{1,3})\b', text_lower)
    if age_match:
        age = int(age_match.group(1))
        
    if re.search(r'\b(male|man|boy|gentleman)\b', text_lower):
        gender = "male"
    elif re.search(r'\b(female|woman|girl|lady)\b', text_lower):
        gender = "female"
        
    # Tokenize
    words = re.findall(r'\b\w+\b', text_lower)
    
    extracted_symptoms = set()
    negated_symptoms = set()
    body_parts = set()
    laterality = set()
    severity = set()
    duration = set()
    progression = set()
    
    # Find exact multi-word mappings first
    # Sort by length descending to match longest phrases first
    multi_words = [k for k in _CANONICAL_MAP.keys() if " " in k]
    multi_words.sort(key=len, reverse=True)
    
    for phrase in multi_words:
        canonical = _CANONICAL_MAP[phrase]
        if phrase in text_lower:
            # Check negation
            idx = text_lower.find(phrase)
            pre_text = text_lower[:idx].split()[-3:] if idx > 0 else []
            is_negated = any(n in pre_text for n in _NEGATORS)
            if is_negated:
                negated_symptoms.add(canonical)
            else:
                extracted_symptoms.add(canonical)
            # Remove the phrase so we don't double match single words inside it
            text_lower = text_lower.replace(phrase, "")
            
    # Re-tokenize after removing multi-words
    words = re.findall(r'\b\w+\b', text_lower)
    
    # Single word iteration
    for i, w in enumerate(words):
        # Negation window
        pre_words = words[max(0, i-3):i]
        is_negated = any(n in pre_words for n in _NEGATORS)
        
        # Maps
        if w in _CANONICAL_MAP:
            canonical = _CANONICAL_MAP[w]
            if is_negated:
                negated_symptoms.add(canonical)
            else:
                extracted_symptoms.add(canonical)
                
        if w in _BODY_PARTS:
            body_parts.add(w)
            
        if w in _LATERALITY:
            laterality.add(w)
            
        if w in _SEVERITY:
            severity.add(w)
            
        if w in _DURATION:
            duration.add(w)
            
        if w in _PROGRESSION:
            progression.add(w)
            
    # Combine body parts + standalone symptoms if not already captured
    for bp in body_parts:
        for sym in ["pain", "ache", "hurts", "swelling", "lump", "stiffness"]:
            if sym in words:
                comp = f"{bp} {sym}"
                if comp in _CANONICAL_MAP:
                    extracted_symptoms.add(_CANONICAL_MAP[comp])
                else:
                    if sym == "hurts" or sym == "ache":
                        sym = "pain"
                    extracted_symptoms.add(f"{bp} {sym}")
                    
    # Ensure at least one symptom if there's a body part and 'hurts'
    if not extracted_symptoms and body_parts and "hurts" in words:
        for bp in body_parts:
            extracted_symptoms.add(f"{bp} pain")
            
    return {
        "symptoms": list(extracted_symptoms),
        "negated_symptoms": list(negated_symptoms),
        "body_parts": list(body_parts),
        "laterality": list(laterality),
        "severity": list(severity),
        "duration": list(duration),
        "progression": list(progression),
        "age": age,
        "gender": gender
    }

def map_to_canonical(symptoms: list[str]) -> list[str]:
    """Map raw phrases to canonical medical concepts."""
    res = set()
    for s in symptoms:
        s_lower = s.lower()
        if s_lower in _CANONICAL_MAP:
            res.add(_CANONICAL_MAP[s_lower])
        else:
            res.add(s_lower)
    return list(res)

def detect_body_system(body_parts: list[str], symptoms: list[str]) -> list[str]:
    """
    Returns specific ChromaDB collections to search based on body parts or symptoms.
    """
    collections = set()
    
    # Body part routing
    for bp in body_parts:
        bp_lower = bp.lower()
        if bp_lower in _BODY_PARTS:
            sys = _BODY_PARTS[bp_lower]
            if sys in _COLLECTION_ROUTING:
                collections.update(_COLLECTION_ROUTING[sys])
                
    # Symptom-specific routing
    sym_text = " ".join(symptoms).lower()
    if "pregnancy" in sym_text or "pregnant" in sym_text:
        collections.update(["maternal_health"])
    if "mental" in sym_text or "anxiety" in sym_text or "depression" in sym_text or "hallucinations" in sym_text:
        collections.update(["mental_health"])
    if "child" in sym_text or "baby" in sym_text or "infant" in sym_text:
        collections.update(["child_health"])
    if "elderly" in sym_text or "old" in sym_text or "senior" in sym_text:
        collections.update(["elderly_health"])
        
    return list(collections)
