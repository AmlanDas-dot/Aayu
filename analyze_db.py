import os
import json
from collections import Counter, defaultdict

data_dir = r"d:\Aayu\backend\app\data\healthknowledge"
files = [f for f in os.listdir(data_dir) if f.endswith(".json")]

all_diseases = []
category_counts = Counter()
category_diseases = defaultdict(list)
symptom_to_diseases = defaultdict(list)
disease_to_symptoms = {}
disease_to_entry = {}

# Load all files
for file_name in files:
    file_path = os.path.join(data_dir, file_name)
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Ensure it is a list
            if isinstance(data, list):
                for entry in data:
                    if "id" in entry:
                        # Normalize category
                        category = entry.get("category", "Unknown")
                        all_diseases.append(entry)
                        category_counts[category] += 1
                        category_diseases[category].append(entry.get("id"))
                        
                        symptoms = entry.get("symptoms", [])
                        norm_symptoms = [s.strip().lower() for s in symptoms]
                        disease_to_symptoms[entry["id"]] = norm_symptoms
                        disease_to_entry[entry["id"]] = entry
                        
                        for sym in norm_symptoms:
                            symptom_to_diseases[sym].append(entry["id"])
    except Exception as e:
        print(f"Error reading {file_name}: {e}")

total_diseases = len(all_diseases)

# Compute symptom metrics
all_symptom_tokens = []
for syms in disease_to_symptoms.values():
    all_symptom_tokens.extend(syms)

symptom_counts = Counter(all_symptom_tokens)
unique_symptoms_count = len(symptom_counts)
most_common_50 = symptom_counts.most_common(50)

shared_symptoms = {sym: dis for sym, dis in symptom_to_diseases.items() if len(dis) > 1}
unique_symptoms = {sym: dis[0] for sym, dis in symptom_to_diseases.items() if len(dis) == 1}

# Write output to file in utf-8
output_file = r"d:\Aayu\analysis_output.txt"
with open(output_file, "w", encoding="utf-8") as out:
    out.write(f"TOTAL DISEASES: {total_diseases}\n")
    out.write(f"CATEGORIES COUNT: {len(category_counts)}\n")
    out.write("\nCATEGORIES AND COUNTS:\n")
    for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
        out.write(f"- {cat}: {count} diseases\n")
        out.write(f"  Diseases: {', '.join(category_diseases[cat][:5])} ...\n")

    out.write(f"\nUNIQUE SYMPTOMS COUNT: {unique_symptoms_count}\n")
    out.write("\n50 MOST COMMON SYMPTOMS:\n")
    for sym, count in most_common_50:
        out.write(f"- {sym}: {count} matches\n")

    # Let's inspect some disease differentiation details for Dengue, Malaria, Influenza, Typhoid
    target_diseases = ["dengue", "malaria", "influenza", "typhoid", "cold", "fever"]
    out.write("\nDIFFERENTIATION FOR TARGET DISEASES:\n")
    for target in target_diseases:
        # Look up in database by ID
        entry = None
        for item in all_diseases:
            if item["id"].lower() == target or item["id"].lower().startswith(target):
                entry = item
                break
        if entry:
            out.write(f"\nTarget ID: {entry['id']} (Category: {entry.get('category')})\n")
            symptom_list = disease_to_symptoms[entry["id"]]
            out.write(f"Symptoms: {symptom_list}\n")
            # Find unique symptoms (appear only in this disease or very few)
            unique_here = []
            for s in symptom_list:
                match_count = len(symptom_to_diseases[s])
                if match_count == 1:
                    unique_here.append(f"{s} (fully unique)")
                elif match_count <= 5:
                    unique_here.append(f"{s} (semi-unique: matches {match_count} diseases: {', '.join(symptom_to_diseases[s])})")
            out.write(f"Differentiating/Unique indicators: {unique_here}\n")
        else:
            out.write(f"\nTarget ID {target} NOT found\n")

    # Emergency conditions check
    out.write("\nEMERGENCY / CRITICAL URGENCY ENTRIES:\n")
    critical_entries = []
    for item in all_diseases:
        urgency = str(item.get("urgency", "")).lower()
        if urgency in ["critical", "high", "emergency", "urgent"]:
            critical_entries.append((item["id"], item.get("category"), urgency, item.get("symptoms", [])))
    out.write(f"Total critical/high/emergency/urgent entries: {len(critical_entries)}\n")
    for cid, ccat, urg, syms in critical_entries:
        out.write(f"- {cid} ({ccat}) -> Urgency: {urg}\n  Symptoms: {syms}\n")

print("Analysis script updated.")
