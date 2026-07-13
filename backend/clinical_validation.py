"""
AAYU Clinical Reasoning Engine — Full Validation Suite
~100 patient scenarios across 14 clinical categories.

Scores each case on:
  - Specialty Accuracy (1-10)
  - Disease Ranking Quality (1-10)
  - Question Quality (1-10)
  - Clinical Safety (1-10)
  - Patient Language (1-10)

Outputs results to clinical_validation_results.json
"""

import json
import re
import time
import sys
import io

# Force UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from app.services.clinical_reasoning_service import get_specialty_collections, rank_candidates, select_next_question
from app.services.emergency_service import EmergencyClassifier, normalize_symptoms
from app.services.screening_service import start_screening, submit_answer, is_screening_active, _sessions

clf = EmergencyClassifier.get_instance()

# ---------------------------------------------------------------------------
# TEST CASE DEFINITIONS
# Each: complaint, patient_ctx, expected_cols, expected_hypothesis_keywords,
#       expected_q_themes, emergency_expected, category
# ---------------------------------------------------------------------------

TEST_CASES = [

# ── GENERAL MEDICINE ────────────────────────────────────────────────────────
{"id":"GM01","category":"General Medicine","complaint":"I am constantly hungry and thirsty and urinating very frequently","patient":{"age":45,"gender":"male","conditions":[]},"expected_cols":["chronic_diseases"],"expected_hyp":["diabetes","type 2"],"expected_q_theme":["weight","fatigue","vision"],"emergency":"NONE"},
{"id":"GM02","category":"General Medicine","complaint":"My blood pressure is always very high around 160/100","patient":{"age":52,"gender":"male","conditions":["obesity"]},"expected_cols":["chronic_diseases"],"expected_hyp":["hypertension"],"expected_q_theme":["headache","vision","chest"],"emergency":"NONE"},
{"id":"GM03","category":"General Medicine","complaint":"I have been feeling very cold all the time and my hair is falling out","patient":{"age":35,"gender":"female","conditions":[]},"expected_cols":["chronic_diseases"],"expected_hyp":["hypothyroid"],"expected_q_theme":["weight","fatigue","constipation"],"emergency":"NONE"},
{"id":"GM04","category":"General Medicine","complaint":"My heart feels like it is racing and I have lost a lot of weight","patient":{"age":30,"gender":"female","conditions":[]},"expected_cols":["chronic_diseases"],"expected_hyp":["hyperthyroid"],"expected_q_theme":["anxiety","tremor","heat"],"emergency":"NONE"},
{"id":"GM05","category":"General Medicine","complaint":"I feel very pale and tired all the time and I am breathless when climbing stairs","patient":{"age":28,"gender":"female","conditions":[]},"expected_cols":["nutrition_diseases","chronic_diseases"],"expected_hyp":["anemia"],"expected_q_theme":["diet","period","blood"],"emergency":"NONE"},
{"id":"GM06","category":"General Medicine","complaint":"I have been gaining a lot of weight even though I am eating less","patient":{"age":40,"gender":"female","conditions":[]},"expected_cols":["chronic_diseases","nutrition_diseases"],"expected_hyp":["hypothyroid","obesity"],"expected_q_theme":["cold","fatigue","hair"],"emergency":"NONE"},
{"id":"GM07","category":"General Medicine","complaint":"My child is very thin and not growing properly","patient":{"age":4,"gender":"male","conditions":[]},"expected_cols":["child_health","nutrition_diseases"],"expected_hyp":["malnutrition","stunting"],"expected_q_theme":["diet","feeding","vomiting"],"emergency":"NONE"},
{"id":"GM08","category":"General Medicine","complaint":"I have had bone pain and my doctor said my vitamin D is very low","patient":{"age":55,"gender":"female","conditions":[]},"expected_cols":["nutrition_diseases"],"expected_hyp":["vitamin d","osteomalacia"],"expected_q_theme":["sunlight","diet","joint"],"emergency":"NONE"},
{"id":"GM09","category":"General Medicine","complaint":"I am bleeding from my gums and have small red spots on my skin","patient":{"age":22,"gender":"male","conditions":[]},"expected_cols":["nutrition_diseases"],"expected_hyp":["scurvy","vitamin c"],"expected_q_theme":["diet","fruit","vegetable"],"emergency":"NONE"},
{"id":"GM10","category":"General Medicine","complaint":"I have been feeling very weak with night sweats and lost 10 kg in 3 months","patient":{"age":35,"gender":"male","conditions":[]},"expected_cols":["chronic_diseases","nutrition_diseases"],"expected_hyp":["tuberculosis","malignancy","diabetes"],"expected_q_theme":["cough","fever","appetite"],"emergency":"NONE"},

# ── INFECTIOUS DISEASES ──────────────────────────────────────────────────────
{"id":"ID01","category":"Infectious","complaint":"I have high fever for 5 days with severe headache and joint pain","patient":{"age":25,"gender":"male","conditions":[]},"expected_cols":["infectious_diseases"],"expected_hyp":["dengue"],"expected_q_theme":["rash","bleeding","platelet"],"emergency":"NONE"},
{"id":"ID02","category":"Infectious","complaint":"I get fever every other day with shivering and sweating","patient":{"age":30,"gender":"female","conditions":[]},"expected_cols":["infectious_diseases"],"expected_hyp":["malaria"],"expected_q_theme":["travel","mosquito","chills"],"emergency":"NONE"},
{"id":"ID03","category":"Infectious","complaint":"I have been coughing for 3 months with blood in my sputum","patient":{"age":40,"gender":"male","conditions":[]},"expected_cols":["respiratory_health","infectious_diseases"],"expected_hyp":["tuberculosis"],"expected_q_theme":["night sweat","weight loss","contact"],"emergency":"NONE"},
{"id":"ID04","category":"Infectious","complaint":"I have continuous fever for 2 weeks with stomach pain and rose coloured spots","patient":{"age":20,"gender":"male","conditions":[]},"expected_cols":["infectious_diseases"],"expected_hyp":["typhoid"],"expected_q_theme":["diarrhea","headache","water"],"emergency":"NONE"},
{"id":"ID05","category":"Infectious","complaint":"I have loss of smell and taste fever and dry cough","patient":{"age":35,"gender":"male","conditions":[]},"expected_cols":["respiratory_health","infectious_diseases"],"expected_hyp":["covid","influenza"],"expected_q_theme":["contact","breathing","oxygen"],"emergency":"NONE"},
{"id":"ID06","category":"Infectious","complaint":"I have high fever with chills body ache and runny nose","patient":{"age":30,"gender":"female","conditions":[]},"expected_cols":["infectious_diseases","common_diseases"],"expected_hyp":["influenza"],"expected_q_theme":["contact","vomiting","rash"],"emergency":"NONE"},
{"id":"ID07","category":"Infectious","complaint":"I have chest pain with fever and I am coughing up yellow sputum","patient":{"age":60,"gender":"male","conditions":["diabetes"]},"expected_cols":["respiratory_health","infectious_diseases"],"expected_hyp":["pneumonia"],"expected_q_theme":["breathing","oxygen","antibiotic"],"emergency":"NONE"},
{"id":"ID08","category":"Infectious","complaint":"I have burning pain when I urinate and I keep needing to go frequently","patient":{"age":25,"gender":"female","conditions":[]},"expected_cols":["infectious_diseases","chronic_diseases"],"expected_hyp":["uti","urinary tract"],"expected_q_theme":["blood","fever","lower abdomen"],"emergency":"NONE"},
{"id":"ID09","category":"Infectious","complaint":"After eating at a restaurant I have severe vomiting and diarrhea since last night","patient":{"age":22,"gender":"male","conditions":[]},"expected_cols":["infectious_diseases","water_sanitation"],"expected_hyp":["food poison","gastroenteritis"],"expected_q_theme":["fever","blood","dehydration"],"emergency":"NONE"},

# ── CARDIOLOGY ────────────────────────────────────────────────────────────────
{"id":"CA01","category":"Cardiology","complaint":"I get chest tightness when I walk uphill that goes away when I rest","patient":{"age":60,"gender":"male","conditions":["hypertension","diabetes"]},"expected_cols":["chronic_diseases","emergency_conditions"],"expected_hyp":["angina","coronary"],"expected_q_theme":["radiation","sweating","duration"],"emergency":"NONE"},
{"id":"CA02","category":"Cardiology","complaint":"My father has crushing chest pain and his left arm is hurting","patient":{"age":58,"gender":"male","conditions":[]},"expected_cols":["emergency_conditions"],"expected_hyp":["heart attack","myocardial"],"expected_q_theme":[],"emergency":"CRITICAL"},
{"id":"CA03","category":"Cardiology","complaint":"My legs are swollen and I cannot breathe when lying flat","patient":{"age":65,"gender":"male","conditions":["hypertension"]},"expected_cols":["chronic_diseases","elderly_health"],"expected_hyp":["heart failure","cardiac"],"expected_q_theme":["breathless","swelling","weight"],"emergency":"NONE"},
{"id":"CA04","category":"Cardiology","complaint":"I can feel my heart beating very fast and irregularly","patient":{"age":45,"gender":"female","conditions":[]},"expected_cols":["chronic_diseases"],"expected_hyp":["arrhythmia","palpitation","atrial"],"expected_q_theme":["dizziness","fainting","anxiety"],"emergency":"NONE"},
{"id":"CA05","category":"Cardiology","complaint":"I feel dizzy when I stand up suddenly and my BP is very low","patient":{"age":70,"gender":"female","conditions":["hypertension"]},"expected_cols":["chronic_diseases","elderly_health"],"expected_hyp":["hypotension","orthostatic"],"expected_q_theme":["medication","dehydration","fainting"],"emergency":"NONE"},

# ── RESPIRATORY ───────────────────────────────────────────────────────────────
{"id":"RE01","category":"Respiratory","complaint":"I have been wheezing and getting breathless especially at night","patient":{"age":18,"gender":"female","conditions":[]},"expected_cols":["respiratory_health"],"expected_hyp":["asthma"],"expected_q_theme":["trigger","allergy","dust"],"emergency":"NONE"},
{"id":"RE02","category":"Respiratory","complaint":"I am a smoker and I have a chronic cough with phlegm every morning","patient":{"age":55,"gender":"male","conditions":[]},"expected_cols":["respiratory_health","substance_abuse"],"expected_hyp":["copd","bronchitis","smoker"],"expected_q_theme":["breathless","years smoking","sputum"],"emergency":"NONE"},
{"id":"RE03","category":"Respiratory","complaint":"I have had a cough with fever for one week and it is getting worse","patient":{"age":40,"gender":"male","conditions":[]},"expected_cols":["respiratory_health","infectious_diseases"],"expected_hyp":["bronchitis","pneumonia"],"expected_q_theme":["phlegm","chest pain","breathing"],"emergency":"NONE"},
{"id":"RE04","category":"Respiratory","complaint":"I suddenly cannot breathe and my lips are turning blue","patient":{"age":30,"gender":"male","conditions":["asthma"]},"expected_cols":["emergency_conditions","respiratory_health"],"expected_hyp":[],"expected_q_theme":[],"emergency":"CRITICAL"},
{"id":"RE05","category":"Respiratory","complaint":"I have had a dry cough that just will not go away for 2 months","patient":{"age":48,"gender":"female","conditions":[]},"expected_cols":["respiratory_health"],"expected_hyp":["chronic cough","post nasal","tuberculosis"],"expected_q_theme":["night sweat","allergy","acid"],"emergency":"NONE"},

# ── GASTROENTEROLOGY ─────────────────────────────────────────────────────────
{"id":"GI01","category":"Gastro","complaint":"I have loose stools 5-6 times a day for the past 3 days","patient":{"age":25,"gender":"male","conditions":[]},"expected_cols":["infectious_diseases","water_sanitation"],"expected_hyp":["gastroenteritis","diarrhea"],"expected_q_theme":["blood","fever","dehydration"],"emergency":"NONE"},
{"id":"GI02","category":"Gastro","complaint":"I have not passed stool for 5 days and my abdomen is bloated","patient":{"age":60,"gender":"male","conditions":["diabetes"]},"expected_cols":["chronic_diseases","elderly_health"],"expected_hyp":["constipation"],"expected_q_theme":["diet","medication","fiber"],"emergency":"NONE"},
{"id":"GI03","category":"Gastro","complaint":"I get heartburn every night and acid comes up into my throat","patient":{"age":42,"gender":"male","conditions":["obesity"]},"expected_cols":["chronic_diseases"],"expected_hyp":["gerd","acid reflux"],"expected_q_theme":["lying flat","spicy food","medication"],"emergency":"NONE"},
{"id":"GI04","category":"Gastro","complaint":"I have been having severe right upper abdomen pain after eating fatty food","patient":{"age":38,"gender":"female","conditions":[]},"expected_cols":["chronic_diseases","infectious_diseases"],"expected_hyp":["gallstone","cholecystitis"],"expected_q_theme":["nausea","fever","vomiting"],"emergency":"NONE"},
{"id":"GI05","category":"Gastro","complaint":"I have severe pain around my navel that has moved to my right lower abdomen","patient":{"age":19,"gender":"male","conditions":[]},"expected_cols":["emergency_conditions","infectious_diseases"],"expected_hyp":["appendicitis"],"expected_q_theme":["fever","nausea","rebound"],"emergency":"URGENT"},
{"id":"GI06","category":"Gastro","complaint":"I have severe upper abdominal pain that goes to my back after drinking alcohol","patient":{"age":45,"gender":"male","conditions":[]},"expected_cols":["chronic_diseases","substance_abuse"],"expected_hyp":["pancreatitis"],"expected_q_theme":["fever","vomiting","alcohol"],"emergency":"NONE"},
{"id":"GI07","category":"Gastro","complaint":"I have been vomiting blood and my stools are black","patient":{"age":50,"gender":"male","conditions":["alcohol"]},"expected_cols":["emergency_conditions"],"expected_hyp":["gi bleed","peptic ulcer","varices"],"expected_q_theme":[],"emergency":"CRITICAL"},

# ── DERMATOLOGY ───────────────────────────────────────────────────────────────
{"id":"DE01","category":"Dermatology","complaint":"I have had an itchy red rash spreading on my whole body for 3 days","patient":{"age":22,"gender":"female","conditions":[]},"expected_cols":["skin_diseases","infectious_diseases"],"expected_hyp":["urticaria","allergy","viral rash"],"expected_q_theme":["fever","medication","new soap"],"emergency":"NONE"},
{"id":"DE02","category":"Dermatology","complaint":"I have white patches on my skin between my toes that are very itchy","patient":{"age":30,"gender":"male","conditions":[]},"expected_cols":["skin_diseases","infectious_diseases"],"expected_hyp":["fungal","tinea","athlete"],"expected_q_theme":["sweating","footwear","spreading"],"emergency":"NONE"},
{"id":"DE03","category":"Dermatology","complaint":"I have thick scaly patches on my elbows and knees that peel off","patient":{"age":35,"gender":"male","conditions":[]},"expected_cols":["skin_diseases"],"expected_hyp":["psoriasis"],"expected_q_theme":["family history","stress","joint pain"],"emergency":"NONE"},
{"id":"DE04","category":"Dermatology","complaint":"My skin is very dry and I have eczema that worsens in winter","patient":{"age":12,"gender":"female","conditions":["asthma"]},"expected_cols":["skin_diseases","child_health"],"expected_hyp":["eczema","atopic dermatitis"],"expected_q_theme":["allergy","trigger","scratching"],"emergency":"NONE"},
{"id":"DE05","category":"Dermatology","complaint":"After eating peanuts my face has swollen up and I have hives everywhere","patient":{"age":20,"gender":"female","conditions":[]},"expected_cols":["emergency_conditions","skin_diseases"],"expected_hyp":[],"expected_q_theme":[],"emergency":"CRITICAL"},

# ── NEUROLOGY ─────────────────────────────────────────────────────────────────
{"id":"NE01","category":"Neurology","complaint":"My father suddenly cannot speak and his right side is weak","patient":{"age":65,"gender":"male","conditions":["hypertension"]},"expected_cols":["emergency_conditions"],"expected_hyp":[],"expected_q_theme":[],"emergency":"CRITICAL"},
{"id":"NE02","category":"Neurology","complaint":"I get a severe one-sided headache with nausea that lasts for hours","patient":{"age":32,"gender":"female","conditions":[]},"expected_cols":["chronic_diseases","mental_health"],"expected_hyp":["migraine"],"expected_q_theme":["trigger","aura","frequency"],"emergency":"NONE"},
{"id":"NE03","category":"Neurology","complaint":"I had a fit and collapsed and did not remember anything afterwards","patient":{"age":25,"gender":"male","conditions":[]},"expected_cols":["chronic_diseases","emergency_conditions"],"expected_hyp":["epilepsy","seizure"],"expected_q_theme":["tongue bite","duration","previous"],"emergency":"NONE"},
{"id":"NE04","category":"Neurology","complaint":"My grandfather is forgetting names and getting confused about where he is","patient":{"age":78,"gender":"male","conditions":[]},"expected_cols":["mental_health","elderly_health"],"expected_hyp":["dementia","alzheimer","cognitive"],"expected_q_theme":["memory","daily function","mood"],"emergency":"NONE"},
{"id":"NE05","category":"Neurology","complaint":"I have burning tingling sensation in both my feet for months","patient":{"age":55,"gender":"male","conditions":["diabetes"]},"expected_cols":["chronic_diseases"],"expected_hyp":["neuropathy","peripheral neuropathy","diabetic"],"expected_q_theme":["blood sugar","alcohol","vitamin"],"emergency":"NONE"},
{"id":"NE06","category":"Neurology","complaint":"My hands have a tremor and I walk very slowly with short steps","patient":{"age":70,"gender":"male","conditions":[]},"expected_cols":["elderly_health","chronic_diseases"],"expected_hyp":["parkinson"],"expected_q_theme":["balance","stiffness","handwriting"],"emergency":"NONE"},

# ── MENTAL HEALTH ─────────────────────────────────────────────────────────────
{"id":"MH01","category":"Mental Health","complaint":"I have been very sad for months and I do not want to do anything","patient":{"age":28,"gender":"female","conditions":[]},"expected_cols":["mental_health"],"expected_hyp":["depression"],"expected_q_theme":["sleep","appetite","motivation"],"emergency":"NONE"},
{"id":"MH02","category":"Mental Health","complaint":"I keep worrying about everything and cannot stop thinking negative thoughts","patient":{"age":35,"gender":"male","conditions":[]},"expected_cols":["mental_health"],"expected_hyp":["anxiety","generalized anxiety"],"expected_q_theme":["sleep","physical symptoms","triggers"],"emergency":"NONE"},
{"id":"MH03","category":"Mental Health","complaint":"My heart suddenly started racing I could not breathe and I thought I was dying","patient":{"age":30,"gender":"female","conditions":[]},"expected_cols":["mental_health","chronic_diseases"],"expected_hyp":["panic attack","anxiety"],"expected_q_theme":["frequency","trigger","cardiac"],"emergency":"NONE"},
{"id":"MH04","category":"Mental Health","complaint":"I cannot sleep at all at night even though I am very tired","patient":{"age":40,"gender":"male","conditions":[]},"expected_cols":["mental_health","chronic_diseases"],"expected_hyp":["insomnia"],"expected_q_theme":["stress","routine","medication"],"emergency":"NONE"},
{"id":"MH05","category":"Mental Health","complaint":"I want to kill myself I cannot take this anymore","patient":{"age":22,"gender":"male","conditions":[]},"expected_cols":["mental_health"],"expected_hyp":[],"expected_q_theme":[],"emergency":"CRITICAL"},
{"id":"MH06","category":"Mental Health","complaint":"I am completely exhausted and burnt out from work and feel empty","patient":{"age":38,"gender":"female","conditions":[]},"expected_cols":["mental_health"],"expected_hyp":["burnout","depression","anxiety"],"expected_q_theme":["sleep","support","motivation"],"emergency":"NONE"},

# ── OBSTETRICS ────────────────────────────────────────────────────────────────
{"id":"OB01","category":"Obstetrics","complaint":"I am 10 weeks pregnant and vomiting all day cannot eat anything","patient":{"age":26,"gender":"female","conditions":[]},"expected_cols":["maternal_health"],"expected_hyp":["hyperemesis","morning sickness"],"expected_q_theme":["weight loss","hydration","nutrition"],"emergency":"NONE"},
{"id":"OB02","category":"Obstetrics","complaint":"I am 32 weeks pregnant and my BP is very high with severe headache","patient":{"age":28,"gender":"female","conditions":[]},"expected_cols":["maternal_health","emergency_conditions"],"expected_hyp":["pre-eclampsia","pregnancy hypertension"],"expected_q_theme":["swelling","vision","protein urine"],"emergency":"URGENT"},
{"id":"OB03","category":"Obstetrics","complaint":"I am 6 months pregnant and my blood sugar is high","patient":{"age":30,"gender":"female","conditions":[]},"expected_cols":["maternal_health","nutrition_diseases"],"expected_hyp":["gestational diabetes"],"expected_q_theme":["diet","fetal","monitor"],"emergency":"NONE"},
{"id":"OB04","category":"Obstetrics","complaint":"I am pregnant and I have had heavy bleeding since this morning","patient":{"age":25,"gender":"female","conditions":[]},"expected_cols":["maternal_health","emergency_conditions"],"expected_hyp":["placenta previa","miscarriage","abruption"],"expected_q_theme":[],"emergency":"CRITICAL"},
{"id":"OB05","category":"Obstetrics","complaint":"I am 38 weeks and having strong contractions every 5 minutes","patient":{"age":27,"gender":"female","conditions":[]},"expected_cols":["maternal_health","emergency_conditions"],"expected_hyp":["labour"],"expected_q_theme":[],"emergency":"URGENT"},

# ── PEDIATRICS ────────────────────────────────────────────────────────────────
{"id":"PE01","category":"Pediatrics","complaint":"My 2 year old has had fever of 104 degrees for 2 days","patient":{"age":2,"gender":"female","conditions":[]},"expected_cols":["child_health","infectious_diseases"],"expected_hyp":["febrile","fever child"],"expected_q_theme":["rash","seizure","feeding"],"emergency":"NONE"},
{"id":"PE02","category":"Pediatrics","complaint":"My baby has had diarrhea 10 times today and is crying and refusing milk","patient":{"age":1,"gender":"male","conditions":[]},"expected_cols":["child_health","infectious_diseases"],"expected_hyp":["diarrhea","dehydration","rotavirus"],"expected_q_theme":["sunken eyes","urine","blood"],"emergency":"URGENT"},
{"id":"PE03","category":"Pediatrics","complaint":"My 5 year old vomited 6 times today and is complaining of stomach pain","patient":{"age":5,"gender":"male","conditions":[]},"expected_cols":["child_health","infectious_diseases"],"expected_hyp":["gastroenteritis","vomiting","food poison"],"expected_q_theme":["fever","diarrhea","dehydration"],"emergency":"NONE"},
{"id":"PE04","category":"Pediatrics","complaint":"My infant of 8 months is not feeding well and gaining very little weight","patient":{"age":0,"gender":"female","conditions":[]},"expected_cols":["child_health","nutrition_diseases"],"expected_hyp":["failure to thrive","malnutrition"],"expected_q_theme":["breastfeeding","complementary","infection"],"emergency":"NONE"},
{"id":"PE05","category":"Pediatrics","complaint":"My child had a seizure and their whole body was shaking for 2 minutes","patient":{"age":3,"gender":"male","conditions":[]},"expected_cols":["child_health","emergency_conditions"],"expected_hyp":["febrile seizure","epilepsy"],"expected_q_theme":[],"emergency":"URGENT"},
{"id":"PE06","category":"Pediatrics","complaint":"My child has not received any vaccinations and I want to know what to give","patient":{"age":1,"gender":"male","conditions":[]},"expected_cols":["child_health"],"expected_hyp":["vaccination","immunization"],"expected_q_theme":["age","schedule","previous"],"emergency":"NONE"},

# ── GERIATRICS ────────────────────────────────────────────────────────────────
{"id":"GE01","category":"Geriatrics","complaint":"My 75 year old mother fell down at home and now her hip is painful","patient":{"age":75,"gender":"female","conditions":["osteoporosis"]},"expected_cols":["elderly_health","chronic_diseases"],"expected_hyp":["hip fracture","fall","osteoporosis"],"expected_q_theme":["walking","swelling","hospital"],"emergency":"URGENT"},
{"id":"GE02","category":"Geriatrics","complaint":"My grandfather is getting confused at night and talking to people who are not there","patient":{"age":80,"gender":"male","conditions":["diabetes"]},"expected_cols":["elderly_health","mental_health"],"expected_hyp":["delirium","dementia","sundowning"],"expected_q_theme":["fever","medication","urine"],"emergency":"NONE"},
{"id":"GE03","category":"Geriatrics","complaint":"My elderly aunt is taking 12 different medicines and keeps feeling dizzy","patient":{"age":78,"gender":"female","conditions":["hypertension","diabetes","arthritis"]},"expected_cols":["elderly_health","chronic_diseases"],"expected_hyp":["polypharmacy","drug interaction","orthostatic"],"expected_q_theme":["medication","blood pressure","fall"],"emergency":"NONE"},
{"id":"GE04","category":"Geriatrics","complaint":"My 80 year old father has become very weak and cannot walk anymore","patient":{"age":80,"gender":"male","conditions":["heart failure"]},"expected_cols":["elderly_health","chronic_diseases"],"expected_hyp":["frailty","weakness","deconditioning"],"expected_q_theme":["nutrition","breathing","pain"],"emergency":"NONE"},

# ── TOXICOLOGY / EMERGENCY ────────────────────────────────────────────────────
{"id":"TX01","category":"Toxicology","complaint":"A snake bit my son on his leg 30 minutes ago","patient":{"age":12,"gender":"male","conditions":[]},"expected_cols":["emergency_conditions"],"expected_hyp":[],"expected_q_theme":[],"emergency":"CRITICAL"},
{"id":"TX02","category":"Toxicology","complaint":"My child has swallowed some rat poison","patient":{"age":3,"gender":"male","conditions":[]},"expected_cols":["emergency_conditions"],"expected_hyp":[],"expected_q_theme":[],"emergency":"URGENT"},
{"id":"TX03","category":"Toxicology","complaint":"My uncle drank a lot of alcohol last night and now he is shaking and confused","patient":{"age":45,"gender":"male","conditions":["alcohol"]},"expected_cols":["substance_abuse","mental_health"],"expected_hyp":["alcohol withdrawal","delirium tremens"],"expected_q_theme":["seizure","how long","drinking"],"emergency":"URGENT"},
{"id":"TX04","category":"Toxicology","complaint":"My skin got burned by acid at work","patient":{"age":28,"gender":"male","conditions":[]},"expected_cols":["emergency_conditions","first_aid"],"expected_hyp":[],"expected_q_theme":[],"emergency":"CRITICAL"},

# ── MUSCULOSKELETAL ────────────────────────────────────────────────────────────
{"id":"MS01","category":"Musculoskeletal","complaint":"My joints are stiff and painful every morning for about an hour","patient":{"age":42,"gender":"female","conditions":[]},"expected_cols":["chronic_diseases","elderly_health"],"expected_hyp":["rheumatoid arthritis","inflammatory"],"expected_q_theme":["swelling","which joint","family"],"emergency":"NONE"},
{"id":"MS02","category":"Musculoskeletal","complaint":"I have severe pain in my big toe that appeared suddenly during the night","patient":{"age":50,"gender":"male","conditions":["obesity"]},"expected_cols":["chronic_diseases"],"expected_hyp":["gout"],"expected_q_theme":["diet","alcohol","uric acid"],"emergency":"NONE"},
{"id":"MS03","category":"Musculoskeletal","complaint":"I have lower back pain radiating down to my left leg","patient":{"age":38,"gender":"male","conditions":[]},"expected_cols":["chronic_diseases","elderly_health"],"expected_hyp":["disc","sciatica","lumbar"],"expected_q_theme":["weakness","numbness","bladder"],"emergency":"NONE"},

# ── UROLOGY / NEPHROLOGY ──────────────────────────────────────────────────────
{"id":"UR01","category":"Urology","complaint":"I have severe pain on my right side that comes in waves and I found blood in my urine","patient":{"age":35,"gender":"male","conditions":[]},"expected_cols":["chronic_diseases","infectious_diseases"],"expected_hyp":["kidney stone","renal colic"],"expected_q_theme":["previous","diet","fever"],"emergency":"NONE"},
{"id":"UR02","category":"Urology","complaint":"My urine output has decreased and my legs are swollen","patient":{"age":60,"gender":"male","conditions":["diabetes","hypertension"]},"expected_cols":["chronic_diseases"],"expected_hyp":["kidney failure","ckd","renal"],"expected_q_theme":["creatinine","urine output","protein"],"emergency":"URGENT"},

# ── ENDOCRINOLOGY ─────────────────────────────────────────────────────────────
{"id":"EN01","category":"Endocrinology","complaint":"I have a swelling in my neck that has been growing for 2 months","patient":{"age":35,"gender":"female","conditions":[]},"expected_cols":["chronic_diseases"],"expected_hyp":["thyroid","goiter","thyroid nodule"],"expected_q_theme":["swallowing","breathing","family"],"emergency":"NONE"},
{"id":"EN02","category":"Endocrinology","complaint":"I have irregular periods acne and excess facial hair","patient":{"age":24,"gender":"female","conditions":[]},"expected_cols":["menstrual_health","chronic_diseases"],"expected_hyp":["pcos","polycystic"],"expected_q_theme":["weight","family","diabetes"],"emergency":"NONE"},

# ── MIXED / COMPLEX ───────────────────────────────────────────────────────────
{"id":"CX01","category":"Complex","complaint":"I am a 65 year old woman with diabetes and hypertension and I have chest pain when walking","patient":{"age":65,"gender":"female","conditions":["diabetes","hypertension"]},"expected_cols":["chronic_diseases","emergency_conditions"],"expected_hyp":["angina","coronary"],"expected_q_theme":["radiation","exertion","shortness of breath"],"emergency":"NONE"},
{"id":"CX02","category":"Complex","complaint":"My 70 year old father with heart failure has swollen legs and cannot breathe when lying down","patient":{"age":70,"gender":"male","conditions":["heart failure"]},"expected_cols":["elderly_health","chronic_diseases"],"expected_hyp":["decompensated heart failure","pulmonary edema"],"expected_q_theme":["weight","breathing","fluid"],"emergency":"URGENT"},
{"id":"CX03","category":"Complex","complaint":"My pregnant wife at 28 weeks has severe headache vision problems and swollen feet","patient":{"age":29,"gender":"female","conditions":[]},"expected_cols":["maternal_health","emergency_conditions"],"expected_hyp":["pre-eclampsia"],"expected_q_theme":[],"emergency":"CRITICAL"},
{"id":"CX04","category":"Complex","complaint":"I have been having severe fatigue unexplained weight loss and swollen lymph nodes for 6 weeks","patient":{"age":45,"gender":"male","conditions":[]},"expected_cols":["chronic_diseases","infectious_diseases"],"expected_hyp":["lymphoma","tuberculosis","hiv"],"expected_q_theme":["fever","night sweat","family"],"emergency":"NONE"},
{"id":"CX05","category":"Complex","complaint":"My 3 year old has high fever stiff neck and is very drowsy","patient":{"age":3,"gender":"male","conditions":[]},"expected_cols":["child_health","emergency_conditions","infectious_diseases"],"expected_hyp":["meningitis"],"expected_q_theme":[],"emergency":"CRITICAL"},
]

