"""
Autonomous AI Deployment Engine

This module handles autonomous deployment of applications to modern cloud platforms:
- Vercel (Frontend deployment)
- Render (Backend deployment) 
- MongoDB Atlas (Database)
- GitHub Actions (CI/CD automation)
"""

import os
import json
import asyncio
import subprocess
from typing import Dict, List, Optional, Any
from github import Github
import google.generativeai as genai
from datetime import datetime
import uuid
import tempfile
import shutil
import zipfile
import requests
from pathlib import Path

class AutonomousDeploymentEngine:
    def __init__(self, github_token: str, gemini_api_key: str):
        self.github = Github(github_token)
        genai.configure(api_key=gemini_api_key)
        self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        self.deployment_id = str(uuid.uuid4())
        
    async def analyze_repository(self, repo_name: str) -> Dict[str, Any]:
        """Analyze a GitHub repository to understand its architecture"""
        try:
            repo = self.github.get_repo(repo_name)
            
            # Get repository structure
            contents = repo.get_contents("")
            structure = self._build_repo_structure(contents)
            
            # Analyze tech stack
            tech_stack = await self._analyze_tech_stack(repo, structure)
            
            # Generate deployment strategy
            deployment_strategy = await self._generate_deployment_strategy(tech_stack, structure)
            
            return {
                "repo_name": repo_name,
                "structure": structure,
                "tech_stack": tech_stack,
                "deployment_strategy": deployment_strategy,
                "analysis_timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            raise Exception(f"Repository analysis failed: {str(e)}")
    
    def _build_repo_structure(self, contents, path="") -> Dict[str, Any]:
        """Recursively build repository structure"""
        structure = {}
        
        for content in contents:
            if content.type == "dir":
                try:
                    sub_contents = content.repository.get_contents(content.path)
                    structure[content.name] = {
                        "type": "directory",
                        "contents": self._build_repo_structure(sub_contents, content.path)
                    }
                except:
                    structure[content.name] = {"type": "directory", "contents": {}}
            else:
                structure[content.name] = {
                    "type": "file",
                    "size": content.size,
                    "path": content.path
                }
        
        return structure
    
    async def _analyze_tech_stack(self, repo, structure) -> Dict[str, Any]:
        """Analyze the technology stack of the repository"""
        tech_indicators = {
            "frontend": {},
            "backend": {},
            "database": {},
            "deployment": {}
        }
        
        # Check for common files
        if "package.json" in structure:
            try:
                package_json = repo.get_contents("package.json")
                content = json.loads(package_json.decoded_content.decode('utf-8'))
                tech_indicators["frontend"]["react"] = "react" in content.get("dependencies", {})
                tech_indicators["frontend"]["dependencies"] = list(content.get("dependencies", {}).keys())
            except:
                pass
        
        if "requirements.txt" in structure:
            try:
                requirements = repo.get_contents("requirements.txt")
                content = requirements.decoded_content.decode('utf-8')
                tech_indicators["backend"]["python"] = True
                tech_indicators["backend"]["fastapi"] = "fastapi" in content.lower()
                tech_indicators["backend"]["dependencies"] = content.strip().split('\n')
            except:
                pass
        
        # Check for framework indicators
        if "frontend" in structure and "src" in structure["frontend"].get("contents", {}):
            tech_indicators["frontend"]["react_structure"] = True
            
        if "backend" in structure and "server.py" in structure["backend"].get("contents", {}):
            tech_indicators["backend"]["fastapi_structure"] = True
        
        return tech_indicators
    
    async def _generate_deployment_strategy(self, tech_stack: Dict, structure: Dict) -> Dict[str, Any]:
        """Use Gemini AI to generate optimal deployment strategy"""
        
        prompt = f"""
        Analyze this application structure and tech stack to generate an optimal deployment strategy:
        
        Tech Stack: {json.dumps(tech_stack, indent=2)}
        Structure: {json.dumps(structure, indent=2)}
        
        Generate a deployment strategy for:
        1. Frontend deployment to Vercel
        2. Backend deployment to Render
        3. Database setup with MongoDB Atlas
        4. GitHub Actions CI/CD
        
        Provide specific configuration files and deployment commands needed.
        Focus on automation and zero manual intervention.
        
        Return your response as JSON with the following structure:
        {{
            "frontend": {{
                "platform": "vercel",
                "build_command": "...",
                "output_directory": "...",
                "environment_variables": [...],
                "vercel_config": {{...}}
            }},
            "backend": {{
                "platform": "render",
                "build_command": "...",
                "start_command": "...",
                "environment_variables": [...],
                "dockerfile": "...",
                "render_config": {{...}}
            }},
            "database": {{
                "platform": "mongodb_atlas",
                "connection_string_format": "...",
                "collections": [...]
            }},
            "cicd": {{
                "github_actions": {{...}},
                "deployment_workflow": [...]
            }}
        }}
        """
        
        try:
            response = self.gemini_model.generate_content(prompt)
            # Extract JSON from the response
            response_text = response.text
            
            # Find JSON in the response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
            else:
                # Fallback strategy if JSON parsing fails
                return self._get_default_deployment_strategy()
                
        except Exception as e:
            print(f"Error generating deployment strategy: {e}")
            return self._get_default_deployment_strategy()
    
    def _get_default_deployment_strategy(self) -> Dict[str, Any]:
        """Default deployment strategy for React + FastAPI + MongoDB"""
        return {
            "frontend": {
                "platform": "vercel",
                "build_command": "npm run build",
                "output_directory": "build",
                "environment_variables": ["REACT_APP_BACKEND_URL"],
                "vercel_config": {
                    "version": 2,
                    "builds": [{"src": "package.json", "use": "@vercel/static-build"}]
                }
            },
            "backend": {
                "platform": "render",
                "build_command": "pip install -r requirements.txt",
                "start_command": "uvicorn server:app --host 0.0.0.0 --port $PORT",
                "environment_variables": ["MONGO_URL", "SECRET_KEY", "YOUTUBE_API_KEY"],
                "dockerfile": None,
                "render_config": {
                    "type": "web",
                    "env": "python",
                    "buildCommand": "pip install -r requirements.txt",
                    "startCommand": "uvicorn server:app --host 0.0.0.0 --port $PORT"
                }
            },
            "database": {
                "platform": "mongodb_atlas",
                "connection_string_format": "mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>",
                "collections": ["users", "playlists", "songs"]
            },
            "cicd": {
                "github_actions": {
                    "frontend_deploy": ".github/workflows/deploy-frontend.yml",
                    "backend_deploy": ".github/workflows/deploy-backend.yml"
                },
                "deployment_workflow": [
                    "Code push to main branch",
                    "GitHub Actions triggers",
                    "Frontend builds and deploys to Vercel",
                    "Backend builds and deploys to Render",
                    "Environment variables automatically configured"
                ]
            }
        }

    async def create_deployment_files(self, repo_name: str, strategy: Dict[str, Any]) -> Dict[str, str]:
        """Create all necessary deployment configuration files"""
        files = {}
        
        # Vercel configuration
        if strategy["frontend"]["platform"] == "vercel":
            vercel_config = {
                "version": 2,
                "builds": [
                    {
                        "src": "frontend/package.json",
                        "use": "@vercel/static-build",
                        "config": {
                            "distDir": "build"
                        }
                    }
                ],
                "routes": [
                    {
                        "src": "/(.*)",
                        "dest": "/frontend/$1"
                    }
                ]
            }
            files["vercel.json"] = json.dumps(vercel_config, indent=2)
        
        # Render configuration
        if strategy["backend"]["platform"] == "render":
            render_config = {
                "services": [
                    {
                        "type": "web",
                        "name": f"{repo_name}-backend",
                        "env": "python",
                        "plan": "free",
                        "buildCommand": strategy["backend"]["build_command"],
                        "startCommand": strategy["backend"]["start_command"],
                        "rootDir": "backend",
                        "envVars": [
                            {
                                "key": "MONGO_URL",
                                "fromDatabase": {
                                    "name": f"{repo_name}-db",
                                    "property": "connectionString"
                                }
                            }
                        ]
                    }
                ]
            }
            files["render.yaml"] = json.dumps(render_config, indent=2)
        
        # GitHub Actions workflows
        frontend_workflow = """
name: Deploy Frontend to Vercel

on:
  push:
    branches: [ main ]
    paths: [ 'frontend/**' ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd frontend
          npm install
          
      - name: Build project
        run: |
          cd frontend
          npm run build
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: frontend
        """
        
        backend_workflow = """
name: Deploy Backend to Render

on:
  push:
    branches: [ main ]
    paths: [ 'backend/**' ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Trigger Render Deploy
        run: |
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK }}"
        """
        
        files[".github/workflows/deploy-frontend.yml"] = frontend_workflow
        files[".github/workflows/deploy-backend.yml"] = backend_workflow
        
        # Dockerfile for backend (if needed)
        if strategy["backend"].get("dockerfile"):
            dockerfile = """
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
            """
            files["backend/Dockerfile"] = dockerfile
        
        return files
    
    async def execute_autonomous_deployment(self, repo_name: str) -> Dict[str, Any]:
        """Execute the complete autonomous deployment process"""
        deployment_log = {
            "deployment_id": self.deployment_id,
            "start_time": datetime.now().isoformat(),
            "steps": [],
            "status": "started"
        }
        
        try:
            # Step 1: Analyze repository
            deployment_log["steps"].append({"step": "repository_analysis", "status": "started", "timestamp": datetime.now().isoformat()})
            analysis = await self.analyze_repository(repo_name)
            deployment_log["steps"][-1]["status"] = "completed"
            deployment_log["analysis"] = analysis
            
            # Step 2: Generate deployment files
            deployment_log["steps"].append({"step": "deployment_files_generation", "status": "started", "timestamp": datetime.now().isoformat()})
            deployment_files = await self.create_deployment_files(repo_name, analysis["deployment_strategy"])
            deployment_log["steps"][-1]["status"] = "completed"
            deployment_log["deployment_files"] = list(deployment_files.keys())
            
            # Step 3: Create deployment branch and commit files
            deployment_log["steps"].append({"step": "deployment_branch_creation", "status": "started", "timestamp": datetime.now().isoformat()})
            deployment_branch = await self._create_deployment_branch(repo_name, deployment_files)
            deployment_log["steps"][-1]["status"] = "completed"
            deployment_log["deployment_branch"] = deployment_branch
            
            deployment_log["status"] = "completed"
            deployment_log["end_time"] = datetime.now().isoformat()
            
        except Exception as e:
            deployment_log["status"] = "failed"
            deployment_log["error"] = str(e)
            deployment_log["end_time"] = datetime.now().isoformat()
            
        return deployment_log
    
    async def _create_deployment_branch(self, repo_name: str, deployment_files: Dict[str, str]) -> str:
        """Create a deployment branch with all necessary files"""
        try:
            repo = self.github.get_repo(repo_name)
            
            # Create a new branch for deployment
            main_branch = repo.get_branch("main")
            branch_name = f"autonomous-deployment-{self.deployment_id[:8]}"
            
            repo.create_git_ref(
                ref=f"refs/heads/{branch_name}",
                sha=main_branch.commit.sha
            )
            
            # Add deployment files to the branch
            for file_path, file_content in deployment_files.items():
                try:
                    # Check if file exists
                    try:
                        existing_file = repo.get_contents(file_path, ref=branch_name)
                        # Update existing file
                        repo.update_file(
                            path=file_path,
                            message=f"Update {file_path} for autonomous deployment",
                            content=file_content,
                            sha=existing_file.sha,
                            branch=branch_name
                        )
                    except:
                        # Create new file
                        repo.create_file(
                            path=file_path,
                            message=f"Add {file_path} for autonomous deployment",
                            content=file_content,
                            branch=branch_name
                        )
                except Exception as e:
                    print(f"Error creating/updating {file_path}: {e}")
            
            return branch_name
            
        except Exception as e:
            raise Exception(f"Failed to create deployment branch: {str(e)}")

# Command execution utilities
class CommandExecutor:
    """Execute commands with AI assistance and safety checks"""
    
    def __init__(self, gemini_model):
        self.gemini_model = gemini_model
        self.command_history = []
    
    async def analyze_command(self, natural_language_request: str) -> Dict[str, Any]:
        """Convert natural language to safe shell commands"""
        prompt = f"""
        Convert this natural language request to safe shell commands:
        "{natural_language_request}"
        
        Rules:
        1. Only generate safe, non-destructive commands
        2. Avoid rm -rf, dd, or other dangerous operations
        3. Focus on deployment, git, npm, pip, and standard operations
        4. Provide explanation for each command
        
        Return JSON format:
        {{
            "commands": [
                {{
                    "command": "actual shell command",
                    "explanation": "what this command does",
                    "safety_level": "safe|caution|dangerous"
                }}
            ],
            "overall_safety": "safe|caution|dangerous",
            "execution_recommended": true/false
        }}
        """
        
        try:
            response = self.gemini_model.generate_content(prompt)
            response_text = response.text
            
            # Extract JSON
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
            else:
                return {
                    "commands": [],
                    "overall_safety": "dangerous",
                    "execution_recommended": False,
                    "error": "Could not parse AI response"
                }
                
        except Exception as e:
            return {
                "commands": [],
                "overall_safety": "dangerous", 
                "execution_recommended": False,
                "error": str(e)
            }
    
    async def execute_command(self, command: str, working_dir: str = "/app") -> Dict[str, Any]:
        """Execute a shell command safely"""
        result = {
            "command": command,
            "working_dir": working_dir,
            "timestamp": datetime.now().isoformat(),
            "success": False,
            "output": "",
            "error": ""
        }
        
        try:
            process = await asyncio.create_subprocess_shell(
                command,
                cwd=working_dir,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            result["success"] = process.returncode == 0
            result["output"] = stdout.decode('utf-8') if stdout else ""
            result["error"] = stderr.decode('utf-8') if stderr else ""
            result["return_code"] = process.returncode
            
            # Log command execution
            self.command_history.append(result)
            
        except Exception as e:
            result["error"] = str(e)
            result["success"] = False
            
        return result
