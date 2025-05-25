from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
import os
from dotenv import load_dotenv
from typing import Optional, List, Dict, Any
import google.generativeai as genai
from github import Github
import httpx
import json
import uuid
from datetime import datetime
import asyncio

# Load environment variables
load_dotenv()

app = FastAPI(title="YazWho Empire Dashboard", version="2.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
MONGO_URL = os.getenv("MONGO_URL")
client = AsyncIOMotorClient(MONGO_URL)
db = client.yazwho_empire

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GITHUB_PAT = os.getenv("GITHUB_PAT")
GOOGLE_OAUTH_CLIENT_ID = os.getenv("GOOGLE_OAUTH_CLIENT_ID")
GOOGLE_OAUTH_CLIENT_SECRET = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET")

# Initialize Gemini AI
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Initialize GitHub
github_client = None
if GITHUB_PAT:
    github_client = Github(GITHUB_PAT)

# Pydantic Models
class StatusResponse(BaseModel):
    status: str
    message: str
    timestamp: str

class DeploymentRequest(BaseModel):
    project_name: str
    repository_url: str
    description: Optional[str] = None
    target_platform: str = "vercel"  # vercel, netlify, etc.

class AIEnhancementRequest(BaseModel):
    musicjam_feature: str
    enhancement_type: str  # recommendation, playlist, social, etc.
    user_preferences: Optional[Dict[str, Any]] = None

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    repository_url: str
    description: Optional[str] = None
    status: str = "pending"  # pending, deploying, deployed, failed
    deployment_url: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class MusicJamEnhancement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    feature_name: str
    enhancement_type: str
    ai_suggestion: Optional[str] = None
    implementation_status: str = "planned"  # planned, implementing, deployed
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())

# Empire Dashboard Routes
@app.get("/api", response_model=StatusResponse)
async def root():
    return StatusResponse(
        status="success",
        message="🚀 YazWho Empire Dashboard is operational! Ready to dominate the music universe!",
        timestamp=datetime.now().isoformat()
    )

@app.get("/api/status", response_model=StatusResponse)
async def status():
    # Check all integrations
    integrations = {
        "mongodb": "connected" if client else "disconnected",
        "gemini_ai": "configured" if GEMINI_API_KEY else "missing_key",
        "github": "connected" if github_client else "missing_token",
        "google_oauth": "configured" if GOOGLE_OAUTH_CLIENT_ID else "missing_credentials"
    }
    
    return StatusResponse(
        status="success",
        message=f"Empire Dashboard Status: {json.dumps(integrations)}",
        timestamp=datetime.now().isoformat()
    )