# ---------------------------------------------------------------------------
# Medical language quality checker
# ---------------------------------------------------------------------------

JARGON_TERMS = {
    "polydipsia": "feeling much thirstier than usual",
    "polyuria": "urinating much more frequently than normal",
    "polyphagia": "feeling unusually hungry",
    "dyspnea": "difficulty breathing",
    "steatorrhea": "oily or greasy stools",
    "hematemesis": "vomiting blood",
    "melena": "black tarry stools",
    "hematuria": "blood in urine",
    "nocturia": "waking up at night to urinate",
    "orthopnea": "difficulty breathing when lying flat",
    "tachycardia": "fast heartbeat",
    "bradycardia": "slow heartbeat",
    "dysphagia": "difficulty swallowing",
    "pallor": "paleness",
    "edema": "swelling",
    "pruritus": "severe itching",
    "erythema": "redness of skin",
    "cyanosis": "bluish discoloration",
    "anorexia": "loss of appetite",
    "pyrexia": "fever",
}

def check_language_quality(question: str) -> tuple[float, list[str]]:
    """Returns (score 0-1, list of jargon found)"""
    q_lower = question.lower()
    found_jargon = []
    for term in JARGON_TERMS:
        if term in q_lower:
            found_jargon.append(term)
    score = 1.0 - (len(found_jargon) * 0.2)
    return max(score, 0.0), found_jargon

