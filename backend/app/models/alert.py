from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class AlertSchema(BaseModel):
    id: str
    title: str
    summary: str
    description: str
    category: str
    severity: str  # Critical, High, Moderate, Low, Informational
    confidence: float
    source: str
    source_url: Optional[str] = None
    created_at: str
    updated_at: str
    expires_at: str
    
    # Location Hierarchy
    country: str = "India"
    state: str = "All"
    district: str = "All"
    block: str = "All"
    village: str = "All"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    affected_population: Optional[int] = None
    
    # Role-based Actions
    recommendations: List[str] = Field(default_factory=list)
    doctor_actions: List[str] = Field(default_factory=list)
    asha_actions: List[str] = Field(default_factory=list)
    citizen_actions: List[str] = Field(default_factory=list)
    hospital_actions: List[str] = Field(default_factory=list)
    
    tags: List[str] = Field(default_factory=list)
    status: str = "Active" # Active, Expired, Resolved
    ai_summary: str = ""
    raw_payload_reference: Optional[str] = None

    def to_dict(self):
        return self.model_dump()
