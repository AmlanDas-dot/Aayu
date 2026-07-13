import asyncio
import json
import logging
from app.routers.chat import _should_trigger_screening
from app.services.clinical_nlp_service import extract_clinical_entities
from app.services.screening_service import start_screening, submit_answer, calculate_result
from app.services.search_service import SearchService

logger = logging.getLogger("Phase10Validation")
logging.basicConfig(level=logging.WARNING)

TEST_CASES = [
    # Joint Pain
    "My left knee hurts really bad",
    "I have joint stiffness in my hands",
    "My shoulders are aching",
    "Swollen feet and ankles since yesterday",
    "Severe back pain after lifting weights",
    "My joints are swollen and red",
    "I have pain in my right hip",
    "I can't move my neck, it's very stiff",
    "My toes are swollen and painful",
    "Arthritis pain in my knees",
    
    # Rash
    "I have ring shaped patches on my feet",
    "Extremely itchy skin with red spots",
    "My skin is peeling off",
    "I developed hives all over my body",
    "There's a red rash on my baby's face",
    "My scalp is very itchy",
    "I have dry flaky skin",
    "Tiny red spots appeared on my arms",
    "I have a painful blister on my lip",
    "There's a wound on my leg that won't heal",
    
    # Chest Pain
    "I am having severe chest pain",
    "My heart is racing very fast",
    "Chest tightness and shortness of breath",
    "I feel a burning sensation in my chest",
    "Heart pounding out of my chest",
    "Palpitations and sweating",
    "Pain in my chest that goes to my left arm",
    "Heavy feeling on my chest",
    "Chest discomfort after eating",
    "I feel breathless lying flat",
    
    # Stroke / Neuro
    "My right arm is completely numb",
    "I have terrible weakness in my face",
    "My speech is slurred and I feel confused",
    "I have severe dizziness and spinning",
    "Sudden extreme headache with vomiting",
    "I can't balance properly",
    "Tingling in my legs and feet",
    "I fainted twice today",
    "Tremors in my hands",
    "Memory loss and confusion",
    
    # Diabetes / Endocrine
    "I am always hungry and eating a lot",
    "I am peeing very frequently",
    "Thirsty all the time and tired",
    "Losing weight without trying",
    "Blurry vision and constantly hungry",
    "Waking up multiple times at night to pee",
    "Feeling exhausted and dizzy",
    "I have gained a lot of weight recently",
    "Night sweats and feeling very cold",
    "My hands are sweating and heart is racing",
    
    # Malnutrition / GI
    "I have severe diarrhea for 3 days",
    "Vomiting blood since morning",
    "My stools are black",
    "Severe abdominal pain and fever",
    "Loss of appetite and feeling weak",
    "Constipation and bloating",
    "Pale stools and yellow eyes",
    "I can't swallow properly",
    "Heartburn after every meal",
    "Swollen stomach and very gassy",
    
    # Tuberculosis / Asthma / COPD
    "Persistent cough for 3 weeks with blood",
    "Wheezing and shortness of breath",
    "Coughing up bloody sputum",
    "Difficulty breathing and chest pain",
    "I have asthma and can't breathe",
    "Night sweats, fever, and chronic cough",
    "Whistling sound when I breathe",
    "Very short of breath after walking",
    "My chest feels extremely tight",
    "Coughing non-stop since yesterday",
    
    # Pregnancy / Maternal
    "I am pregnant and have severe bleeding",
    "Pregnant with bad swelling in my legs",
    "Labor pains starting",
    "I had a miscarriage",
    "Morning sickness is very bad",
    "I am pregnant and feel dizzy",
    "Water broke just now",
    "Pregnant and haven't felt baby move",
    "Heavy bleeding during period",
    "Irregular periods for 6 months",
    
    # Mental Health
    "I feel very depressed and sad",
    "Anxiety and panic attacks",
    "I am hearing voices that aren't there",
    "I can't sleep at all",
    "Feeling extremely nervous all the time",
    "I have no energy and feel lonely",
    "Seeing things that are not there",
    "Constant worry and stress",
    "Trouble sleeping and bad dreams",
    "I feel confused and disoriented",
    
    # Snake bite / Poisoning
    "I was bitten by a snake on my leg",
    "I drank rat poison by mistake",
    "My child swallowed a coin",
    "Severe allergic reaction to bee sting",
    "I ate spoiled food and am vomiting",
    "Chemical burns on my hand",
    "Dog bit me on the arm",
    "Swallowed some bleach",
    "I inhaled some toxic fumes",
    "Scorpion stung my foot",
    
    # Eye disease
    "My left eye is red and painful",
    "I can't see clearly, everything is blurry",
    "Seeing double",
    "Light hurts my eyes",
    "Dry itchy eyes",
    "Watery eyes with discharge",
    "I can't see at night",
    "Sudden loss of vision in one eye",
    "Yellow eyes and skin",
    "My eyelids are swollen",
    
    # Ear disease
    "Severe earache in right ear",
    "Pus discharging from my ear",
    "Ringing buzzing sound in my ears",
    "I can't hear properly",
    "My ear is bleeding",
    "Muffled hearing and dizziness",
    "Pain in my ear when I chew",
    "Feeling of fullness in the ear",
    "Deafness in one ear suddenly",
    "Ear hurts very badly",
    
    # Dental disease
    "Terrible toothache on the right side",
    "My gums are bleeding when I brush",
    "I have painful mouth ulcers",
    "Swelling in my jaw",
    "My tooth broke and hurts",
    "Dry mouth and bad breath",
    "Painful swallowing",
    "My mouth is completely dry",
    "Sore throat and difficulty swallowing",
    "White patches on my tongue",
    
    # Children
    "My 2 year old baby is vomiting",
    "Infant has very high fever",
    "My child is not eating anything",
    "Baby has diarrhea and is lethargic",
    "Toddler fell and hit their head",
    "My son has a bad cough",
    "Child is complaining of stomach ache",
    "Baby won't stop crying",
    "My daughter has a rash all over",
    "Child swallowed a toy part",
    
    # Elderly
    "75 year old with severe chest pain",
    "Elderly man confused and lost memory",
    "80 year old fell down and hip hurts",
    "Old woman has urinary incontinence",
    "Grandfather is very dizzy and weak",
    "Senior citizen having trouble breathing",
    "70 year old with swollen ankles",
    "Elderly patient has blood in urine",
    "Old man has tremors in hands",
    "Grandma has blurry vision and falls",
]

