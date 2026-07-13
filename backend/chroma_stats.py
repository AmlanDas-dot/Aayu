import os
import sys

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.services.vector_db_service import VectorDBService

def analyze_chroma():
    db = VectorDBService.get_instance()
    collections = db.list_collections()
    print("--- CHROMA COLLECTIONS ---")
    for c in collections:
        count = db.collection_count(c)
        col = db.get_or_create_collection(c)
        try:
            # Get 1 document to see metadata
            res = col.get(limit=1, include=["metadatas"])
            meta = res["metadatas"][0] if res["metadatas"] else "None"
        except:
            meta = "Error"
        print(f"Collection: {c} | Docs: {count} | Sample Metadata: {meta}")

if __name__ == "__main__":
    analyze_chroma()
