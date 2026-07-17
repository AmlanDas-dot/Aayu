"""
Clinical Reasoning Service — Phase 4.

Transforms AAYU from FAQ chatbot into a differential-diagnosis engine.
Zero new frameworks. Reuses existing ChromaDB + SearchService.

Provides:
  - get_specialty_collections()  : symptom/intent → targeted ChromaDB collections
  - rank_candidates()            : weighted disease scoring (vector + overlap + urgency + patient)
  - select_next_question()       : maximum-information-gain differential question selection
  - update_hypothesis_scores()   : Bayesian-style confidence update per answer
  - should_stop_screening()      : convergence detection
  - build_reasoning_trace()      : internal debug log (never exposed to users)
"""

from __future__ import annotations

import logging
import re
from typing import Any

from app.services.symptom_dictionary import (
    CANONICAL_QUESTION_TEXT,
    GROUP_C_NEVER,
    GROUP_D_DOCTOR,
    classify_symptom_phrase,
    normalize_text,
    normalize_symptom_phrase,
    question_text_for_phrase,
    rewrite_symptom_phrase,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Specialty Router
# Maps symptom keywords → ordered ChromaDB collections to search first.
# Ordered by clinical priority within each specialty group.
# ---------------------------------------------------------------------------

_SPECIALTY_ROUTING: list[tuple[str, list[str]]] = [
    # Endocrine / Metabolic
    (r"hungry|hunger|always eating|polyphagia|thirst|polyuria|glucose|sugar|diabet|thyroid|hyperthyroid|endocrin|weight (gain|loss)|losing weight|gained weight|lost \d+|gained \d+|\d+\s*kg\b",
     ["chronic_diseases", "nutrition_diseases", "mental_health"]),

    # Cardiology / Chest
    (r"chest|cardiac|heart|palpitat|flutter|tachycard|bradycard|coronary|angina",
     ["chronic_diseases", "emergency_conditions", "first_aid"]),

    # Respiratory / Pulmonology
    (r"breath|lungs?|respiratory|asthma|wheez|cough|sputum|tuberculosis|tb\b|copd|pneumonia",
     ["respiratory_health", "emergency_conditions", "infectious_diseases"]),

    # Maternal / Obstetric
    (r"pregnan|obstetric|maternal|deliver|labour|labor|antenatal|prenatal|fetal|trimester|miscarriage",
     ["maternal_health", "emergency_conditions", "nutrition_diseases"]),

    # Pediatric
    (r"child|baby|infant|pedia|toddler|newborn|adolescent|teen|kid\b",
     ["child_health", "infectious_diseases", "nutrition_diseases"]),

    # Dermatology / Skin
    (r"rash|itch|skin|eczema|dermat|hives|urticaria|psoriasis|acne|wound|sore|lesion",
     ["skin_diseases", "infectious_diseases", "nutrition_diseases"]),

    # Musculoskeletal / Rheumatology
    (r"joint|arthritis|rheuma|bone|ortho|stiffness|swollen joint|back pain|spine|lumbar",
     ["chronic_diseases", "elderly_health", "mens_health"]),

    # Mental Health / Neurology
    (r"depress|anxious|anxiety|stress|mental|mood|sad|lonely|panic|sleep|insomnia|cannot sleep",
     ["mental_health", "chronic_diseases", "substance_abuse"]),
     
    # Neurology
    (r"neuro|brain|seizure|paraly|stroke|numb|tingl|headache|migraine",
     ["chronic_diseases", "emergency_conditions", "elderly_health"]),

    # Memory / Cognitive
    (r"memory|forget|dementia|cognit|alzheimer|confusion|disoriented",
     ["mental_health", "elderly_health", "chronic_diseases"]),

    # GI / Digestive / Abdomen
    (r"diarrh|vomit|stomach|nausea|gi\b|gastr|bowel|stool|constipat|bloat|abdomin|indigest|acid reflux|ulcer|belly|navel|gut",
     ["infectious_diseases", "water_sanitation", "common_diseases"]),

    # Edema / Fluid
    (r"feet? swoll|swollen feet|ankle swoll|edema|fluid retention|puffy",
     ["chronic_diseases", "maternal_health", "elderly_health"]),

    # Urinary / Renal
    (r"urine|urinary|kidney|bladder|nephro|burning urine|frequent urinat",
     ["chronic_diseases", "infectious_diseases", "mens_health"]),

    # Infectious / Febrile
    (r"fever|temperature|malaria|dengue|typhoid|infection|flu|influenza|viral|bacterial",
     ["infectious_diseases", "common_diseases", "child_health", "first_aid"]),

    # Nutrition / Deficiency
    (r"nutrition|vitamin|mineral|deficien|iron|anemia|calci|supplement|malnourish",
     ["nutrition_diseases", "maternal_health", "child_health"]),

    # Oral / Dental / Ear / ENT
    (r"oral|tooth|teeth|gum|dental|toothache|cavity|ear|hear|deaf|tinnitus|vertigo|otitis|ent",
     ["oral_health", "infectious_diseases"]),

    # Eye / Ophthalmology
    (r"eye|vision|blind|blur|conjunctiv|sclera|cornea|pupil|ophthalm",
     ["common_diseases", "infectious_diseases", "chronic_diseases"]),

    # Substance abuse
    (r"substance|alcohol|drink(ing)?|drug|addict|smoke|tobacco|withdrawal",
     ["substance_abuse", "mental_health", "chronic_diseases"]),

    # Elderly / Geriatric
    (r"elderly|senior|old age|geriatric|age related|retirement",
     ["elderly_health", "chronic_diseases", "mental_health"]),

    # Menstrual / Gynaecology
    (r"menstrual|period|cycle|hormonal|gynec|pcos|pcod|ovari|uterus|endometri",
     ["menstrual_health", "maternal_health", "chronic_diseases"]),

    # Men's health
    (r"prostate|erectile|testicular|male sexual|sperm",
     ["mens_health", "chronic_diseases"]),

    # Water / Sanitation
    (r"water|sanitation|contamination|cholera|typhoid water|diarrhea epidemic",
     ["water_sanitation", "infectious_diseases"]),
]

_TAG_BLACKLIST = {
    "z-score", "asymptomatic", "palpable purpura", "relieved by", "worse in",
    "associated with", "history of", "often asymptomatic", "may involve",
    "symptom", "pain", "swelling", "abnormal", "mild", "severe", "moderate",
    "acute", "chronic", "recurrent", "persistent", "intermittent", "gradual",
    "creatinine", "platelet", "platelets", "hemoglobin", "hba1c", "blood sugar",
    "glucose", "oxygen saturation", "spo2", "blood pressure", "x-ray", "scan",
    "ultrasound", "mri", "ct scan", "lab value", "investigation", "ketosis"
}

_QUESTION_MAPPING = {
    "steatorrhea": "Have you noticed oily or greasy stools that are difficult to flush?",
    "polyuria": "Have you been urinating much more frequently than normal?",
    "polydipsia": "Have you been feeling much thirstier than usual?",
    "polyphagia": "Have you been feeling much hungrier than usual?",
    "dyspnea": "Are you finding it difficult to breathe?",
    "hematemesis": "Have you been vomiting blood?",
    "melena": "Are your stools unusually dark, black, or tarry?",
    "hematuria": "Have you noticed any blood in your urine?",
    "nocturia": "Are you waking up frequently at night to urinate?",
    "orthopnea": "Do you feel breathless when lying flat in bed at night?",
    "tachycardia": "Does it feel like your heart is racing or beating unusually fast?",
    "bradycardia": "Is your heart beating much slower than normal?",
    "dysphagia": "Are you having difficulty swallowing food or liquids?",
    "pallor": "Are you looking unusually pale?",
    "pruritus": "Are you experiencing severe itching?",
    "cyanosis": "Have you noticed a bluish discoloration on your lips or fingers?",
    "anorexia": "Have you completely lost your appetite?",
    "pyrexia": "Have you been checking your temperature and found a fever?",
    "weight loss": "Have you noticed any unintentional weight loss recently?",
    "fatigue": "Have you been feeling unusually tired or exhausted?",
    "diarrhea": "Are you experiencing loose or watery stools?",
    "vomiting": "Have you been vomiting?",
    "nausea": "Are you feeling nauseous or sick to your stomach?",
    "headache": "Are you experiencing a severe headache?",
    "fever": "Do you currently have a fever?",
    "chills": "Are you experiencing shivering or chills?",
    "sweating": "Have you been sweating heavily, especially at night?",
    "chest pain": "Are you experiencing any pain or discomfort in your chest?",
    "shortness of breath": "Are you feeling short of breath?",
    "dizziness": "Do you feel dizzy or lightheaded?",
    "fainting": "Have you fainted or passed out recently?",
    "memory loss": "Have you been forgetting recent events or familiar names more than usual?",
    "joint stiffness": "Do your joints feel stiff, especially after resting or in the morning?",
    "persistent cough": "Have you had a cough that has continued for many days or weeks?",
    "anxiety": "Have you been feeling unusually anxious or unable to relax?",
    "depressed mood": "Have you been feeling persistently low or losing interest in daily activities?",
    "leg swelling": "Have you noticed swelling in your legs, ankles, or feet?",
    "blurred vision": "Have you noticed any blurred vision recently?",
}

_SYNONYMS = {
    "nausea": "nausea",
    "feeling sick": "nausea",
    "vomiting": "vomiting",
    "throwing up": "vomiting",
    "diarrhea": "diarrhea",
    "diarrhoea": "diarrhea",
    "loose stools": "diarrhea",
    "watery stools": "diarrhea",
    "fever": "fever",
    "high temperature": "fever",
    "headache": "headache",
    "head pain": "headache",
    "fatigue": "fatigue",
    "tiredness": "fatigue",
    "exhaustion": "fatigue",
    "chest pain": "chest pain",
    "chest discomfort": "chest pain",
    "stomach ache": "abdominal pain",
    "stomach pain": "abdominal pain",
    "abdominal pain": "abdominal pain",
    "always hungry": "polyphagia",
    "constantly hungry": "polyphagia",
    "unusually hungry": "polyphagia",
    "very thirsty": "polydipsia",
    "thirsty all the time": "polydipsia",
    "excessive thirst": "polydipsia",
    "frequent urination": "polyuria",
    "urinating frequently": "polyuria",
    "urinating more often": "polyuria",
    "passing urine often": "polyuria",
    "peeing a lot": "polyuria",
    "shortness of breath": "dyspnea",
    "breathlessness": "dyspnea",
    "difficulty breathing": "dyspnea",
    "breathless when lying flat": "orthopnea",
    "black stools": "melena",
    "tarry stools": "melena",
    "oily stools": "steatorrhea",
    "fatty stools": "steatorrhea",
    "blood in urine": "hematuria",
    "weight reduction": "weight loss",
    "lost weight": "weight loss",
    "losing weight": "weight loss",
    "weight dropping": "weight loss",
    "joint pain": "joint pain",
    "stiff joints": "joint stiffness",
    "memory problems": "memory loss",
    "forgetfulness": "memory loss",
    "persistent cough": "persistent cough",
    "long cough": "persistent cough",
    "low mood": "depressed mood",
    "feeling depressed": "depressed mood",
    "swollen feet": "leg swelling",
    "swollen legs": "leg swelling",
    "ankle swelling": "leg swelling",
}

_QUESTION_EXPLANATIONS = {
    "polyuria": "I am asking because this can help point toward high blood sugar or infection.",
    "polydipsia": "I am asking because this can help point toward high blood sugar or dehydration.",
    "polyphagia": "I am asking because this can help distinguish blood sugar problems from other causes.",
    "weight loss": "I am asking because this helps narrow down the most likely cause.",
    "fatigue": "I am asking because this shows how much the body is being affected.",
    "diarrhea": "I am asking because this helps judge dehydration and infection risk.",
    "vomiting": "I am asking because this helps judge dehydration and urgency.",
    "fever": "I am asking because this helps tell whether infection may be involved.",
    "chest pain": "I am asking because this helps me judge how urgent this may be.",
    "dyspnea": "I am asking because this helps me judge how urgent this may be.",
    "shortness of breath": "I am asking because this helps me judge how urgent this may be.",
    "orthopnea": "I am asking because this can help distinguish heart and lung causes.",
    "headache": "I am asking because this helps narrow down the most likely cause.",
    "memory loss": "I am asking because this helps tell whether this is affecting daily brain function.",
    "joint stiffness": "I am asking because this helps distinguish inflammatory joint problems from other causes.",
    "persistent cough": "I am asking because this helps tell whether this may be a longer-lasting lung problem.",
    "anxiety": "I am asking because this helps me understand whether stress may be playing a role.",
    "depressed mood": "I am asking because this helps me understand how much this is affecting mood and daily life.",
    "leg swelling": "I am asking because this helps distinguish heart, kidney, and fluid-related causes.",
}

def normalize_symptom_concept(text: str) -> str:
    """Collapse synonymous symptom phrases into one concept id."""
    curated = normalize_symptom_phrase(text)
    if curated in CANONICAL_QUESTION_TEXT:
        return curated
    cleaned = normalize_text(text)
    paren_terms = re.findall(r"\(([^)]+)\)", cleaned)
    for term in paren_terms:
        inner = re.sub(r"[^a-z\s-]", " ", term).strip()
        inner = re.sub(r"\s+", " ", inner)
        if inner in _QUESTION_MAPPING or inner in _SYNONYMS:
            cleaned = inner
            break
    cleaned = re.sub(r"\([^)]*\)", "", cleaned)
    cleaned = re.sub(r"[^a-z0-9\s-]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return _SYNONYMS.get(cleaned, cleaned)


def format_question_text(tag: str, patient_context: dict | None = None) -> str:
    """Map raw clinical tag to patient-friendly question with proper perspective."""
    curated_question = question_text_for_phrase(tag)
    lower_tag = normalize_symptom_concept(tag)
    
    if not curated_question:
        if lower_tag in _QUESTION_MAPPING:
            curated_question = _QUESTION_MAPPING[lower_tag]
        elif lower_tag.endswith("ing"):
            curated_question = f"Are you {lower_tag}?"
        elif "pain" in lower_tag or "ache" in lower_tag:
            curated_question = f"Are you experiencing any {lower_tag}?"
        else:
            curated_question = f"Have you been experiencing {lower_tag}?"

    from app.services.conversation_service import personalize_subject, get_pronouns
    ctx = patient_context or {}
    subject = personalize_subject(ctx)
    pronouns = get_pronouns(ctx)

    if subject.lower() != "you":
        q = curated_question
        q = re.sub(r"(?i)\bHave you\b", f"Has {subject}", q)
        q = re.sub(r"(?i)\bAre you\b", f"Is {subject}", q)
        q = re.sub(r"(?i)\bDo you\b", f"Does {subject}", q)
        q = re.sub(r"(?i)\byour\b", pronouns["pos"], q)
        q = re.sub(r"(?i)\byou\b", subject, q)
        return q

    return curated_question


def get_question_explanation(tag: str) -> str:
    """Return a short, patient-friendly reason for the follow-up question."""
    lower_tag = normalize_symptom_concept(tag)
    return _QUESTION_EXPLANATIONS.get(
        lower_tag,
        "I am asking because this helps narrow down the most likely cause.",
    )


def _split_candidate_values(raw: str) -> list[str]:
    if not raw:
        return []
    if "||" in raw:
        return [part.strip() for part in raw.split("||") if part.strip()]
    return [part.strip() for part in raw.split(",") if part.strip()]

_COMPILED_ROUTING = [
    (re.compile(pat, re.IGNORECASE), cols)
    for pat, cols in _SPECIALTY_ROUTING
]


def get_specialty_collections(query: str) -> list[str]:
    """
    Return ordered list of ChromaDB collections most relevant to the query.
    Multiple patterns can match; collections are merged by first-match priority.
    Falls back to ['all'] if nothing matches.
    """
    matched: list[str] = []
    seen: set[str] = set()
    for pattern, collections in _COMPILED_ROUTING:
        if pattern.search(query):
            for c in collections:
                if c not in seen:
                    matched.append(c)
                    seen.add(c)
    return matched if matched else ["all"]


# ---------------------------------------------------------------------------
# Weighted Disease Ranker
# ---------------------------------------------------------------------------

_URGENCY_BOOST: dict[str, float] = {
    "emergency": 0.12, "high": 0.08, "medium": 0.04, "low": 0.0, "": 0.0,
}

_AGE_COLLECTION_BOOST: list[tuple] = [
    # (predicate, {collection: boost})
    (lambda a: a < 12,                   {"child_health": 0.10, "infectious_diseases": 0.05}),
    (lambda a: a > 60,                   {"elderly_health": 0.10, "chronic_diseases": 0.05}),
    (lambda a: 18 <= a <= 45,            {"menstrual_health": 0.03, "maternal_health": 0.02}),
]

_GENDER_COLLECTION_BOOST: dict[str, dict[str, float]] = {
    "female": {"maternal_health": 0.05, "menstrual_health": 0.08, "mens_health": -0.05},
    "male":   {"mens_health": 0.05, "menstrual_health": -0.10, "maternal_health": -0.08},
}


def _apply_red_flag_overrides(scored: list[dict], symptoms: list[str], is_pregnant: bool, is_infant: bool) -> list[dict]:
    has_abdominal_pain = any("abdominal pain" in s.lower() or "stomach pain" in s.lower() or "belly pain" in s.lower() for s in symptoms)
    has_high_fever = any("104" in s or "high fever" in s.lower() or "very hot" in s.lower() for s in symptoms)
    has_chest_pain = any("chest pain" in s.lower() or "crushing chest" in s.lower() for s in symptoms)
    has_vision_loss = any("vision loss" in s.lower() or "blind" in s.lower() for s in symptoms)
    has_altered_mental = any("unconscious" in s.lower() or "faint" in s.lower() or "lethargic" in s.lower() for s in symptoms)

    for r in scored:
        title = r.get("title", "").lower()
        if is_pregnant and has_abdominal_pain:
            if "ectopic" in title or "abruption" in title or "preeclampsia" in title or "hellp" in title or "preterm" in title:
                r["clinical_score"] += 1.0 
        if is_infant and has_high_fever:
            if "meningitis" in title or "sepsis" in title or "bacterial" in title:
                r["clinical_score"] += 1.0
        if has_chest_pain and ("heart attack" in title or "myocardial" in title or "coronary" in title):
            r["clinical_score"] += 1.0
        if has_vision_loss and ("stroke" in title or "retinal" in title):
            r["clinical_score"] += 1.0
        if has_altered_mental and ("stroke" in title or "sepsis" in title or "poison" in title):
            r["clinical_score"] += 1.0
            
    return scored



def rank_candidates(
    results: list[dict],
    symptoms: list[str],
    patient_context: dict | None = None,
) -> list[dict]:
    ctx = patient_context or {}
    age: int | None = None
    raw_age = ctx.get("age")
    if raw_age is not None:
        try:
            age = int(raw_age)
        except (ValueError, TypeError):
            age = None
    gender = str(ctx.get("gender", "")).lower()
    conditions = [str(c).lower() for c in ctx.get("conditions", [])]
    nlp_data = ctx.get("nlp_data", {})
    body_parts = nlp_data.get("body_parts", [])

    scored: list[dict] = []
    
    is_infant = age is not None and age <= 1
    is_pregnant = bool(ctx.get("pregnancy_related"))
    is_elderly = age is not None and age >= 65
    
    # Check for known conditions
    has_diabetes = any("diabet" in c for c in conditions)
    has_hypertension = any("hypertension" in c or "bp" in c or "blood pressure" in c for c in conditions)

    for r in results:
        # De-weight pure embedding score
        score = float(r.get("score", 0.0)) * 0.4
        
        collection = r.get("collection", "")
        tags_raw = str(r.get("tags", "")).lower()
        question_candidates = str(r.get("question_candidates", "")).lower()
        raw_symptoms = str(r.get("raw_symptoms", "")).lower()
        title_lower = r.get("title", "").lower()
        combined_text = " ".join([title_lower, tags_raw, question_candidates, raw_symptoms])

        # Prior Probability based on Prevalence
        is_rare = "rare" in combined_text or "uncommon" in combined_text or title_lower in ["kawasaki disease", "tularemia", "q fever", "leptospirosis", "yellow fever"]
        is_common = "common" in combined_text or "viral" in combined_text or "bacterial" in combined_text
        
        if is_rare:
            score -= 0.35 # Stronger prior penalty for rare diseases
        elif is_common:
            score += 0.20 # Stronger prior boost for common diseases

        # Context Weighting
        if is_pregnant:
            if collection == "maternal_health":
                score += 0.60  # Massive boost for obstetric causes
            elif is_rare:
                score -= 0.50  # Heavily penalize unrelated rare diseases in pregnancy
        
        if is_infant:
            if collection == "child_health":
                score += 0.30
            if "sepsis" in title_lower or "meningitis" in title_lower or "bacterial infection" in title_lower:
                score += 0.40  # Boost serious bacterial infections for infants
                
        if is_elderly:
            if collection == "elderly_health" or collection == "chronic_diseases":
                score += 0.20

        # Heavy symptom overlap bonus and Evidence Penalty
        matched_any = False
        matched_essential = False
        essential_matches = 0
        total_symptoms = len(symptoms)
        
        for sym in symptoms:
            sym_lower = sym.lower()
            sym_norm = normalize_symptom_concept(sym)
            aliases = {sym_lower, sym_norm.replace("_", " "), rewrite_symptom_phrase(sym) or ""}
            aliases = {alias.lower().strip() for alias in aliases if alias}
            
            if any(alias in title_lower for alias in aliases):
                score += 0.35
                matched_any = True
                matched_essential = True
                essential_matches += 1
            elif any(alias in combined_text for alias in aliases):
                score += 0.15
                matched_any = True
                essential_matches += 1
                
        # Evidence Penalty: If the patient has multiple symptoms, and the disease only matches one vaguely
        if not matched_any:
            score -= 0.60
        elif total_symptoms > 1 and essential_matches == 1 and not matched_essential:
            score -= 0.30 # Substantial penalty if missing essential findings

        # Body part match bonus
        for bp in body_parts:
            if bp.lower() in combined_text:
                score += 0.05

        # Urgency boost
        urgency = r.get("urgency", "").lower()
        score += _URGENCY_BOOST.get(urgency, 0.0)

        # Patient age affinity
        if age is not None:
            for predicate, boosts in _AGE_COLLECTION_BOOST:
                try:
                    if predicate(age):
                        score += boosts.get(collection, 0.0)
                except Exception:
                    pass

        # Patient gender affinity / Absolute Demographic Filters
        if gender in _GENDER_COLLECTION_BOOST:
            score += _GENDER_COLLECTION_BOOST[gender].get(collection, 0.0)
            
        # Hard zero multipliers for impossible conditions
        if gender == "male" and collection in ["maternal_health", "menstrual_health"]:
            score = 0.0
        elif gender == "female" and collection == "mens_health":
            score = 0.0
        elif age is not None and age > 18 and collection == "child_health":
            score = 0.0
        elif age is not None and age < 40 and collection == "elderly_health":
            score *= 0.5

        final_score = round(min(max(score, 0.0), 1.0), 4)
        if final_score >= 0.30:
            scored.append({**r, "clinical_score": final_score})

    # Red Flag Overrides (apply after scoring)
    scored = _apply_red_flag_overrides(scored, symptoms, is_pregnant, is_infant)

    scored.sort(key=lambda x: x["clinical_score"], reverse=True)
    return scored


# ---------------------------------------------------------------------------
# Differential Question Selector  (heart of the engine)
# ---------------------------------------------------------------------------

def select_next_question(
    top_diseases: list[dict],
    asked_symptoms: list[str],
    denied_symptoms: list[str],
) -> dict | None:
    """
    Selects the symptom that best differentiates the top 3 hypotheses.
    Returns {"symptom": str, "reason": str} or None.
    """
    def _normalize_symptom(s: str) -> str:
        return normalize_symptom_concept(s)

    excluded = set(_normalize_symptom(s) for s in asked_symptoms + denied_symptoms)
    # Phase 10: Restrict to top 3 hypotheses for strong differentiation
    top_3 = top_diseases[:3]
    n = len(top_3)
    if n == 0:
        return None

    symptom_to_diseases: dict[str, list[str]] = {}
    
    for disease in top_3:
        d_score = float(disease.get("clinical_score", disease.get("score", 0)))
        if d_score < 0.35 and len(top_3) > 2:
            continue
            
        did = disease.get("title", disease["id"])
            
        q_cand = disease.get("question_candidates")
        if q_cand is not None:
            question_source = q_cand
        else:
            question_source = disease.get("raw_symptoms") or disease.get("tags", "")
            
        for tag in _split_candidate_values(str(question_source)):
            raw_tag = tag.strip().lower()
            tag = _normalize_symptom(raw_tag)
            group, _ = classify_symptom_phrase(raw_tag)
            rewritten = rewrite_symptom_phrase(raw_tag)
            if rewritten:
                tag = _normalize_symptom(rewritten)
            has_curated_question = bool(
                question_text_for_phrase(tag) or question_text_for_phrase(raw_tag)
            )
            token_count = len(tag.replace("_", " ").split())
            
            # Phase 6: Tag Blacklisting
            if any(bl in tag for bl in _TAG_BLACKLIST):
                continue
            if group in {GROUP_C_NEVER, GROUP_D_DOCTOR}:
                continue
                
            # Filter: non-trivial, not already asked, not too long, not numeric
            if (len(tag) < 5 or token_count > 6) and not has_curated_question:
                continue
            if tag in excluded:
                continue
            if token_count < 2 and not has_curated_question and raw_tag not in _QUESTION_MAPPING:
                continue
            if re.match(r"^[\d\s.,-]+$", tag):
                continue
                
            # Phase 11: Enforce CANONICAL SYMPTOMS ONLY
            # If the tag is not recognized as a canonical symptom, drop it.
            # This completely prevents asking about disease names or database jargon.
            if tag not in CANONICAL_QUESTION_TEXT:
                continue

            is_redundant = any(
                (tag in exc or exc in tag)
                for exc in excluded
                if len(exc) > 3
            )
            if not is_redundant:
                if tag not in symptom_to_diseases:
                    symptom_to_diseases[tag] = []
                if did not in symptom_to_diseases[tag]:
                    symptom_to_diseases[tag].append(did)

    if not symptom_to_diseases:
        return None

    best_sym: str | None = None
    best_gain: float = -1.0
    best_diseases: list[str] = []
    
    for sym, diseases in symptom_to_diseases.items():
        count = len(diseases)
        p = count / n
        gain = 1.0 - abs(p - 0.5) * 2
        gain *= 0.6 + 0.4 * min(count / max(n, 1), 1.0)
        
        # We really want symptoms that appear in 1 or 2 diseases but not all 3
        if 0 < count < n:
            gain += 0.5
            
        # Phase 11: Favor high-impact clinical symptoms early
        high_impact_keywords = ["fever", "pain", "bleed", "vomit", "diarrhea", "swell", "numb", "weak", "breath", "vision"]
        if any(kw in sym.lower() for kw in high_impact_keywords):
            gain += 0.3
            
        if gain > best_gain:
            best_gain = gain
            best_sym = sym
            best_diseases = diseases

    if not best_sym:
        return None
        
    reason = "I'm asking because it helps narrow down the cause of your symptoms."
        
    return {"symptom": best_sym, "reason": reason}


# ---------------------------------------------------------------------------
# Confidence Engine
# ---------------------------------------------------------------------------

def update_hypothesis_scores(
    hypothesis_scores: dict[str, float],
    question_id: str,
    answer: str,
    top_diseases: list[dict],
) -> dict[str, float]:
    """
    Update per-disease confidence scores based on a Yes/No answer.

    "yes"      → +0.10 for diseases whose tags contain the symptom
    "no"       → −0.12 for diseases whose tags contain the symptom
    "not sure" → no change (uncertainty preserved)
    """
    ans = answer.lower().strip()
    if ans == "not sure":
        return hypothesis_scores

    updated = dict(hypothesis_scores)
    q_lower = normalize_symptom_concept(question_id)

    for disease in top_diseases:
        did = disease["id"]
        tags_lower = " ".join(
            _split_candidate_values(
                str(
                    disease.get("question_candidates")
                    or disease.get("raw_symptoms")
                    or disease.get("tags", "")
                )
            )
        ).lower()
        title_lower = disease.get("title", "").lower()
        normalized_tags = {
            normalize_symptom_concept(tag.strip())
            for tag in _split_candidate_values(tags_lower)
            if tag.strip()
        }
        has_symptom = q_lower in normalized_tags or q_lower in title_lower

        current = updated.get(did, float(disease.get("clinical_score", disease.get("score", 0.5))))
        if has_symptom:
            if ans == "yes":
                updated[did] = round(min(current + 0.10, 1.0), 4)
            elif ans == "no":
                # Phase 6: Negative Symptom Weighting - aggresively penalize if disease requires symptom
                updated[did] = round(max(current - 0.25, 0.0), 4)
        else:
            # Weak counter-evidence: disease doesn't have this symptom but user said yes
            if ans == "yes":
                updated[did] = round(max(current - 0.03, 0.0), 4)

    return updated


# ---------------------------------------------------------------------------
# Stop Condition
# ---------------------------------------------------------------------------

def should_stop_screening(
    hypothesis_scores: dict[str, float],
    questions_asked: int,
    max_questions: int = 5,
    confidence_threshold: float = 0.88,
) -> tuple[bool, str]:
    """
    Return (should_stop, reason).

    Stops when:
      - max questions reached
      - top score >= confidence_threshold
      - top disease leads second by > 0.20 (convergence)
    """
    if questions_asked >= max_questions:
        return True, "max_questions_reached"
    if not hypothesis_scores:
        return False, ""
    sorted_scores = sorted(hypothesis_scores.values(), reverse=True)
    top = sorted_scores[0]
    if top >= confidence_threshold:
        return True, f"confidence_{top:.2f}"
    if len(sorted_scores) >= 2 and (top - sorted_scores[1]) > 0.20:
        return True, f"convergence_gap_{top - sorted_scores[1]:.2f}"
    return False, ""


# ---------------------------------------------------------------------------
# Internal Reasoning Trace  (logged only, never sent to user)
# ---------------------------------------------------------------------------

def build_reasoning_trace(
    intent: str,
    symptoms: list[str],
    specialty_collections: list[str],
    top_diseases: list[dict],
    selected_question: str | None,
    hypothesis_scores: dict[str, float],
    patient_context: dict | None = None,
    denied_symptoms: list[str] | None = None,
) -> dict[str, Any]:
    """Build internal reasoning trace. Store in logs only."""
    return {
        "intent": intent,
        "extracted_symptoms": symptoms,
        "positive_evidence": symptoms,
        "negative_evidence": denied_symptoms or [],
        "specialty_collections": specialty_collections,
        "top_hypotheses": [
            {
                "id": d["id"],
                "title": d.get("title", ""),
                "clinical_score": d.get("clinical_score", d.get("score", 0)),
                "urgency": d.get("urgency", ""),
            }
            for d in top_diseases[:5]
        ],
        "rejected_hypotheses": [
            {
                "id": d["id"],
                "title": d.get("title", ""),
                "clinical_score": d.get("clinical_score", d.get("score", 0)),
            }
            for d in top_diseases[5:10]
            if d.get("clinical_score", d.get("score", 0)) < 0.45
        ],
        "hypothesis_scores": dict(list(hypothesis_scores.items())[:5]),
        "selected_question": selected_question,
        "question_selection_reason": get_question_explanation(selected_question or ""),
        "confidence_snapshot": sorted(hypothesis_scores.values(), reverse=True)[:5],
        "patient_context_fields": list((patient_context or {}).keys()),
    }


import json

async def evaluate_reasoning_with_llm(
    patient_context: dict,
    symptoms: list[str],
    denied_symptoms: list[str],
    top_diseases: list[dict],
    llm_weight: float = 0.35
) -> list[dict]:
    from app.services.llm_service import get_llm_response
    
    if not top_diseases:
        return top_diseases
        
    prompt = (
        "You are an expert clinician reviewing an AI diagnostic engine's output.\n"
        "Your task is to re-rank the top 5 hypotheses based on clinical plausibility, "
        "strongly penalizing rare diseases unless specific findings demand them. "
        "Boost common serious conditions if appropriate for age/context.\n\n"
        f"PATIENT CONTEXT: {json.dumps(patient_context)}\n"
        f"POSITIVE FINDINGS: {symptoms}\n"
        f"NEGATIVE FINDINGS: {denied_symptoms}\n\n"
        "CURRENT BAYESIAN TOP 5:\n"
    )
    for idx, d in enumerate(top_diseases[:5]):
        prompt += f"{idx+1}. {d.get('title', d['id'])} (Score: {d.get('clinical_score', 0):.2f})\n"
        
    prompt += (
        "\nProvide your output strictly in JSON format matching exactly:\n"
        "{\n"
        '  "ranking": [\n'
        '    {"disease_id": "...", "confidence": 0.85, "reason": "..."}\n'
        "  ],\n"
        '  "recommended_emergency_level": "routine|urgent|emergency",\n'
        '  "clinical_notes": "...",\n'
        '  "contradictions": ["..."]\n'
        "}\n"
        "Do not invent new diseases not in the list unless the top 5 are fundamentally impossible. Use 'disease_id' matching the given titles or ids."
    )
    
    try:
        response, provider = await get_llm_response(
            query="Evaluate clinical ranking",
            context=prompt,
            prefer_online=True,
            system_prompt="You are an expert clinical reasoning API. Output ONLY valid JSON.",
            max_tokens=800
        )
        
        json_match = re.search(r'\{.*\}', response.strip(), re.DOTALL)
        if json_match:
            data = json.loads(json_match.group(0))
            llm_ranking = {item.get("disease_id", "").lower(): float(item.get("confidence", 0.0)) for item in data.get("ranking", [])}
            
            bayesian_weight = 1.0 - llm_weight
            for d in top_diseases:
                title = d.get("title", d["id"]).lower()
                llm_score = 0.0
                for k, v in llm_ranking.items():
                    if k in title or title in k:
                        llm_score = v
                        break
                old_score = float(d.get("clinical_score", 0.0))
                if llm_score > 0:
                    d["clinical_score"] = round((old_score * bayesian_weight) + (llm_score * llm_weight), 3)
                    
            top_diseases.sort(key=lambda x: x["clinical_score"], reverse=True)
            logger.info("[LLM Reasoning] Re-ranked candidates using %s.", provider)
    except Exception as e:
        logger.error("[LLM Reasoning] Failed or invalid JSON: %s", e)
        
    return top_diseases