def run_tests():
    SearchService.get_instance()
    results_log = []
    
    for i, test in enumerate(TEST_CASES):
        print(f"Testing {i+1}/{len(TEST_CASES)}: {test}")
        session_id = f"test_session_{i}"
        
        # 1. NLP Extraction
        nlp_data = extract_clinical_entities(test)
        symptoms = nlp_data.get("symptoms", [])
        body_parts = nlp_data.get("body_parts", [])
        
        patient_context = {"nlp_data": nlp_data}
        if nlp_data.get("age"):
            patient_context["age"] = nlp_data["age"]
        if nlp_data.get("gender"):
            patient_context["gender"] = nlp_data["gender"]
            
        if not symptoms:
            symptoms = [test]
            
        # 2. Start Screening (Initial search & Top 5)
        payload = start_screening(session_id, symptoms, patient_context, nlp_data.get("negated_symptoms", []))
        
        # Check if screening completed immediately
        if payload.get("screening_complete"):
            final_payload = payload
            top_diseases = [d["name"] for d in final_payload.get("running_scores", [])]
            first_q = None
        else:
            top_diseases = [d["name"] for d in payload.get("running_scores", [])]
            first_q = payload.get("question")
            
            # 3. Complete Screening to get Summary
            final_payload = calculate_result(session_id)
        
        log_entry = {
            "query": test,
            "extracted_symptoms": symptoms,
            "body_parts": body_parts,
            "age": patient_context.get("age"),
            "gender": patient_context.get("gender"),
            "initial_top_retrievals": top_diseases,
            "first_question_selected": first_q.get("text") if first_q else None,
            "first_question_reason": first_q.get("hint") if first_q else None,
            "final_diagnosis": final_payload.get("primary_condition", {}).get("name"),
            "confidence": final_payload.get("confidence_label"),
            "final_summary": final_payload.get("response")
        }
        results_log.append(log_entry)
        
    with open("phase10_validation_report.json", "w") as f:
        json.dump(results_log, f, indent=4)
        
    print(f"Completed 150 test cases. Results saved to phase10_validation_report.json.")

if __name__ == "__main__":
    run_tests()
