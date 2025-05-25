import React, { useState, useEffect } from 'react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [empireStatus, setEmpireStatus] = useState(null);
  const [projects, setProjects] = useState([]);
  const [enhancements, setEnhancements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repositories, setRepositories] = useState([]);

  // Fetch empire overview
  useEffect(() => {
    fetchEmpireOverview();
  }, []);

  const fetchEmpireOverview = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/empire/overview`);
      const data = await response.json();
      setEmpireStatus(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch empire overview:', error);
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects`);
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchEnhancements = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/musicjam/enhancements`);
      const data = await response.json();
      setEnhancements(data.enhancements || []);
    } catch (error) {
      console.error('Failed to fetch enhancements:', error);
    }
  };

  const fetchRepositories = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/github/repositories`);
      const data = await response.json();
      setRepositories(data.repositories || []);
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
    }
  };

  const deployProject = async (repoUrl, projectName) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/github/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_name: projectName,
          repository_url: repoUrl,
          description: 'Deployed via YazWho Empire Dashboard',
          target_platform: 'vercel'
        }),
      });
      const data = await response.json();
      alert(`Deployment initiated! Project ID: ${data.project_id}`);
      fetchProjects();
    } catch (error) {
      console.error('Deployment failed:', error);
      alert('Deployment failed!');
    }
  };

  const generateAIEnhancement = async (feature, type) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/musicjam/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          musicjam_feature: feature,
          enhancement_type: type,
          user_preferences: {
            focus: 'user_engagement',
            platform: 'web'
          }
        }),
      });
      const data = await response.json();
      alert('AI Enhancement generated successfully!');
      fetchEnhancements();
      return data;
    } catch (error) {
      console.error('AI enhancement failed:', error);
      alert('AI enhancement failed!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-white text-xl">Loading YazWho Empire...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black bg-opacity-50 backdrop-blur-lg border-b border-purple-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                👑 YazWho Empire Dashboard
              </div>
              <div className="ml-4 text-sm text-purple-300">v2.0</div>
            </div>
            <nav className="flex space-x-8">
              {['dashboard', 'projects', 'musicjam', 'deployments', 'deployment-center', 'ai-tools'].map((view) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === view
                      ? 'bg-purple-600 text-white'
                      : 'text-purple-300 hover:text-white hover:bg-purple-700'
                  }`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1).replace('-', ' ')}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && <Dashboard empireStatus={empireStatus} />}
        {currentView === 'projects' && <Projects projects={projects} fetchProjects={fetchProjects} />}
        {currentView === 'musicjam' && <MusicJam enhancements={enhancements} generateAIEnhancement={generateAIEnhancement} fetchEnhancements={fetchEnhancements} />}
        {currentView === 'deployments' && <Deployments repositories={repositories} fetchRepositories={fetchRepositories} deployProject={deployProject} />}
        {currentView === 'deployment-center' && <DeploymentCenter enhancements={enhancements} fetchEnhancements={fetchEnhancements} />}
        {currentView === 'ai-tools' && <AITools />}
      </main>
    </div>
  );
}

// Dashboard Component
function Dashboard({ empireStatus }) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          🚀 Empire Command Center
        </h1>
        <p className="text-purple-300 text-lg">
          Managing your music empire with AI-powered deployment tools
        </p>
      </div>

      {empireStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Empire Status */}
          <div className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg p-6 border border-purple-500">
            <h3 className="text-lg font-semibold text-white mb-2">Empire Status</h3>
            <div className={`text-2xl font-bold ${empireStatus.empire_status === 'operational' ? 'text-green-400' : 'text-red-400'}`}>
              {empireStatus.empire_status === 'operational' ? '🟢 Online' : '🔴 Offline'}
            </div>
          </div>

          {/* MusicJam Status */}
          <div className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg p-6 border border-purple-500">
            <h3 className="text-lg font-semibold text-white mb-2">MusicJam App</h3>
            <div className={`text-lg font-bold ${empireStatus.musicjam_app?.status === 'online' ? 'text-green-400' : 'text-yellow-400'}`}>
              {empireStatus.musicjam_app?.status === 'online' ? '🎵 Live' : '⚠️ Issues'}
            </div>
            {empireStatus.musicjam_app?.url && (
              <a href={empireStatus.musicjam_app.url} target="_blank" rel="noopener noreferrer" className="text-purple-300 text-sm hover:text-purple-100">
                Visit App →
              </a>
            )}
          </div>

          {/* Projects Count */}
          <div className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg p-6 border border-purple-500">
            <h3 className="text-lg font-semibold text-white mb-2">Active Projects</h3>
            <div className="text-2xl font-bold text-blue-400">
              {empireStatus.managed_projects || 0}
            </div>
          </div>

          {/* AI Enhancements */}
          <div className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg p-6 border border-purple-500">
            <h3 className="text-lg font-semibold text-white mb-2">AI Enhancements</h3>
            <div className="text-2xl font-bold text-pink-400">
              {empireStatus.ai_enhancements || 0}
            </div>
          </div>
        </div>
      )}

      {/* Integration Status */}
      {empireStatus?.integrations && (
        <div className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg p-6 border border-purple-500">
          <h3 className="text-xl font-semibold text-white mb-4">Integration Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-purple-300">GitHub</span>
              <span className={`font-semibold ${empireStatus.integrations.github === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                {empireStatus.integrations.github === 'active' ? '✅ Connected' : '❌ Disconnected'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-purple-300">AI Engine</span>
              <span className={`font-semibold ${empireStatus.integrations.ai_engine === 'gemini' ? 'text-green-400' : 'text-red-400'}`}>
                {empireStatus.integrations.ai_engine === 'gemini' ? '🤖 Gemini' : '❌ Inactive'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-purple-300">OAuth</span>
              <span className={`font-semibold ${empireStatus.integrations.oauth === 'google' ? 'text-green-400' : 'text-red-400'}`}>
                {empireStatus.integrations.oauth === 'google' ? '🔐 Google' : '❌ Inactive'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Projects Component
function Projects({ projects, fetchProjects }) {
  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">🚀 Managed Projects</h2>
      
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-purple-300 text-lg">No projects deployed yet.</p>
          <p className="text-purple-400">Use the Deployments tab to deploy your first project!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg p-6 border border-purple-500">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-white">{project.name}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  project.status === 'deployed' ? 'bg-green-600 text-white' :
                  project.status === 'deploying' ? 'bg-yellow-600 text-white' :
                  project.status === 'failed' ? 'bg-red-600 text-white' :
                  'bg-gray-600 text-white'
                }`}>
                  {project.status}
                </span>
              </div>
              
              <p className="text-purple-300 mb-4">{project.description || 'No description provided'}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-400">Repository:</span>
                  <a href={project.repository_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                    View Repo →
                  </a>
                </div>
                {project.deployment_url && (
                  <div className="flex justify-between">
                    <span className="text-purple-400">Live URL:</span>
                    <a href={project.deployment_url} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300">
                      Visit Site →
                    </a>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-purple-400">Created:</span>
                  <span className="text-purple-300">{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// MusicJam Component
function MusicJam({ enhancements, generateAIEnhancement, fetchEnhancements }) {
  const [selectedFeature, setSelectedFeature] = useState('playlist-management');
  const [selectedType, setSelectedType] = useState('recommendation');

  useEffect(() => {
    fetchEnhancements();
  }, []);

  const features = [
    'playlist-management',
    'music-discovery',
    'social-sharing',
    'user-profiles',
    'recommendation-engine',
    'audio-player'
  ];

  const enhancementTypes = [
    'recommendation',
    'ui-improvement',
    'performance',
    'social',
    'analytics',
    'accessibility'
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">🎵 MusicJam Enhancement Studio</h2>
        <p className="text-purple-300">AI-powered suggestions for your music platform</p>
      </div>

      {/* AI Enhancement Generator */}
      <div className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg p-6 border border-purple-500">
        <h3 className="text-xl font-semibold text-white mb-4">Generate AI Enhancement</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-purple-300 text-sm font-medium mb-2">Feature</label>
            <select
              value={selectedFeature}
              onChange={(e) => setSelectedFeature(e.target.value)}
              className="w-full px-3 py-2 bg-purple-900 bg-opacity-50 border border-purple-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {features.map(feature => (
                <option key={feature} value={feature}>{feature.replace('-', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-purple-300 text-sm font-medium mb-2">Enhancement Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-purple-900 bg-opacity-50 border border-purple-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {enhancementTypes.map(type => (
                <option key={type} value={type}>{type.replace('-', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => generateAIEnhancement(selectedFeature, selectedType)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-md transition-all duration-200"
            >
              🤖 Generate Enhancement
            </button>
          </div>
        </div>
      </div>

      {/* Enhancements List */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-4">Generated Enhancements</h3>
        {enhancements.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-purple-300">No enhancements generated yet.</p>
            <p className="text-purple-400">Use the form above to generate AI-powered suggestions!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {enhancements.map((enhancement) => (
              <div key={enhancement.id} className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg p-6 border border-purple-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{enhancement.feature_name.replace('-', ' ').toUpperCase()}</h4>
                    <span className="text-purple-400 text-sm">{enhancement.enhancement_type.replace('-', ' ').toUpperCase()}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    enhancement.implementation_status === 'deployed' ? 'bg-green-600 text-white' :
                    enhancement.implementation_status === 'implementing' ? 'bg-yellow-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {enhancement.implementation_status}
                  </span>
                </div>
                
                {enhancement.ai_suggestion && (
                  <div className="bg-purple-900 bg-opacity-30 rounded-lg p-4 mb-4">
                    <h5 className="text-white font-medium mb-2">🤖 AI Suggestion:</h5>
                    <p className="text-purple-200 text-sm whitespace-pre-wrap">{enhancement.ai_suggestion}</p>
                  </div>
                )}
                
                <div className="text-xs text-purple-400">
                  Generated: {new Date(enhancement.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Deployments Component
function Deployments({ repositories, fetchRepositories, deployProject }) {
  const [showRepos, setShowRepos] = useState(false);

  const handleFetchRepos = () => {
    fetchRepositories();
    setShowRepos(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">🚀 Project Deployments</h2>
        <p className="text-purple-300">Deploy your GitHub repositories instantly</p>
      </div>

      <div className="text-center">
        <button
          onClick={handleFetchRepos}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
        >
          📁 Load GitHub Repositories
        </button>
      </div>

      {showRepos && (
        <div>
          {repositories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-purple-300">No repositories found or GitHub not connected.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {repositories.map((repo) => (
                <div key={repo.full_name} className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg p-6 border border-purple-500">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{repo.name}</h3>
                      <p className="text-purple-400 text-sm">{repo.full_name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {repo.language && (
                        <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">
                          {repo.language}
                        </span>
                      )}
                      <span className="text-yellow-400">⭐ {repo.stars}</span>
                    </div>
                  </div>
                  
                  <p className="text-purple-300 text-sm mb-4">{repo.description || 'No description available'}</p>
                  
                  <div className="flex justify-between items-center">
                    <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm">
                      View Repository →
                    </a>
                    <button
                      onClick={() => deployProject(repo.clone_url, repo.name)}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                    >
                      🚀 Deploy
                    </button>
                  </div>
                  
                  {repo.updated_at && (
                    <div className="text-xs text-purple-400 mt-2">
                      Updated: {new Date(repo.updated_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// AI Tools Component
function AITools() {
  const [mood, setMood] = useState('happy');
  const [genre, setGenre] = useState('any');
  const [recommendations, setRecommendations] = useState('');
  const [loading, setLoading] = useState(false);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/ai/recommendations/music?mood=${mood}&genre=${genre}`);
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">🤖 AI Tools</h2>
        <p className="text-purple-300">Powerful AI utilities for music and development</p>
      </div>

      {/* Music Recommendations */}
      <div className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg p-6 border border-purple-500">
        <h3 className="text-xl font-semibold text-white mb-4">🎵 AI Music Recommendations</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-purple-300 text-sm font-medium mb-2">Mood</label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full px-3 py-2 bg-purple-900 bg-opacity-50 border border-purple-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="happy">Happy</option>
              <option value="sad">Sad</option>
              <option value="energetic">Energetic</option>
              <option value="relaxed">Relaxed</option>
              <option value="romantic">Romantic</option>
              <option value="motivational">Motivational</option>
            </select>
          </div>
          
          <div>
            <label className="block text-purple-300 text-sm font-medium mb-2">Genre</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-3 py-2 bg-purple-900 bg-opacity-50 border border-purple-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="any">Any Genre</option>
              <option value="pop">Pop</option>
              <option value="rock">Rock</option>
              <option value="hip-hop">Hip Hop</option>
              <option value="electronic">Electronic</option>
              <option value="jazz">Jazz</option>
              <option value="classical">Classical</option>
              <option value="indie">Indie</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={generateRecommendations}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-md transition-all duration-200"
            >
              {loading ? '🔄 Generating...' : '🎵 Get Recommendations'}
            </button>
          </div>
        </div>

        {recommendations && (
          <div className="bg-purple-900 bg-opacity-30 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">🤖 AI Recommendations:</h4>
            <pre className="text-purple-200 text-sm whitespace-pre-wrap">{recommendations}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

// Deployment Center Component
function DeploymentCenter({ enhancements, fetchEnhancements }) {
  const [deployments, setDeployments] = useState([]);
  const [selectedEnhancement, setSelectedEnhancement] = useState(null);
  const [deploymentPlan, setDeploymentPlan] = useState(null);
  const [generatedComponent, setGeneratedComponent] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEnhancements();
    fetchDeployments();
  }, []);

  const fetchDeployments = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/deploy/status`);
      const data = await response.json();
      setDeployments(data.deployments || []);
    } catch (error) {
      console.error('Failed to fetch deployments:', error);
    }
  };

  const simulateDeployment = async (enhancementId) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/musicjam/simulate-deploy?enhancement_id=${enhancementId}`, {
        method: 'POST'
      });
      const result = await response.json();
      alert(`🚀 Deployment Simulation Complete!\n\nFeature: ${result.feature}\nStatus: ${result.simulation_result}\nNext Steps: ${result.next_steps}`);
      fetchEnhancements();
    } catch (error) {
      console.error('Simulation failed:', error);
      alert('Deployment simulation failed!');
    }
    setLoading(false);
  };

  const createDeploymentPlan = async (enhancementId) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/deploy/enhancement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          enhancement_id: enhancementId,
          deployment_target: 'staging' 
        })
      });
      const result = await response.json();
      setDeploymentPlan(result.deployment_plan);
      alert('🎯 Deployment plan created successfully!');
      fetchDeployments();
    } catch (error) {
      console.error('Deployment plan creation failed:', error);
      alert('Failed to create deployment plan!');
    }
    setLoading(false);
  };

  const generateComponent = async (enhancement) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/generate/component`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          component_name: `${enhancement.feature_name.replace('-', '')}Component`,
          feature_type: enhancement.enhancement_type,
          description: enhancement.ai_suggestion.substring(0, 500)
        })
      });
      const result = await response.json();
      setGeneratedComponent(result);
      alert('⚡ React component generated successfully!');
    } catch (error) {
      console.error('Component generation failed:', error);
      alert('Failed to generate component!');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">🚀 Deployment Center</h2>
        <p className="text-purple-300">Deploy AI enhancements to live MusicJam application</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg p-4 border border-green-500 text-center">
          <div className="text-2xl mb-2">🎯</div>
          <div className="text-green-400 font-semibold">Ready to Deploy</div>
          <div className="text-white text-2xl font-bold">{enhancements.filter(e => e.implementation_status === 'planned').length}</div>
        </div>
        
        <div className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg p-4 border border-yellow-500 text-center">
          <div className="text-2xl mb-2">⚡</div>
          <div className="text-yellow-400 font-semibold">Implementing</div>
          <div className="text-white text-2xl font-bold">{enhancements.filter(e => e.implementation_status === 'implementing').length}</div>
        </div>
        
        <div className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg p-4 border border-blue-500 text-center">
          <div className="text-2xl mb-2">✅</div>
          <div className="text-blue-400 font-semibold">Deployed</div>
          <div className="text-white text-2xl font-bold">{enhancements.filter(e => e.implementation_status === 'deployed').length}</div>
        </div>
        
        <div className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg p-4 border border-purple-500 text-center">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-purple-400 font-semibold">Total Plans</div>
          <div className="text-white text-2xl font-bold">{deployments.length}</div>
        </div>
      </div>

      {/* Enhancement Deployment Manager */}
      <div className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg p-6 border border-purple-500">
        <h3 className="text-xl font-semibold text-white mb-4">🎵 MusicJam Enhancement Deployment</h3>
        
        {enhancements.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-purple-300">No enhancements available for deployment.</p>
            <p className="text-purple-400">Generate some AI enhancements in the MusicJam section first!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {enhancements.map((enhancement) => (
              <div key={enhancement.id} className="bg-purple-900 bg-opacity-30 rounded-lg p-4 border border-purple-400">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{enhancement.feature_name.replace('-', ' ').toUpperCase()}</h4>
                    <span className="text-purple-400 text-sm">{enhancement.enhancement_type.replace('-', ' ').toUpperCase()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      enhancement.implementation_status === 'deployed' ? 'bg-green-600 text-white' :
                      enhancement.implementation_status === 'implementing' ? 'bg-yellow-600 text-white' :
                      'bg-blue-600 text-white'
                    }`}>
                      {enhancement.implementation_status}
                    </span>
                    {enhancement.deployment_simulation && (
                      <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">SIMULATED</span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
                  <button
                    onClick={() => simulateDeployment(enhancement.id)}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2 px-3 rounded text-sm transition-colors"
                  >
                    🧪 Simulate Deploy
                  </button>
                  
                  <button
                    onClick={() => createDeploymentPlan(enhancement.id)}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-3 rounded text-sm transition-colors"
                  >
                    📋 Create Plan
                  </button>
                  
                  <button
                    onClick={() => generateComponent(enhancement)}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2 px-3 rounded text-sm transition-colors"
                  >
                    ⚡ Generate Code
                  </button>
                  
                  <button
                    onClick={() => setSelectedEnhancement(enhancement)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-3 rounded text-sm transition-colors"
                  >
                    👁️ View Details
                  </button>
                </div>
                
                {enhancement.deployment_simulation && (
                  <div className="bg-green-900 bg-opacity-30 rounded p-3 text-sm">
                    <div className="text-green-400 font-medium">✅ Deployment Simulation Results:</div>
                    <div className="text-green-200">Status: {enhancement.deployment_simulation.status}</div>
                    <div className="text-green-200">Impact: {enhancement.deployment_simulation.estimated_impact}</div>
                    <div className="text-green-200">Target: {enhancement.deployment_simulation.target_url}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deployment Plan Viewer */}
      {deploymentPlan && (
        <div className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg p-6 border border-blue-500">
          <h3 className="text-xl font-semibold text-white mb-4">📋 Deployment Plan</h3>
          <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-blue-400 text-sm">Duration</div>
                <div className="text-white font-semibold">{deploymentPlan.estimated_duration}</div>
              </div>
              <div className="text-center">
                <div className="text-blue-400 text-sm">Complexity</div>
                <div className="text-white font-semibold">{deploymentPlan.complexity}</div>
              </div>
              <div className="text-center">
                <div className="text-blue-400 text-sm">Risk Level</div>
                <div className="text-white font-semibold">{deploymentPlan.risk_level}</div>
              </div>
            </div>
            <div className="text-blue-200 text-sm whitespace-pre-wrap">{deploymentPlan.plan}</div>
          </div>
        </div>
      )}

      {/* Generated Component Viewer */}
      {generatedComponent && (
        <div className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg p-6 border border-purple-500">
          <h3 className="text-xl font-semibold text-white mb-4">⚡ Generated React Component</h3>
          <div className="bg-purple-900 bg-opacity-30 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-purple-400 font-medium">Component: {generatedComponent.component_name}</span>
              <span className="text-purple-300 text-sm">Generated: {new Date(generatedComponent.generated_at).toLocaleString()}</span>
            </div>
            <pre className="text-purple-200 text-sm whitespace-pre-wrap overflow-x-auto">{generatedComponent.component_code}</pre>
          </div>
        </div>
      )}

      {/* Enhancement Details Modal */}
      {selectedEnhancement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedEnhancement(null)}>
          <div className="bg-black bg-opacity-90 backdrop-blur-lg rounded-lg p-6 border border-purple-500 max-w-4xl max-h-96 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-white">{selectedEnhancement.feature_name.replace('-', ' ').toUpperCase()}</h3>
              <button onClick={() => setSelectedEnhancement(null)} className="text-purple-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="text-purple-200 text-sm whitespace-pre-wrap">{selectedEnhancement.ai_suggestion}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
