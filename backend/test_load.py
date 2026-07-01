import traceback
try:
    from app.services.translation_service import _load_model
    _load_model()
    print("Success")
except Exception as e:
    traceback.print_exc()
