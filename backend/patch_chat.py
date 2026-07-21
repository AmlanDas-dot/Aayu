import os

filepath = r"d:\Aayu\backend\app\routers\chat.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

split_str = '    return {"title": title}'
parts = content.split(split_str)

if len(parts) >= 2:
    base_content = parts[0] + split_str
    
    image_chat_code = """

# ---------------------------------------------------------------------------
# /image-chat  — Chat with image endpoint
# ---------------------------------------------------------------------------

class ImageChatResponse(BaseModel):
    success: bool
    image_description: str
    answer: str
    triage: str
    warnings: list[str]
    confidence: str
    is_medical_record: bool = False

@router.post("/image-chat", response_model=ImageChatResponse, summary="Analyze image with Vision Service and answer using RAG")
async def image_chat(
    request: Request,
    image: UploadFile = File(...),
    question: str | None = Form(None),
    language: str | None = Form(None),
    session_id: str | None = Form(None),
    history: str | None = Form(None),
) -> ImageChatResponse:
    logger.info("========== IMAGE CHAT REQUEST RECEIVED ==========")
    
    if not image or not image.filename:
        raise HTTPException(status_code=400, detail="No image file provided.")

    try:
        from app.services.vision_service import VisionService
        
        # Read bytes
        image_bytes = await image.read()
        
        # Call Vision Service
        vision_svc = VisionService.get_instance()
        warnings = []
        try:
            description, warnings_list, is_medical_record = await vision_svc.generate_description(
                image_bytes, image.filename, image.content_type
            )
            warnings.extend(warnings_list)
        except ValueError as ve:
            logger.warning("[ImageChat] Image validation failed: %s", ve)
            raise HTTPException(status_code=400, detail=str(ve))
        except RuntimeError as re:
            logger.error("[ImageChat] Vision execution failed: %s", re)
            raise HTTPException(status_code=500, detail=str(re))
            
        # Normalize and translate question
        user_q = (question or "").strip()
        if not user_q:
            user_q = "Describe this image."
            
        english_question = user_q
        if language and language != "en":
            try:
                english_question = translate_to_english(user_q, language)
                logger.info("[ImageChat] Translated question (%s→en): '%s'", language, english_question[:60])
            except Exception:
                logger.error("[ImageChat] Question translation failed:\\n%s", traceback.format_exc())

        # RAG Search: Query ChromaDB with findings and question
        rag_query = f"Question: {english_question}. Visible findings: {description}"
        search_results = []
        llm_context = "No specific knowledge found."
        
        try:
            svc = SearchService.get_instance()
            raw_results = svc.hybrid_search(
                query=rag_query,
                collection="all",
                top_k=5,
            )
            _MIN_RELEVANCE_SCORE = 0.58
            search_results = [r for r in raw_results if r.get("score", 0) >= _MIN_RELEVANCE_SCORE][:5]
            context_parts = [f"{doc.get('title', '')}: {doc.get('content', '')}" for doc in search_results]
            if context_parts:
                llm_context = "\\n\\n".join(context_parts)
        except Exception as exc:
            logger.error("[ImageChat] RAG Search failed:\\n%s", traceback.format_exc())

        # Emergency & Triage Check
        emergency_classifier = EmergencyClassifier.get_instance()
        emergency_result = emergency_classifier.classify(english_question)
        
        intent = "disease_information"
        system_prompt = PROMPT_DISEASE_INFO
        
        # LLM Response generation
        llm_query = (
            f"User question: {english_question}\\n"
            f"Observable findings from patient's uploaded image: {description}\\n"
            "Please provide clear, safe, non-diagnostic guidance answering their question using the findings and context."
        )
        
        parsed_history = []
        if history:
            try:
                parsed_history = json.loads(history)
            except Exception:
                logger.error("[ImageChat] Failed to parse history JSON")

        is_online = await check_connectivity()
        try:
            llm_response_text, llm_provider = await get_llm_response(
                query=llm_query,
                context=llm_context,
                language=language,
                prefer_online=is_online,
                history=parsed_history,
                system_prompt=system_prompt
            )
            
            # Back-translation
            if llm_response_text and language and language != "en":
                try:
                    llm_response_text = translate_from_english(llm_response_text, language)
                except Exception as te:
                    logger.error("[ImageChat] Back-translation failed:\\n%s", traceback.format_exc())
        except Exception as exc:
            logger.error("[ImageChat] LLM generation failed:\\n%s", traceback.format_exc())
            llm_response_text = "The AI service is currently unavailable."
            llm_provider = "none"

        # Format final answer with Response Service
        try:
            engine = get_triage_engine()
            triage_obj = engine.assess(english_question)
            t_dict = triage_obj.to_dict() if triage_obj else {
                "risk_level": "routine",
                "matched_rules": [],
                "urgency": "low",
                "confidence": 1.0
            }
            
            response_svc = get_response_service()
            health_resp = response_svc.format_response(
                query=english_question,
                triage=t_dict,
                context_chunks=search_results,
                llm_response=llm_response_text,
            )
            resp_dict = health_resp.to_dict()
            final_answer = resp_dict["response"]
            risk_level = resp_dict["risk_level"]
            confidence_val = str(resp_dict["confidence"])
        except Exception as exc:
            logger.error("[ImageChat] Response formatting failed:\\n%s", traceback.format_exc())
            final_answer = llm_response_text
            risk_level = "routine"
            confidence_val = "1.0"
            
        # Append disclaimer
        disclaimer = MEDICAL_DISCLAIMER
        if language and language != "en":
            try:
                disclaimer = translate_from_english(MEDICAL_DISCLAIMER, language)
            except Exception:
                pass
                
        if disclaimer not in final_answer:
            final_answer = f"{final_answer}\\n\\n{disclaimer}"

        # Map confidence
        try:
            c_float = float(confidence_val)
            if c_float < 0.6:
                confidence_str = "low"
            elif c_float < 0.8:
                confidence_str = "medium"
            else:
                confidence_str = "high"
        except Exception:
            confidence_str = "low"

        return ImageChatResponse(
            success=True,
            image_description=description,
            answer=final_answer,
            triage=risk_level,
            warnings=warnings,
            confidence=confidence_str,
            is_medical_record=is_medical_record
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("[ImageChat] Unhandled error during image chat execution: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal image chat server error: {e}")
"""
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(base_content + image_chat_code)
    print("Successfully patched chat.py")
else:
    print("Could not find split string")
