import os
import json

data_dir = r"d:\Aayu\backend\app\data\healthknowledge"
files = sorted([f for f in os.listdir(data_dir) if f.endswith(".json")])

output_file = r"d:\Aayu\file_counts.txt"
with open(output_file, "w", encoding="utf-8") as out:
    total_all = 0
    out.write("FILE COUNTS AND TOPICS:\n")
    for file_name in files:
        file_path = os.path.join(data_dir, file_name)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                count = len(data) if isinstance(data, list) else 0
                total_all += count
                # Extract unique categories
                categories = set()
                for item in data:
                    if "category" in item:
                        categories.add(item["category"])
                out.write(f"- {file_name}: {count} entries (Unique categories: {len(categories)})\n")
        except Exception as e:
            out.write(f"- {file_name}: Error {e}\n")
    out.write(f"\nTOTAL ALL ENTRIES: {total_all}\n")

print("File count script completed.")