@app.get("/api/empire/overview")
async def empire_overview():
    """Get overview of entire YazWho Empire"""
    try:
        projects_count = await db.projects.count_documents({})
        enhancements_count = await db.musicjam_enhancements.count_documents({})
        
        # Check MusicJam status
        musicjam_status = await check_musicjam_status()
        
        return {
            "empire_status": "operational",
            "musicjam_app": musicjam_status,
            "managed_projects": projects_count,
            "ai_enhancements": enhancements_count,
            "integrations": {
                "github": "active" if github_client else "inactive",
                "ai_engine": "gemini" if GEMINI_API_KEY else "inactive",
                "oauth": "google" if GOOGLE_OAUTH_CLIENT_ID else "inactive"
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Empire overview failed: {str(e)}")

async def check_musicjam_status():
    """Check status of live MusicJam application"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("https://musicjam.yazwho.com/", timeout=5.0)
            if response.status_code == 200:
                return {"status": "online", "url": "https://musicjam.yazwho.com/"}
            else:
                return {"status": "issues", "code": response.status_code}
    except:
        return {"status": "offline", "url": "https://musicjam.yazwho.com/"}

# GitHub Integration Routes
@app.get("/api/github/repositories")
async def get_repositories():
    """Get user's GitHub repositories"""
    if not github_client:
        raise HTTPException(status_code=400, detail="GitHub integration not configured")
    
    try:
        user = github_client.get_user()
        repos = []
        for repo in user.get_repos(sort="updated", direction="desc")[:20]:
            repos.append({
                "name": repo.name,
                "full_name": repo.full_name,
                "description": repo.description,
                "url": repo.html_url,
                "clone_url": repo.clone_url,
                "language": repo.language,
                "stars": repo.stargazers_count,
                "updated_at": repo.updated_at.isoformat() if repo.updated_at else None
            })
        return {"repositories": repos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub API error: {str(e)}")

@app.post("/api/github/deploy")
async def deploy_project(deployment: DeploymentRequest, background_tasks: BackgroundTasks):
    """Deploy a project to specified platform"""
    try:
        # Create project record
        project = Project(
            name=deployment.project_name,
            repository_url=deployment.repository_url,
            description=deployment.description,
            status="deploying"
        )
        
        await db.projects.insert_one(project.dict())
        
        # Start deployment in background
        background_tasks.add_task(process_deployment, project.dict())
        
        return {
            "message": "Deployment initiated",
            "project_id": project.id,
            "status": "deploying"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deployment failed: {str(e)}")

async def process_deployment(project_data: dict):
    """Background task to process deployment"""
    try:
        # Simulate deployment process
        await asyncio.sleep(2)
        
        # Update project status
        await db.projects.update_one(
            {"id": project_data["id"]},
            {"$set": {
                "status": "deployed",
                "deployment_url": f"https://{project_data['name']}.vercel.app",
                "updated_at": datetime.now().isoformat()
            }}
        )
    except Exception as e:
        await db.projects.update_one(
            {"id": project_data["id"]},
            {"$set": {
                "status": "failed",
                "updated_at": datetime.now().isoformat()
            }}
        )

# AI Enhancement Routes
@app.post("/api/ai/musicjam/enhance")
async def enhance_musicjam(enhancement: AIEnhancementRequest):
    """Use AI to suggest MusicJam enhancements"""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=400, detail="Gemini AI not configured")
    
    try:
        # Create AI prompt
        prompt = f"""
        Suggest improvements for the MusicJam music application feature: {enhancement.musicjam_feature}
        Enhancement type: {enhancement.enhancement_type}
        User preferences: {enhancement.user_preferences or 'None specified'}
        
        Provide specific, actionable suggestions for implementation including:
        1. Technical approach
        2. User experience improvements
        3. Integration possibilities
        4. Code snippets if applicable
        
        Focus on creating engaging music discovery and social features.
        """
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        # Save enhancement suggestion
        enhancement_record = MusicJamEnhancement(
            feature_name=enhancement.musicjam_feature,
            enhancement_type=enhancement.enhancement_type,
            ai_suggestion=response.text
        )
        
        await db.musicjam_enhancements.insert_one(enhancement_record.dict())
        
        return {
            "enhancement_id": enhancement_record.id,
            "ai_suggestion": response.text,
            "feature": enhancement.musicjam_feature,
            "type": enhancement.enhancement_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI enhancement failed: {str(e)}")

@app.get("/api/ai/recommendations/music")
async def get_music_recommendations(mood: str = "happy", genre: str = "any"):
    """Get AI-powered music recommendations"""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=400, detail="Gemini AI not configured")
    
    try:
        prompt = f"""
        Generate music recommendations for:
        Mood: {mood}
        Genre preference: {genre}
        
        Provide 5 song recommendations with:
        1. Song title and artist
        2. Why it fits the mood/genre
        3. Spotify search query format
        
        Format as JSON array.
        """
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        return {
            "recommendations": response.text,
            "mood": mood,
            "genre": genre,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Music recommendation failed: {str(e)}")

# Project Management Routes
@app.get("/api/projects")
async def get_projects():
    """Get all managed projects"""
    try:
        projects = await db.projects.find({}, {"_id": 0}).to_list(100)
        return {"projects": projects}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch projects: {str(e)}")

@app.get("/api/projects/{project_id}")
async def get_project(project_id: str):
    """Get specific project details"""
    try:
        project = await db.projects.find_one({"id": project_id}, {"_id": 0})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch project: {str(e)}")

@app.get("/api/musicjam/enhancements")
async def get_musicjam_enhancements():
    """Get all MusicJam AI enhancements"""
    try:
        enhancements = await db.musicjam_enhancements.find({}, {"_id": 0}).to_list(100)
        return {"enhancements": enhancements}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch enhancements: {str(e)}")

# Deployment Routes
@app.post("/api/deploy/enhancement")
async def deploy_enhancement(deployment_request: dict):
    """Deploy a specific AI enhancement to MusicJam"""
    try:
        enhancement_id = deployment_request.get("enhancement_id")
        deployment_target = deployment_request.get("deployment_target", "staging")
        
        if not enhancement_id:
            raise HTTPException(status_code=400, detail="enhancement_id is required")
            
        # Get enhancement from database
        enhancement = await db.musicjam_enhancements.find_one({"id": enhancement_id}, {"_id": 0})
        if not enhancement:
            raise HTTPException(status_code=404, detail="Enhancement not found")
        
        # Create deployment plan
        deployment_plan = await create_deployment_plan(enhancement)
        
        # Create deployment record
        deployment = {
            "id": str(uuid.uuid4()),
            "enhancement_id": enhancement_id,
            "target": deployment_target,
            "status": "deploying",
            "deployment_plan": deployment_plan,
            "created_at": datetime.now().isoformat()
        }
        
        await db.deployments.insert_one(deployment)
        
        return {
            "deployment_id": deployment["id"],
            "status": "initiated",
            "deployment_plan": deployment_plan,
            "target": deployment_target
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deployment failed: {str(e)}")

async def create_deployment_plan(enhancement):
    """Create a detailed deployment plan using AI"""
    if not GEMINI_API_KEY:
        return {"plan": "AI deployment planning not available - Gemini API not configured"}
    
    try:
        prompt = f"""
        Create a detailed deployment plan for this MusicJam enhancement:
        
        Feature: {enhancement['feature_name']}
        Type: {enhancement['enhancement_type']}
        AI Suggestion: {enhancement['ai_suggestion'][:1000]}...
        
        Generate a step-by-step deployment plan including:
        1. Prerequisites and dependencies
        2. Database schema changes (if needed)
        3. API endpoint modifications
        4. Frontend component updates
        5. Testing strategy
        6. Rollback plan
        7. Performance considerations
        8. User communication plan
        
        Make it actionable and specific for a React/FastAPI/MongoDB stack.
        """
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        return {
            "plan": response.text,
            "estimated_duration": "2-4 hours",
            "complexity": "medium",
            "risk_level": "low"
        }
    except Exception as e:
        return {"plan": f"AI deployment planning failed: {str(e)}"}

@app.get("/api/deploy/status")
async def get_deployment_status():
    """Get status of all deployments"""
    try:
        deployments = await db.deployments.find({}, {"_id": 0}).to_list(100)
        return {"deployments": deployments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch deployments: {str(e)}")

@app.post("/api/generate/component")
async def generate_react_component(component_request: dict):
    """Generate React component code for MusicJam enhancement"""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=400, detail="Gemini AI not configured")
    
    try:
        prompt = f"""
        Generate a complete React component for MusicJam with the following requirements:
        
        Component Name: {component_request.get('component_name', 'EnhancedFeature')}
        Feature Type: {component_request.get('feature_type', 'general')}
        Description: {component_request.get('description', 'No description provided')}
        
        Requirements:
        - Use modern React hooks (useState, useEffect)
        - Include proper styling with Tailwind CSS
        - Add proper error handling
        - Include loading states
        - Make it responsive for mobile and desktop
        - Add proper accessibility attributes
        - Include TypeScript if possible
        - Follow MusicJam design patterns (dark theme, music-focused UI)
        
        Generate complete, production-ready component code.
        """
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        return {
            "component_code": response.text,
            "component_name": component_request.get('component_name', 'EnhancedFeature'),
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Component generation failed: {str(e)}")

@app.post("/api/musicjam/simulate-deploy")
async def simulate_musicjam_deployment(enhancement_id: str):
    """Simulate deployment to MusicJam for testing"""
    try:
        enhancement = await db.musicjam_enhancements.find_one({"id": enhancement_id}, {"_id": 0})
        if not enhancement:
            raise HTTPException(status_code=404, detail="Enhancement not found")
        
        # Update enhancement status
        await db.musicjam_enhancements.update_one(
            {"id": enhancement_id},
            {"$set": {
                "implementation_status": "implementing", 
                "deployment_simulation": {
                    "simulated_at": datetime.now().isoformat(),
                    "status": "success",
                    "target_url": "https://musicjam.yazwho.com/",
                    "estimated_impact": "High user engagement improvement"
                }
            }}
        )
        
        return {
            "status": "simulation_complete",
            "enhancement_id": enhancement_id,
            "feature": enhancement['feature_name'],
            "simulation_result": "Successfully simulated deployment to MusicJam",
            "next_steps": "Ready for production deployment",
            "target_url": "https://musicjam.yazwho.com/"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")
# MusicJam Application Routes
class JamSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    location: str
    max_participants: Optional[int] = None
    date: str
    start_time: str
    end_time: Optional[str] = None
    skill_level: str  # All Levels, Beginner, Intermediate, Advanced
    genres: List[str] = []
    tab_playlist_id: Optional[str] = None
    status: str = "upcoming"  # upcoming, ongoing, completed
    created_by: str = "user"
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class TabPlaylist(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    tabs: List[Dict[str, str]] = []  # [{title, artist, tab_url, youtube_url}]
    genres: List[str] = []
    created_by: str = "user"
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())

@app.get("/api/musicjam/jam-sessions")
async def get_jam_sessions(
    status: Optional[str] = None,
    genre: Optional[str] = None,
    sort_by: Optional[str] = "date"
):
    """Get jam sessions with filtering and sorting"""
    try:
        query = {}
        if status and status != "All":
            query["status"] = status.lower()
        if genre and genre != "All Genres":
            query["genres"] = {"$in": [genre]}
        
        sort_field = "date" if sort_by == "date" else "created_at"
        jam_sessions = await db.jam_sessions.find(query, {"_id": 0}).sort(sort_field, 1).to_list(100)
        return {"jam_sessions": jam_sessions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch jam sessions: {str(e)}")

@app.post("/api/musicjam/jam-sessions")
async def create_jam_session(jam_session: JamSession):
    """Create a new jam session"""
    try:
        await db.jam_sessions.insert_one(jam_session.dict())
        return {"message": "Jam session created successfully", "id": jam_session.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create jam session: {str(e)}")

@app.get("/api/musicjam/jam-sessions/{session_id}")
async def get_jam_session(session_id: str):
    """Get specific jam session details"""
    try:
        jam_session = await db.jam_sessions.find_one({"id": session_id}, {"_id": 0})
        if not jam_session:
            raise HTTPException(status_code=404, detail="Jam session not found")
        return jam_session
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch jam session: {str(e)}")

@app.get("/api/musicjam/playlists")
async def get_playlists():
    """Get all tab playlists"""
    try:
        playlists = await db.tab_playlists.find({}, {"_id": 0}).to_list(100)
        return {"playlists": playlists}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch playlists: {str(e)}")

@app.post("/api/musicjam/playlists")
async def create_playlist(playlist: TabPlaylist):
    """Create a new tab playlist"""
    try:
        await db.tab_playlists.insert_one(playlist.dict())
        return {"message": "Playlist created successfully", "id": playlist.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create playlist: {str(e)}")

@app.get("/api/musicjam/genres")
async def get_genres():
    """Get available music genres"""
    genres = [
        "Rock", "Pop", "Jazz", "Blues", "Classical", "Folk", "Country", 
        "R&B", "Hip Hop", "Electronic", "Metal", "Punk", "Reggae", 
        "Funk", "Soul", "Alternative", "Indie", "World", "Latin", "Instrumental"
    ]
    return {"genres": genres}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
