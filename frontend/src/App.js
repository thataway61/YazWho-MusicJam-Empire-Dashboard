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

// MusicJam Component - Full Music Application
function MusicJam({ enhancements, generateAIEnhancement, fetchEnhancements }) {
  const [currentView, setCurrentView] = useState('jam-sessions');
  const [jamSessions, setJamSessions] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [genres, setGenres] = useState([]);
  const [filters, setFilters] = useState({
    status: 'All',
    genre: 'All Genres',
    sortBy: 'Date (Soonest)'
  });
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    max_participants: '',
    date: '',
    start_time: '',
    end_time: '',
    skill_level: 'All Levels',
    genres: []
  });

  useEffect(() => {
    fetchJamSessions();
    fetchPlaylists();
    fetchGenres();
  }, []);

  useEffect(() => {
    fetchJamSessions();
  }, [filters]);

  const fetchJamSessions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status !== 'All') params.append('status', filters.status);
      if (filters.genre !== 'All Genres') params.append('genre', filters.genre);
      params.append('sort_by', filters.sortBy.includes('Date') ? 'date' : 'popularity');

      const response = await fetch(`${BACKEND_URL}/api/musicjam/jam-sessions?${params}`);
      const data = await response.json();
      setJamSessions(data.jam_sessions || []);
    } catch (error) {
      console.error('Failed to fetch jam sessions:', error);
    }
    setLoading(false);
  };

  const fetchPlaylists = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/musicjam/playlists`);
      const data = await response.json();
      setPlaylists(data.playlists || []);
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    }
  };

  const fetchGenres = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/musicjam/genres`);
      const data = await response.json();
      setGenres(data.genres || []);
    } catch (error) {
      console.error('Failed to fetch genres:', error);
    }
  };

  const handleCreateJamSession = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/musicjam/jam-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        alert('🎸 Jam session created successfully!');
        setShowCreateForm(false);
        setFormData({
          title: '', description: '', location: '', max_participants: '',
          date: '', start_time: '', end_time: '', skill_level: 'All Levels', genres: []
        });
        fetchJamSessions();
      }
    } catch (error) {
      console.error('Failed to create jam session:', error);
      alert('Failed to create jam session!');
    }
    setLoading(false);
  };

  const handleGenreToggle = (genre) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white">🎸 Create Jam Session</h2>
          <button
            onClick={() => setShowCreateForm(false)}
            className="text-purple-300 hover:text-white"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleCreateJamSession} className="space-y-6">
          <div className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg p-6 border border-purple-500">
            <h3 className="text-xl font-semibold text-white mb-4">Basic Information</h3>
            <p className="text-purple-300 mb-6">Provide details about your jam session to help others find it.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-purple-300 text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-purple-900 bg-opacity-50 border border-purple-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-purple-300 text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-purple-900 bg-opacity-50 border border-purple-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400 h-24"
                  placeholder="Describe what you'll be playing, what to bring, etc."
                  required
                />
              </div>
              
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 bg-purple-900 bg-opacity-50 border border-purple-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
              </div>
              
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">Max Participants</label>
                <input
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_participants: e.target.value }))}
                  className="w-full px-3 py-2 bg-purple-900 bg-opacity-50 border border-purple-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Leave blank for unlimited"
                />
              </div>
              
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 bg-purple-900 bg-opacity-50 border border-purple-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
              </div>
              
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">Start Time</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="w-full px-3 py-2 bg-purple-900 bg-opacity-50 border border-purple-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
              </div>
              
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">End Time (optional)</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="w-full px-3 py-2 bg-purple-900 bg-opacity-50 border border-purple-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">Skill Level</label>
                <select
                  value={formData.skill_level}
                  onChange={(e) => setFormData(prev => ({ ...prev, skill_level: e.target.value }))}
                  className="w-full px-3 py-2 bg-purple-900 bg-opacity-50 border border-purple-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="All Levels">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg p-6 border border-purple-500">
            <h3 className="text-xl font-semibold text-white mb-4">Genres</h3>
            <p className="text-purple-300 mb-6">Select the musical genres that will be played</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {genres.map(genre => (
                <label key={genre} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.genres.includes(genre)}
                    onChange={() => handleGenreToggle(genre)}
                    className="w-4 h-4 text-purple-600 bg-purple-900 border-purple-500 rounded focus:ring-purple-400"
                  />
                  <span className="text-purple-300 text-sm">{genre}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create Jam Session'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">🎵 Find Musicians & Jam Together</h2>
        <p className="text-purple-300">Connect with local musicians, share Ultimate Guitar tab playlists, and organize jam sessions easily.</p>
      </div>

      {/* Sub Navigation */}
      <div className="flex justify-center space-x-8 mb-8">
        {['jam-sessions', 'playlists'].map((view) => (
          <button
            key={view}
            onClick={() => setCurrentView(view)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === view
                ? 'bg-purple-600 text-white'
                : 'text-purple-300 hover:text-white hover:bg-purple-700'
            }`}
          >
            {view === 'jam-sessions' ? 'Jam Sessions' : 'Tab Playlists'}
          </button>
        ))}
      </div>

      {currentView === 'jam-sessions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-white">Jam Sessions</h3>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Create Jam Session
            </button>
          </div>

          {/* Filters */}
          <div className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg p-4 border border-purple-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 bg-purple-900 bg-opacity-50 border border-purple-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="All">All</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">Genre</label>
                <select
                  value={filters.genre}
                  onChange={(e) => setFilters(prev => ({ ...prev, genre: e.target.value }))}
                  className="w-full px-3 py-2 bg-purple-900 bg-opacity-50 border border-purple-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="All Genres">All Genres</option>
                  {genres.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="w-full px-3 py-2 bg-purple-900 bg-opacity-50 border border-purple-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="Date (Soonest)">Date (Soonest)</option>
                  <option value="Popularity">Popularity</option>
                </select>
              </div>
            </div>
          </div>

          {/* Jam Sessions List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
              <p className="text-purple-300">Loading jam sessions...</p>
            </div>
          ) : jamSessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-purple-300 text-lg">No jam sessions found.</p>
              <p className="text-purple-400">Be the first to create one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jamSessions.map((session) => (
                <div key={session.id} className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg p-6 border border-purple-500 hover:border-purple-400 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <span className="text-purple-400 text-sm font-medium">
                          {formatDate(session.date + 'T' + session.start_time)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          session.status === 'upcoming' ? 'bg-blue-600 text-white' :
                          session.status === 'ongoing' ? 'bg-green-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {session.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <h4 className="text-xl font-semibold text-white mb-2">{session.title}</h4>
                      <p className="text-purple-300 mb-3">{session.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="text-purple-400">
                          <strong>Skill:</strong> {session.skill_level}
                        </span>
                        <span className="text-purple-400">
                          <strong>Location:</strong> {session.location}
                        </span>
                        {session.max_participants && (
                          <span className="text-purple-400">
                            <strong>Max:</strong> {session.max_participants} people
                          </span>
                        )}
                      </div>
                      
                      {session.genres && session.genres.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {session.genres.map(genre => (
                            <span key={genre} className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors ml-4">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {currentView === 'playlists' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-white">Tab Playlists</h3>
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              Create Playlist
            </button>
          </div>

          {playlists.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-purple-300 text-lg">No tab playlists created yet.</p>
              <p className="text-purple-400">Create your first playlist to share Ultimate Guitar tabs!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {playlists.map((playlist) => (
                <div key={playlist.id} className="bg-black bg-opacity-30 backdrop-blur-lg rounded-lg p-6 border border-purple-500">
                  <h4 className="text-xl font-semibold text-white mb-2">{playlist.title}</h4>
                  <p className="text-purple-300 mb-4">{playlist.description}</p>
                  <div className="text-purple-400 text-sm">
                    {playlist.tabs?.length || 0} tabs • Created {new Date(playlist.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
