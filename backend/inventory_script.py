import json
import os
import glob
import asyncio
import sys

from app.services.vector_db_service import VectorDBService
from app.services.search_service import SearchService

def safe_print(*args, **kwargs):
    s = " ".join(str(a) for a in args)
    print(s.encode('ascii', 'ignore').decode('ascii'), **kwargs)

async def main():
    safe_print("=== Q1: JSON FILES ===")
    data_dir = os.path.join(os.path.dirname(__file__), "app", "data")
    all_json = glob.glob(os.path.join(data_dir, "**", "*.json"), recursive=True)
    
    total_diseases = 0
    total_nutrition = 0
    total_schemes = 0
    total_hospitals = 0
    
    for jf in all_json:
        try:
            with open(jf, 'r', encoding='utf-8') as f:
                data = json.load(f)
                count = len(data) if isinstance(data, list) else 1
                safe_print(f"File: {os.path.basename(jf)} | Path: {os.path.relpath(jf, data_dir)} | Entries: {count}")
                
                if "healthknowledge" in jf:
                    total_diseases += count
                elif "nutrition" in jf:
                    total_nutrition += count
                elif "schemes" in jf:
                    total_schemes += count
                elif "hospitals" in jf:
                    total_hospitals += count
        except Exception as e:
            safe_print(f"Error reading {jf}: {e}")

    safe_print("\n=== Q2 & Q3: CHROMA COLLECTIONS ===")
    db = VectorDBService.get_instance()
    # the client object has list_collections in older chromadb
    try:
        collections = db.client.list_collections()
        for c in collections:
            count = c.count()
            safe_print(f"Collection: {c.name} | Docs: {count}")
    except Exception as e:
        safe_print(f"Could not list collections: {e}")

    safe_print("\n=== Q4: SAMPLE METADATA ===")
    try:
        results = db.search("infectious_diseases", "dengue", top_k=1)
        if results:
            safe_print(f"Sample Metadata: {results[0]['metadata']}")
        else:
            safe_print("No results found in infectious_diseases")
    except Exception as e:
        safe_print(f"Error fetching metadata: {e}")

    search_svc = SearchService.get_instance()

    safe_print("\n=== Q5: SEARCH HUNGER ===")
    try:
        res = search_svc.hybrid_search("hunger", "all", top_k=10)
        for r in res:
            safe_print(f"- {r.get('id')} ({r.get('score')}): {r.get('title')}")
    except Exception as e:
        safe_print(f"Search failed: {e}")

    safe_print("\n=== Q6: SEARCH FEVER ===")
    try:
        res = search_svc.hybrid_search("fever", "all", top_k=10)
        for r in res:
            safe_print(f"- {r.get('id')} ({r.get('score')}): {r.get('title')}")
    except Exception as e:
        safe_print(f"Search failed: {e}")

    safe_print("\n=== Q7: SEARCH CHEST PAIN ===")
    try:
        res = search_svc.hybrid_search("chest pain", "all", top_k=10)
        for r in res:
            safe_print(f"- {r.get('id')} ({r.get('score')}): {r.get('title')}")
    except Exception as e:
        safe_print(f"Search failed: {e}")
        
    safe_print(f"\n=== Q9: COUNTS ===")
    safe_print(f"Total Diseases: {total_diseases}")
    safe_print(f"Total Nutrition: {total_nutrition}")
    safe_print(f"Total Schemes: {total_schemes}")
    safe_print(f"Total Hospitals: {total_hospitals}")


if __name__ == "__main__":
    asyncio.run(main())
