"""
Curated symptom dictionary and metadata cleanup helpers.

This module sits between raw knowledge-base symptom text and the clinical
question generator. It does not change the reasoning engine. It only decides
which symptom phrases are safe to expose to patients, which need rewriting,
and which should never become questions.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

GROUP_A_SAFE = "A_safe"
GROUP_B_REWRITE = "B_rewrite"
GROUP_C_NEVER = "C_never"
GROUP_D_DOCTOR = "D_doctor"

FIELD_GROUP_A = "A_safe_for_questions"
FIELD_GROUP_B = "B_needs_rewriting"
FIELD_GROUP_C = "C_never_question_source"
FIELD_GROUP_D = "D_doctor_only"

METADATA_FIELD_GROUPS = {
    "id": FIELD_GROUP_C,
    "title": FIELD_GROUP_B,
    "category": FIELD_GROUP_B,
    "aliases": FIELD_GROUP_B,
    "summary": FIELD_GROUP_C,
    "description": FIELD_GROUP_C,
    "content": FIELD_GROUP_C,
    "guidance": FIELD_GROUP_C,
    "precautions": FIELD_GROUP_D,
    "first_aid": FIELD_GROUP_D,
    "symptoms": FIELD_GROUP_A,
    "risk_factors": FIELD_GROUP_B,
    "history": FIELD_GROUP_A,
    "duration": FIELD_GROUP_A,
    "severity": FIELD_GROUP_A,
    "location": FIELD_GROUP_A,
    "clinical_findings": FIELD_GROUP_B,
    "notes": FIELD_GROUP_D,
    "pathology": FIELD_GROUP_D,
    "histology": FIELD_GROUP_D,
    "microscopy": FIELD_GROUP_D,
    "epidemiology": FIELD_GROUP_D,
    "differential_diagnosis": FIELD_GROUP_D,
    "management": FIELD_GROUP_D,
    "treatment": FIELD_GROUP_D,
    "prognosis": FIELD_GROUP_D,
    "tags": FIELD_GROUP_B,
}


@dataclass(frozen=True)
class SymptomEntry:
    canonical: str
    friendly: str
    question: str
    synonyms: tuple[str, ...]


SYMPTOM_ENTRIES: tuple[SymptomEntry, ...] = (
    SymptomEntry("itching", "itching", "Have you been feeling itchy?", ("itch", "itching", "itchy", "pruritus", "pruritic")),
    SymptomEntry("swelling", "swelling", "Have you noticed any swelling?", ("swelling", "swollen", "edema", "oedema", "puffy")),
    SymptomEntry("rash", "rash", "Have you noticed a rash on the skin?", ("rash", "rashes", "eruption", "skin eruption")),
    SymptomEntry("ring_shaped_rash", "a ring-shaped rash", "Does the rash look ring-shaped?", ("ring-shaped rash", "ring shaped rash", "annular rash", "annular", "ring-shaped", "ring shaped", "ringworm-like rash")),
    SymptomEntry("central_clearing", "a rash with a lighter center and a ring around it", "Does the rash have a lighter center with a ring around it?", ("central clearing",)),
    SymptomEntry("diarrhea", "loose or watery stools", "Are you having loose or watery stools?", ("diarrhea", "diarrhoea", "loose stools", "watery stools")),
    SymptomEntry("vomiting", "vomiting", "Have you been vomiting?", ("vomiting", "vomit", "throwing up", "emesis")),
    SymptomEntry("nausea", "feeling sick to the stomach", "Are you feeling sick to your stomach or like you may vomit?", ("nausea", "queasy", "feeling sick")),
    SymptomEntry("fever", "fever", "Do you have a fever?", ("fever", "pyrexia", "high temperature")),
    SymptomEntry("fatigue", "unusual tiredness", "Have you been feeling unusually tired?", ("fatigue", "tiredness", "exhaustion", "weakness")),
    SymptomEntry("weight_loss", "unintentional weight loss", "Have you noticed any unintentional weight loss?", ("weight loss", "losing weight", "lost weight")),
    SymptomEntry("frequent_urination", "urinating much more often than usual", "Have you been urinating much more often than usual?", ("polyuria", "frequent urination", "urinating more often", "peeing a lot")),
    SymptomEntry("excessive_thirst", "feeling much thirstier than usual", "Have you been feeling much thirstier than usual?", ("polydipsia", "excessive thirst", "very thirsty", "thirsty all the time")),
    SymptomEntry("increased_hunger", "feeling much hungrier than usual", "Have you been feeling much hungrier than usual?", ("polyphagia", "constantly hungry", "always hungry", "increased hunger")),
    SymptomEntry("black_stools", "black or tar-like stools", "Have your stools looked black or tar-like?", ("melena", "black stools", "tarry stools")),
    SymptomEntry("oily_stools", "oily stools that are hard to flush", "Have your stools looked oily or difficult to flush?", ("steatorrhea", "oily stools", "greasy stools")),
    SymptomEntry("shortness_of_breath", "shortness of breath", "Are you feeling short of breath?", ("dyspnea", "breathlessness", "difficulty breathing", "shortness of breath")),
    SymptomEntry("breathless_lying_flat", "difficulty breathing when lying flat", "Does it become difficult to breathe when lying flat?", ("orthopnea", "breathless when lying flat")),
    SymptomEntry("joint_pain", "joint pain", "Are you having pain in a joint?", ("joint pain", "painful joints", "knee pain", "left knee hurts", "right knee hurts")),
    SymptomEntry("joint_stiffness", "joint stiffness", "Do your joints feel stiff, especially after resting?", ("joint stiffness", "stiff joints", "morning stiffness")),
    SymptomEntry("back_pain", "back pain", "Are you having back pain?", ("back pain", "lower back pain")),
    SymptomEntry("chest_pain", "chest pain", "Are you having chest pain or discomfort?", ("chest pain", "chest discomfort", "tightness in the chest")),
    SymptomEntry("cough", "cough", "Have you been coughing?", ("cough", "persistent cough", "chronic cough", "long cough")),
    SymptomEntry("redness", "redness", "Have you noticed redness?", ("erythema", "erythematous", "redness", "red")),
    SymptomEntry("small_bumps", "small bumps on the skin", "Have you noticed many small bumps on the skin?", ("papules", "small bumps", "papular")),
    SymptomEntry("pus_filled_bumps", "pus-filled bumps", "Have you noticed any pus-filled bumps?", ("pustules", "pus filled bumps")),
    SymptomEntry("raised_patch", "a raised patch on the skin", "Have you noticed a raised patch on the skin?", ("plaque", "plaques", "raised patch", "raised patches")),
    SymptomEntry("purple_spots", "purple or red spots on the skin", "Have you noticed purple or red spots on the skin?", ("purpura", "purple spots", "red purple spots")),
    SymptomEntry("cracks_in_skin", "cracks in the skin", "Have you noticed painful cracks in the skin?", ("fissures", "skin cracks", "cracks in the skin")),
    SymptomEntry("peeling_skin", "peeling skin", "Is the skin peeling?", ("peeling", "flaking", "scaly", "scaling")),
    SymptomEntry("burning", "burning", "Do you feel any burning in that area?", ("burning", "burning sensation")),
    SymptomEntry("tingling", "tingling or numbness", "Have you had tingling or numbness?", ("tingling", "numbness", "neuropathy")),
    SymptomEntry("vision_blur", "blurred vision", "Have you noticed blurred vision?", ("blurred vision", "vision loss", "retinopathy")),
)

CANONICAL_BY_PHRASE = {
    phrase: entry
    for entry in SYMPTOM_ENTRIES
    for phrase in (entry.canonical, entry.friendly, *entry.synonyms)
}

MEDICAL_REPLACEMENTS = {
    "annular": "ring-shaped",
    "erythematous": "red",
    "erythema": "redness",
    "papules": "small bumps",
    "papule": "small bump",
    "pustules": "pus-filled bumps",
    "pustule": "pus-filled bump",
    "plaques": "raised patches",
    "plaque": "raised patch",
    "purpura": "purple spots",
    "violaceous": "purple",
    "maceration": "soft, damaged skin",
    "macerated": "soft and damaged",
    "fissures": "cracks",
    "fissure": "crack",
    "pruritic": "itchy",
    "pruritus": "itching",
    "xerosis": "dryness",
    "telangiectasia": "visible small blood vessels",
    "lichenification": "thickened skin from scratching",
    "rhinophyma": "thickening of the skin on the nose",
    "dorsa": "backs",
    "distal": "farther away",
    "proximal": "closer",
    "ataxia": "poor balance",
    "hypotonia": "reduced muscle tone",
    "keratomalacia": "softening of the front of the eye",
    "nyctalopia": "difficulty seeing in low light",
    "verrucous": "rough",
    "nodules": "lumps",
    "nodule": "lump",
    "lesion": "spot",
    "lesions": "spots",
    "vesicles": "small fluid-filled blisters",
    "urticarial": "itchy raised",
    "excoriation": "scratched skin",
    "erythematous": "red",
    "annular": "ring-shaped",
    "macules": "flat spots",
    "macule": "flat spot",
    "maculopapular": "flat and raised spots",
    "petechiae": "tiny red spots",
    "ecchymosis": "bruising",
    "alopecia": "hair loss",
    "desquamation": "peeling skin",
    "pallor": "pale skin",
    "cyanosis": "bluish skin",
    "jaundice": "yellowing of the skin",
    "diaphoresis": "heavy sweating",
    "syncope": "fainting",
    "tachycardia": "fast heart rate",
    "bradycardia": "slow heart rate",
    "dysphagia": "difficulty swallowing",
    "odynophagia": "painful swallowing",
    "hematemesis": "vomiting blood",
    "hemoptysis": "coughing up blood",
    "epistaxis": "nosebleed",
    "hematuria": "blood in urine",
    "nocturia": "waking up to urinate",
    "dysuria": "painful urination",
    "myalgia": "muscle pain",
    "arthralgia": "joint pain",
    "neuralgia": "nerve pain",
    "photophobia": "sensitivity to light",
    "tinnitus": "ringing in the ears",
    "vertigo": "dizziness or spinning sensation",
}

NEVER_EXPOSE_PATTERNS = [
    re.compile(pattern, re.IGNORECASE)
    for pattern in [
        r"\bmay resolve spontaneously\b",
        r"\bresolve spontaneously\b",
        r"\bself[- ]limiting\b",
        r"\breassurance\b",
        r"\bdifferential diagnosis\b",
        r"\bhistolog",
        r"\bpatholog",
        r"\bmicroscop",
        r"\bbiopsy\b",
        r"\bepidemiolog",
        r"\bbenign\b",
        r"\bmalignan",
        r"\bprognosis\b",
        r"\bdiagnosis\b",
        r"\btreatment\b",
        r"\bsurgical\b",
        r"\bprocedure\b",
        r"\bprophylactic\b",
        r"\bantibiotic\b",
        r"\bcorticosteroid\b",
        r"\bcalcineurin\b",
        r"\bbiologic",
        r"\bmetronidazole\b",
        r"\bimmunosuppress",
        r"\bhypertriglycer",
        r"\babetalipoprotein",
        r"\bbell-clapper\b",
        r"\bteratogenic\b",
        r"\bophthalmology\b",
        r"\bneurology\b",
        r"\bpulmonary function\b",
        r"\bimaging\b",
        r"\bvcug\b",
        r"\bvoiding cystourethrogram\b",
        r"\bmay be associated with\b",
        r"\bassociated with\b",
        r"\bsecondary to\b",
        r"\bdue to\b",
        r"\boccurs in\b",
        r"\bseen in\b",
        r"\bsudden eruption of\b",
        r"\bmost common\b",
        r"\bmore common in\b",
        r"\brare\b",
        r"\bcan present as\b",
        r"\bmay present as\b",
        r"\bcharacterized by\b",
        r"\bcaused by\b",
        r"\bresults from\b",
        r"\bdevelops in\b",
        r"\boften seen in\b",
        r"\busually affects\b",
        r"\bfamily history\b",
        r"\bsyndrome\b",
        r"\banomaly\b",
        r"\bmalabsorption\b",
        r"\bhemorrhagic\b",
        r"\bintracranial\b",
        r"\bproximal myopathy\b",
        r"\bobserv(ed|able) on\b",
        r"\bfree under\b",
        r"\bgovernment\b",
        r"\breferral\b",
        r"\bresolves within\b",
        r"\bresolves in\b",
        r"\bdisease\b",
        r"\bcondition\b",
        r"\binfection\b",
        r"\bvirus\b",
        r"\bbacteria\b",
        r"\bfungus\b",
        r"\bparasite\b",
        r"\bmild to severe\b",
        r"\basymptomatic\b",
        r"\buncomplicated\b",
        r"\bcomplicated\b",
    ]
]

DOCTOR_ONLY_PATTERNS = [
    re.compile(pattern, re.IGNORECASE)
    for pattern in [
        r"\bassociated with\b",
        r"\bsecondary to\b",
        r"\bdue to\b",
        r"\boccurs in\b",
        r"\bseen in\b",
        r"\bfree under\b",
        r"\bgovernment\b",
        r"\breferral\b",
        r"\bsyndrome\b",
        r"\banomaly\b",
        r"\bmalabsorption\b",
        r"\bhemorrhagic\b",
        r"\bintracranial\b",
        r"\bproximal myopathy\b",
        r"\bobserv(ed|able) on\b",
    ]
]

PHRASE_REWRITES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bcentral clearing\b", re.I), "a lighter center with a ring around it"),
    (re.compile(r"\bsudden eruption of\b", re.I), "sudden appearance of"),
    (re.compile(r"\bmay have\b", re.I), ""),
    (re.compile(r"\boften on dorsa of hands and feet\b", re.I), "often on the backs of the hands and feet"),
    (re.compile(r"\bbilateral, sparing the scrotum\b", re.I), "on both sides while the scrotum is not affected"),
    (re.compile(r"\bthickened skin from chronic scratching\b", re.I), "skin thickening from repeated scratching"),
    (re.compile(r"\bwell-demarcated\b", re.I), "well-defined"),
    (re.compile(r"\bnon-blanching\b", re.I), "that do not fade when pressed"),
    (re.compile(r"\bvermilion border\b", re.I), "edge of the lips"),
    (re.compile(r"\brachitic rosary\b", re.I), "beading along the ribs"),
    (re.compile(r"\bheliotrope rash\b", re.I), "a purple rash around the eyelids"),
    (re.compile(r"\bgottron'?s papules\b", re.I), "raised red spots over the knuckles"),
]

CANONICAL_QUESTION_TEXT = {entry.canonical: entry.question for entry in SYMPTOM_ENTRIES}
CANONICAL_FRIENDLY_TEXT = {entry.canonical: entry.friendly for entry in SYMPTOM_ENTRIES}


def normalize_text(text: str) -> str:
    normalized = text.lower().strip()
    normalized = normalized.replace("–", "-").replace("—", "-").replace("’", "'")
    normalized = re.sub(r"\([^)]*\)", "", normalized)
    normalized = re.sub(r"[^a-z0-9\s\-/]", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def normalize_symptom_phrase(text: str) -> str:
    normalized = normalize_text(text)
    if normalized in CANONICAL_BY_PHRASE:
        return CANONICAL_BY_PHRASE[normalized].canonical
    for phrase, entry in CANONICAL_BY_PHRASE.items():
        if phrase and phrase in normalized:
            return entry.canonical
    return normalized


def classify_metadata_field(field_name: str) -> str:
    return METADATA_FIELD_GROUPS.get(field_name, FIELD_GROUP_D)


def classify_symptom_phrase(phrase: str) -> tuple[str, str]:
    text = phrase.strip()
    normalized = normalize_text(text)

    if not normalized:
        return GROUP_C_NEVER, "empty"

    for pattern in NEVER_EXPOSE_PATTERNS:
        if pattern.search(normalized):
            return GROUP_C_NEVER, f"matched never-expose pattern: {pattern.pattern}"

    for pattern in DOCTOR_ONLY_PATTERNS:
        if pattern.search(normalized):
            return GROUP_D_DOCTOR, f"matched doctor-only pattern: {pattern.pattern}"

    if normalized in CANONICAL_BY_PHRASE:
        return GROUP_A_SAFE, "matched curated symptom phrase"

    if any(term in normalized for term in MEDICAL_REPLACEMENTS):
        return GROUP_B_REWRITE, "contains medical term that needs rewriting"

    if any(search.search(phrase) for search, _ in PHRASE_REWRITES):
        return GROUP_B_REWRITE, "contains phrase that needs rewriting"

    if normalized.endswith((" with", " without", " and", " or", " of", " due")):
        return GROUP_C_NEVER, "dangling fragment"

    if len(normalized.split()) <= 1 and normalized not in ["fever", "chills", "nausea", "vomiting", "diarrhea", "fatigue", "headache", "cough", "sneezing", "wheezing"]:
        return GROUP_C_NEVER, "too short to be a useful patient question source"

    return GROUP_A_SAFE, "plain descriptive symptom phrase"


def _strip_doctor_only_clauses(text: str) -> str:
    clauses = re.split(r"[;]|(?:,\s*(?=associated with|often in|usually in|due to|occurs in|seen in))", text, flags=re.I)
    return clauses[0].strip()


def rewrite_symptom_phrase(phrase: str) -> str | None:
    group, _ = classify_symptom_phrase(phrase)
    if group == GROUP_C_NEVER:
        return None

    original = phrase.strip()
    normalized = normalize_text(original)

    if normalized in CANONICAL_BY_PHRASE:
        entry = CANONICAL_BY_PHRASE[normalized]
        return entry.friendly

    for search, replacement in PHRASE_REWRITES:
        original = search.sub(replacement, original)

    original = _strip_doctor_only_clauses(original)
    original = re.sub(r"\([^)]*\)", "", original)
    for src, dst in MEDICAL_REPLACEMENTS.items():
        original = re.sub(rf"\b{re.escape(src)}\b", dst, original, flags=re.I)

    original = re.sub(r"\bmay be\b", "", original, flags=re.I)
    original = re.sub(r"\busually\b", "", original, flags=re.I)
    original = re.sub(r"\boften\b", "", original, flags=re.I)
    original = re.sub(r"\bcan be\b", "", original, flags=re.I)
    original = re.sub(r"\bcould be\b", "", original, flags=re.I)
    original = re.sub(r"\s+", " ", original.replace(" ,", ",")).strip(" .,-")
    original = original.replace(" ,", ",").replace("  ", " ")

    if not original:
        return None

    normalized_rewritten = normalize_text(original)
    if len(normalized_rewritten) < 4:
        return None
    if normalized_rewritten.endswith((" with", " without", " and", " or", " of", " due")):
        return None

    canonical = normalize_symptom_phrase(normalized_rewritten)
    if canonical in CANONICAL_FRIENDLY_TEXT:
        return CANONICAL_FRIENDLY_TEXT[canonical]

    return original[0].lower() + original[1:] if original else None


def question_text_for_phrase(phrase: str) -> str | None:
    canonical = normalize_symptom_phrase(phrase)
    if canonical in CANONICAL_QUESTION_TEXT:
        return CANONICAL_QUESTION_TEXT[canonical]

    rewritten = rewrite_symptom_phrase(phrase)
    if not rewritten:
        return None

    lowered = rewritten.lower().strip()
    if lowered.startswith(("a ", "an ", "the ")):
        return f"Have you noticed {lowered}?"
    if any(token in lowered for token in ["pain", "itch", "burn", "numb", "tingling", "swelling", "redness"]):
        return f"Have you noticed {lowered}?"
    if lowered.endswith("skin") or lowered.endswith("rash"):
        return f"Have you noticed {lowered}?"
    return f"Have you experienced {lowered}?"


def _extract_curated_candidates(text: str) -> list[str]:
    normalized = normalize_text(text)
    if not normalized:
        return []

    extracted: list[str] = []
    seen: set[str] = set()

    if "central clearing" in normalized and "central_clearing" not in seen:
        extracted.append(CANONICAL_FRIENDLY_TEXT["central_clearing"])
        seen.add("central_clearing")

    ring_tokens = ("annular" in normalized or "ring-shaped" in normalized or "ring shaped" in normalized)
    ring_context = any(token in normalized for token in ("rash", "plaque", "patch", "papules", "lesion", "eruption"))
    if ring_tokens and ring_context and "ring_shaped_rash" not in seen:
        extracted.append(CANONICAL_FRIENDLY_TEXT["ring_shaped_rash"])
        seen.add("ring_shaped_rash")

    for entry in SYMPTOM_ENTRIES:
        phrases = [entry.canonical, entry.friendly, *entry.synonyms]
        if any(phrase and normalize_text(phrase) in normalized for phrase in phrases):
            if entry.canonical in seen:
                continue
            extracted.append(entry.friendly)
            seen.add(entry.canonical)

    return extracted


def build_question_candidates(symptoms: list[str]) -> tuple[list[str], list[dict[str, Any]]]:
    accepted: list[str] = []
    issues: list[dict[str, Any]] = []
    seen: set[str] = set()

    for phrase in symptoms:
        group, reason = classify_symptom_phrase(phrase)
        rewritten = rewrite_symptom_phrase(phrase)
        candidate_values = _extract_curated_candidates(phrase)
        if rewritten:
            candidate_values.extend(_extract_curated_candidates(rewritten))
        issue_record = {
            "phrase": phrase,
            "group": group,
            "reason": reason,
            "rewritten": rewritten,
        }

        if not candidate_values and rewritten:
            candidate_values = [rewritten]

        if not candidate_values:
            issues.append(issue_record)
            continue

        for candidate in candidate_values:
            normalized = normalize_symptom_phrase(candidate)
            if normalized not in seen:
                seen.add(normalized)
                accepted.append(candidate)

        if group != GROUP_A_SAFE:
            issues.append(issue_record)

    return accepted, issues


def score_generated_question(question_text: str) -> tuple[int, list[str]]:
    score = 10
    issues: list[str] = []
    lowered = question_text.lower().strip()

    if not lowered.endswith("?"):
        score -= 1
        issues.append("not phrased as a question")
    if any(pattern.search(lowered) for pattern in NEVER_EXPOSE_PATTERNS):
        score -= 6
        issues.append("contains forbidden doctor-only language")
    if any(term in lowered for term in MEDICAL_REPLACEMENTS):
        score -= 3
        issues.append("contains unreplaced medical jargon")
    if re.search(r"\b(with|without|and|or|of)\?$", lowered):
        score -= 4
        issues.append("ends as a sentence fragment")
    if len(lowered.split()) < 4:
        score -= 2
        issues.append("too short")
    if "?" in lowered[:-1]:
        score -= 2
        issues.append("contains malformed punctuation")

    return max(score, 1), issues