def score_question_quality(question: str, expected_themes: list) -> float:
    """Score 0-1 how relevant the question is to expected themes"""
    if not question:
        return 0.0
    q_lower = question.lower()
    if not expected_themes:
        return 0.5  # No expected theme, neutral
    matches = sum(1 for t in expected_themes if t.lower() in q_lower)
    return min(matches / max(len(expected_themes), 1), 1.0)

def score_hypothesis_quality(top_hypotheses: list, expected_keywords: list) -> float:
    """Score 0-1 whether expected disease keywords appear in top hypotheses"""
    if not expected_keywords:
        return 0.5
    top_names = " ".join(h.get("name", "").lower() for h in top_hypotheses[:5])
    matches = sum(1 for k in expected_keywords if k.lower() in top_names)
    return min(matches / max(len(expected_keywords), 1), 1.0)

def score_specialty(detected_cols: list, expected_cols: list) -> float:
    """Score 0-1 overlap between detected and expected collections"""
    if not expected_cols:
        return 0.5
    overlap = sum(1 for c in expected_cols if c in detected_cols)
    return min(overlap / max(len(expected_cols), 1), 1.0)

# ---------------------------------------------------------------------------
# Run validation
# ---------------------------------------------------------------------------

def run_test(tc: dict) -> dict:
    sid = f"val_{tc['id']}"
    # Clean up any leftover session
    _sessions.pop(sid, None)

    patient = tc.get("patient", {})
    complaint = tc["complaint"]
    expected_emergency = tc.get("emergency", "NONE")

    result = {
        "id": tc["id"],
        "category": tc["category"],
        "complaint": complaint,
        "patient": patient,
        "expected_emergency": expected_emergency,
        "scores": {},
        "findings": {},
        "failures": [],
        "language_issues": [],
    }

    # ── Emergency check ──────────────────────────────────────────────────────
    normalized = normalize_symptoms(complaint)
    emerg = clf.classify(normalized)

    result["findings"]["emergency_triggered"] = emerg.is_emergency
    result["findings"]["emergency_severity"] = emerg.severity
    result["findings"]["normalized_complaint"] = normalized

    if expected_emergency in ("CRITICAL", "URGENT") and not emerg.is_emergency:
        result["failures"].append(f"MISSED EMERGENCY: expected {expected_emergency}, got NONE")
        result["scores"]["safety"] = 0
    elif expected_emergency == "NONE" and emerg.is_emergency:
        result["failures"].append(f"FALSE EMERGENCY: flagged as {emerg.severity} when no emergency expected")
        result["scores"]["safety"] = 3
    else:
        result["scores"]["safety"] = 10

    # If emergency expected, we're done (short-circuit is correct behaviour)
    if expected_emergency in ("CRITICAL", "URGENT"):
        result["scores"].setdefault("safety", 10)
        result["scores"]["specialty"] = 10
        result["scores"]["hypothesis"] = 10
        result["scores"]["question"] = 10
        result["scores"]["language"] = 10
        result["overall"] = sum(result["scores"].values()) / len(result["scores"]) * 10
        return result

    # ── Specialty routing ────────────────────────────────────────────────────
    cols = get_specialty_collections(complaint)
    result["findings"]["specialty_cols"] = cols[:3]
    spec_score = score_specialty(cols, tc.get("expected_cols", []))
    result["scores"]["specialty"] = round(spec_score * 10)

    if spec_score < 0.5:
        result["failures"].append(f"WRONG SPECIALTY: got {cols[:2]}, expected {tc['expected_cols']}")

    # ── Run screening ────────────────────────────────────────────────────────
    try:
        payload = start_screening(sid, [complaint], patient if patient else None)
    except Exception as e:
        result["failures"].append(f"SCREENING CRASH: {e}")
        result["scores"]["hypothesis"] = 0
        result["scores"]["question"] = 0
        result["scores"]["language"] = 0
        result["overall"] = 2
        return result

    running = payload.get("running_scores", [])
    q1 = payload.get("question", {})
    q1_text = q1.get("text", "") if q1 else ""
    q1_id = q1.get("id", "") if q1 else ""

    result["findings"]["top_hypotheses"] = [
        {"name": r.get("name", ""), "score": r.get("score", 0)} for r in running[:5]
    ]
    result["findings"]["q1_id"] = q1_id
    result["findings"]["q1_text"] = q1_text

    # Score hypothesis quality
    hyp_score = score_hypothesis_quality(running, tc.get("expected_hyp", []))
    result["scores"]["hypothesis"] = round(hyp_score * 10)
    if hyp_score < 0.5 and tc.get("expected_hyp"):
        result["failures"].append(f"POOR HYPOTHESES: got {[r.get('name','')[:30] for r in running[:3]]}, expected keywords {tc['expected_hyp']}")

    # Score Q1 relevance
    q1_score = score_question_quality(q1_text, tc.get("expected_q_theme", []))
    result["scores"]["question"] = round(q1_score * 10)
    if q1_score < 0.5 and tc.get("expected_q_theme"):
        result["failures"].append(f"POOR Q1: '{q1_text[:60]}', expected theme from {tc['expected_q_theme']}")

    # Language quality check
    lang_score, jargon = check_language_quality(q1_text)
    result["scores"]["language"] = round(lang_score * 10)
    result["language_issues"] = jargon
    if jargon:
        result["failures"].append(f"JARGON IN Q1: {jargon} in '{q1_text[:60]}'")

    # Submit one answer and get Q2
    if is_screening_active(sid) and q1_id:
        try:
            payload2 = submit_answer(sid, q1_id, "Yes")
            q2 = payload2.get("question", {})
            q2_text = q2.get("text", "") if q2 else ""
            q2_id = q2.get("id", "") if q2 else ""
            result["findings"]["q2_id"] = q2_id
            result["findings"]["q2_text"] = q2_text

            # Check Q2 is not same as Q1
            if q2_id and q2_id == q1_id:
                result["failures"].append("DUPLICATE QUESTION: Q2 == Q1")

            # Check for jargon in Q2
            _, jargon2 = check_language_quality(q2_text)
            if jargon2:
                result["language_issues"].extend([f"Q2: {j}" for j in jargon2])
        except Exception as e:
            result["findings"]["q2_text"] = f"ERROR: {e}"

    # Cleanup session
    _sessions.pop(sid, None)

    # Overall score
    scores = result["scores"]
    result["overall"] = round(sum(scores.values()) / max(len(scores), 1), 1)
    return result


