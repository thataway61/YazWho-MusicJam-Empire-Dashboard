import sys
sys.path.append('/app/backend')

from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from github import Github
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
import uuid
from datetime import datetime
import google.generativeai as genai
from deployment_engine import AutonomousDeploymentEngine, CommandExecutor


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client.app_db

# GitHub connection
github_pat = os.environ.get('GITHUB_PAT')
github_client = Github(github_pat) if github_pat else None

# Gemini AI connection
import google.generativeai as genai
gemini_api_key = os.environ.get('GEMINI_API_KEY')
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')
else:
    gemini_model = None

# Initialize Deployment Engine
deployment_engine = None
command_executor = None
if github_pat and gemini_api_key:
    deployment_engine = AutonomousDeploymentEngine(github_pat, gemini_api_key)
    command_executor = CommandExecutor(gemini_model)

# Pydantic models for deployment
class DeploymentRequest(BaseModel):
    repository_name: str
    deployment_type: str = "full"  # full, frontend, backend
    
class CommandRequest(BaseModel):
    natural_language_request: str
    working_directory: Optional[str] = "/app"
    
class RepositoryAnalysisRequest(BaseModel):
    repository_name: str

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

@api_router.post("/deployment/analyze-repository")
async def analyze_repository(request: RepositoryAnalysisRequest):
    """Analyze a GitHub repository for deployment strategy"""
    if not deployment_engine:
        raise HTTPException(status_code=500, detail="Deployment engine not configured")
    
    try:
        analysis = await deployment_engine.analyze_repository(request.repository_name)
        return {
            "status": "success",
            "analysis": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Repository analysis failed: {str(e)}")

@api_router.post("/deployment/autonomous-deploy")
async def autonomous_deploy(request: DeploymentRequest):
    """Execute autonomous deployment of a repository"""
    if not deployment_engine:
        raise HTTPException(status_code=500, detail="Deployment engine not configured")
    
    try:
        deployment_result = await deployment_engine.execute_autonomous_deployment(request.repository_name)
        
        # Store deployment result in database
        collection = db["deployments"]
        await collection.insert_one({
            "id": deployment_result["deployment_id"],
            "repository_name": request.repository_name,
            "deployment_type": request.deployment_type,
            "result": deployment_result,
            "timestamp": datetime.now().isoformat()
        })
        
        return {
            "status": "success",
            "deployment": deployment_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Autonomous deployment failed: {str(e)}")

@api_router.get("/deployment/status/{deployment_id}")
async def get_deployment_status(deployment_id: str):
    """Get the status of a deployment"""
    collection = db["deployments"]
    deployment = await collection.find_one({"id": deployment_id})
    
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    return {
        "status": "success",
        "deployment": {
            "id": deployment["id"],
            "repository_name": deployment["repository_name"],
            "deployment_type": deployment["deployment_type"],
            "result": deployment["result"],
            "timestamp": deployment["timestamp"]
        }
    }

@api_router.get("/deployment/list")
async def list_deployments():
    """List all deployments"""
    collection = db["deployments"]
    deployments = []
    async for deployment in collection.find().sort("timestamp", -1):
        deployments.append({
            "id": deployment["id"],
            "repository_name": deployment["repository_name"],
            "deployment_type": deployment["deployment_type"],
            "status": deployment["result"]["status"],
            "timestamp": deployment["timestamp"]
        })
    
    return {
        "status": "success",
        "deployments": deployments
    }

@api_router.post("/ai/command-analysis")
async def analyze_command(request: CommandRequest):
    """Analyze natural language command and convert to shell commands"""
    if not command_executor:
        raise HTTPException(status_code=500, detail="Command executor not configured")
    
    try:
        analysis = await command_executor.analyze_command(request.natural_language_request)
        return {
            "status": "success",
            "analysis": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Command analysis failed: {str(e)}")

@api_router.post("/ai/execute-command")
async def execute_ai_command(request: CommandRequest):
    """Execute a command after AI analysis and safety check"""
    if not command_executor:
        raise HTTPException(status_code=500, detail="Command executor not configured")
    
    try:
        # First analyze the command
        analysis = await command_executor.analyze_command(request.natural_language_request)
        
        if not analysis.get("execution_recommended", False):
            return {
                "status": "rejected",
                "reason": "Command execution not recommended for safety reasons",
                "analysis": analysis
            }
        
        # Execute safe commands
        results = []
        for cmd_info in analysis.get("commands", []):
            if cmd_info["safety_level"] in ["safe", "caution"]:
                result = await command_executor.execute_command(
                    cmd_info["command"], 
                    request.working_directory
                )
                results.append(result)
            else:
                results.append({
                    "command": cmd_info["command"],
                    "skipped": True,
                    "reason": "Command marked as dangerous"
                })
        
        # Store command execution in database
        collection = db["command_executions"]
        await collection.insert_one({
            "id": str(uuid.uuid4()),
            "request": request.natural_language_request,
            "analysis": analysis,
            "results": results,
            "timestamp": datetime.now().isoformat()
        })
        
        return {
            "status": "success",
            "analysis": analysis,
            "execution_results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Command execution failed: {str(e)}")

@api_router.get("/ai/command-history")
async def get_command_history():
    """Get command execution history"""
    collection = db["command_executions"]
    history = []
    async for record in collection.find().sort("timestamp", -1).limit(50):
        history.append({
            "id": record["id"],
            "request": record["request"],
            "timestamp": record["timestamp"],
            "success": any(r.get("success", False) for r in record.get("results", []))
        })
    
    return {
        "status": "success",
        "history": history
    }

@api_router.get("/ai/test")
async def test_gemini():
    """Test Gemini AI connection"""
    if not gemini_model:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
    
    try:
        response = gemini_model.generate_content("Say hello and confirm you're working correctly!")
        return {
            "status": "success",
            "response": response.text,
            "model": "gemini-1.5-flash"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini AI error: {str(e)}")

@api_router.get("/github/test")
async def test_github():
    """Test GitHub API connection"""
    if not github_client:
        raise HTTPException(status_code=500, detail="GitHub PAT not configured")
    
    try:
        user = github_client.get_user()
        return {
            "status": "success",
            "user": user.login,
            "name": user.name,
            "public_repos": user.public_repos,
            "rate_limit": github_client.get_rate_limit().core.remaining
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub API error: {str(e)}")

@api_router.get("/test")
async def test():
    return {"message": "Hello from FastAPI!"}
    
@api_router.get("/status-checks")
async def get_status_checks():
    collection = db["status_checks"]
    checks = []
    async for check in collection.find():
        checks.append({
            "id": check["id"],
            "client_name": check["client_name"],
            "timestamp": check["timestamp"]
        })
    return {"status_checks": checks}

@api_router.post("/status-checks")
async def create_status_check(client_name: str):
    collection = db["status_checks"]
    check = {
        "id": str(uuid.uuid4()),
        "client_name": client_name,
        "timestamp": datetime.now().isoformat()
    }
    await collection.insert_one(check)
    return {"message": f"Status check created for {client_name}", "id": check["id"]}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
