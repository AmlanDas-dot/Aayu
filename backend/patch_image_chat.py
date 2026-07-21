import os

filepath = r"d:\Aayu\backend\app\routers\chat.py"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "class ImageChatResponse(BaseModel):"
idx = content.find(start_marker)
if idx != -1:
    new_endpoint = """class ImageChatResponse(BaseModel):
    imageDescription: str
    possibleConditions: list[dict]
    urgency: str
    recommendations: list[str]
    redFlags: list[str]
    disclaimer: str

@router.post("/image-chat", response_model=ImageChatResponse, summary="Analyze medical image and answer using RAG")
async def image_chat(
    request: Request,
    image: UploadFile = File(...),
    question: str | None = Form(None),
    language: str | None = Form(None),
    session_id: str | None = Form(None),
    uid: str | None = Form(None),
    history: str | None = Form(None),
) -> ImageChatResponse:
    logger.info("========== MEDICAL IMAGE CHAT REQUEST RECEIVED ==========")
    
    if not image or not image.filename:
        raise HTTPException(status_code=400, detail="No image file provided.")

    try:
        from app.services.medical_vision_service import MedicalVisionService
        
        image_bytes = await image.read()
        
        # 1. Vision Analysis (Observable findings & OCR ONLY)
        vision_svc = MedicalVisionService.get_instance()
        description = await vision_svc.analyze_medical_image(image_bytes, image.content_type)
        
        # Normalize question
        user_q = (question or "").strip()
        if not user_q:
            user_q = "Describe this medical image and advise."
            
        english_question = user_q
        if language and language != "en":
            try:
                english_question = translate_to_english(user_q, language)
            except Exception:
                pass
                
        # 2. RAG Search
        rag_query = f"Question: {english_question}. Visible findings: {description}"
        search_results = []
        llm_context = "No specific knowledge found."
        
        try:
            svc = SearchService.get_instance()
            raw_results = svc.hybrid_search(query=rag_query, collection="all", top_k=5)
            search_results = [r for r in raw_results if r.get("score", 0) >= 0.58][:5]
            context_parts = [f"{doc.get('title', '')}: {doc.get('content', '')}" for doc in search_results]
            if context_parts:
                llm_context = "\\n\\n".join(context_parts)
        except Exception as exc:
            logger.error(f"[ImageChat] RAG Search failed: {exc}")

        # 3. LLM Synthesis (Structured JSON)
        guidance = await vision_svc.generate_structured_health_guidance(
            description=description,
            rag_context=llm_context,
            user_question=english_question
        )
        
        # Translate disclaimer if needed
        disclaimer = guidance.disclaimer
        if language and language != "en":
            try:
                disclaimer = translate_from_english(disclaimer, language)
            except Exception:
                pass
        
        # Ensure we return the model in the correct format
        return ImageChatResponse(
            imageDescription=guidance.imageDescription,
            possibleConditions=[c.model_dump() for c in guidance.possibleConditions],
            urgency=guidance.urgency,
            recommendations=guidance.recommendations,
            redFlags=guidance.redFlags,
            disclaimer=disclaimer
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ImageChat] Unhandled error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
"""
    # The file ends at the end of the image_chat endpoint.
    content = content[:idx] + new_endpoint
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully patched chat.py")