# ---------------------------------------------------------------------------
# Main runner
# ---------------------------------------------------------------------------

print(f"Running {len(TEST_CASES)} clinical scenarios...\n")
results = []
t0 = time.time()

for i, tc in enumerate(TEST_CASES):
    try:
        r = run_test(tc)
        results.append(r)
        status = "PASS" if not r["failures"] else "WARN"
        q1_text = r["findings"].get("q1_text", "")[:50]
        emerg_ok = r["findings"].get("emergency_triggered", False)
        print(f"[{i+1:03d}][{status}] {tc['id']} {tc['category'][:15]:<15} | "
              f"spec={r['scores'].get('specialty',0):2d} "
              f"hyp={r['scores'].get('hypothesis',0):2d} "
              f"q={r['scores'].get('question',0):2d} "
              f"safety={r['scores'].get('safety',0):2d} | "
              f"Q1: {q1_text}")
    except Exception as e:
        results.append({"id": tc["id"], "category": tc["category"],
                        "complaint": tc["complaint"], "overall": 0,
                        "failures": [f"CRASH: {e}"], "scores": {}, "findings": {}})
        print(f"[{i+1:03d}][FAIL] {tc['id']} CRASHED: {e}")

elapsed = round(time.time() - t0, 1)

# ---------------------------------------------------------------------------
# Analysis
# ---------------------------------------------------------------------------

total = len(results)
passed  = sum(1 for r in results if not r.get("failures"))
warned  = sum(1 for r in results if r.get("failures"))
crashed = sum(1 for r in results if any("CRASH" in f for f in r.get("failures", [])))

all_scores = {
    "specialty": [], "hypothesis": [], "question": [], "safety": [], "language": []
}
for r in results:
    for k in all_scores:
        if k in r.get("scores", {}):
            all_scores[k].append(r["scores"][k])

avg = {k: round(sum(v)/max(len(v),1), 1) for k, v in all_scores.items()}
overall_scores = [r.get("overall", 0) for r in results if isinstance(r.get("overall"), (int, float))]
avg_overall = round(sum(overall_scores)/max(len(overall_scores),1), 1)

# Collect failures
all_failures = []
for r in results:
    for f in r.get("failures", []):
        all_failures.append({"id": r["id"], "category": r["category"], "failure": f})

# Jargon issues
all_jargon = []
for r in results:
    for j in r.get("language_issues", []):
        all_jargon.append({"id": r["id"], "jargon": j})

# Save JSON
output = {
    "meta": {
        "total": total, "passed": passed, "warned": warned, "crashed": crashed,
        "elapsed_s": elapsed, "pass_rate": round(passed/total*100, 1)
    },
    "averages": avg,
    "avg_overall": avg_overall,
    "results": results,
    "failures": all_failures,
    "jargon_issues": all_jargon,
}

with open("clinical_validation_results.json", "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

# ---------------------------------------------------------------------------
# Summary print
# ---------------------------------------------------------------------------

print(f"\n{'='*70}")
print(f"CLINICAL VALIDATION SUMMARY  ({elapsed}s for {total} scenarios)")
print(f"{'='*70}")
print(f"Pass (0 failures):  {passed}/{total}  ({round(passed/total*100,1)}%)")
print(f"Warnings:           {warned}")
print(f"Crashes:            {crashed}")
print(f"\nAVERAGE SCORES (1-10):")
for k, v in avg.items():
    bar = '#' * int(v)
    print(f"  {k:<12}: {v:4.1f}  {bar}")
print(f"  {'OVERALL':<12}: {avg_overall:4.1f}")
print(f"\nTOP FAILURES ({min(len(all_failures), 20)}):")
for f in all_failures[:20]:
    print(f"  [{f['id']}] {f['failure'][:80]}")
print(f"\nJARGON ISSUES ({len(all_jargon)}):")
for j in all_jargon[:15]:
    print(f"  [{j['id']}] {j['jargon']}")
print(f"\nFull results saved to: clinical_validation_results.json")
