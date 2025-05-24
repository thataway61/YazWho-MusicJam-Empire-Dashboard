import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

// Import icons from react-icons
import { 
  FaRocket, 
  FaGithub, 
  FaRobot, 
  FaCloud, 
  FaTerminal, 
  FaHistory,
  FaPlay,
  FaCog,
  FaChartLine,
  FaPalette,
  FaEye,
  FaDatabase
} from 'react-icons/fa';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [activeTab, setActiveTab] = useState('paintbrush');
  const [connectionStatus, setConnectionStatus] = useState({
    github: false,
    gemini: false,
    backend: false
  });
  
  // Deployment state
  const [deployments, setDeployments] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [deploymentInProgress, setDeploymentInProgress] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState('thataway61/YazWho-MusicJam-Emergent');
  
  // Command execution state
  const [commandInput, setCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [commandAnalysis, setCommandAnalysis] = useState(null);
  const [executionResults, setExecutionResults] = useState([]);

  useEffect(() => {
    checkConnections();
    loadDeployments();
    loadCommandHistory();
  }, []);

  const checkConnections = async () => {
    try {
      // Test backend connection
      const backendTest = await axios.get(`${BACKEND_URL}/api/test`);
      setConnectionStatus(prev => ({ ...prev, backend: backendTest.status === 200 }));
      
      // Test GitHub connection
      const githubTest = await axios.get(`${BACKEND_URL}/api/github/test`);
      setConnectionStatus(prev => ({ ...prev, github: githubTest.status === 200 }));
      
      // Test Gemini AI connection
      const geminiTest = await axios.get(`${BACKEND_URL}/api/ai/test`);
      setConnectionStatus(prev => ({ ...prev, gemini: geminiTest.status === 200 }));
      
    } catch (error) {
      console.error('Connection test failed:', error);
    }
  };

  const loadDeployments = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/deployment/list`);
      if (response.data.status === 'success') {
        setDeployments(response.data.deployments);
      }
    } catch (error) {
      console.error('Failed to load deployments:', error);
    }
  };

  const loadCommandHistory = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/ai/command-history`);
      if (response.data.status === 'success') {
        setCommandHistory(response.data.history);
      }
    } catch (error) {
      console.error('Failed to load command history:', error);
    }
  };

  const analyzeRepository = async () => {
    try {
      setDeploymentInProgress(true);
      const response = await axios.post(`${BACKEND_URL}/api/deployment/analyze-repository`, {
        repository_name: selectedRepo
      });
      
      if (response.data.status === 'success') {
        setAnalysisResult(response.data.analysis);
      }
    } catch (error) {
      console.error('Repository analysis failed:', error);
      alert('Repository analysis failed: ' + error.response?.data?.detail || error.message);
    } finally {
      setDeploymentInProgress(false);
    }
  };

  const executeAutonomousDeployment = async () => {
    try {
      setDeploymentInProgress(true);
      const response = await axios.post(`${BACKEND_URL}/api/deployment/autonomous-deploy`, {
        repository_name: selectedRepo,
        deployment_type: 'full'
      });
      
      if (response.data.status === 'success') {
        alert('Autonomous deployment initiated successfully!');
        loadDeployments(); // Refresh deployments list
      }
    } catch (error) {
      console.error('Autonomous deployment failed:', error);
      alert('Autonomous deployment failed: ' + error.response?.data?.detail || error.message);
    } finally {
      setDeploymentInProgress(false);
    }
  };

  const analyzeCommand = async () => {
    if (!commandInput.trim()) return;
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/ai/command-analysis`, {
        natural_language_request: commandInput,
        working_directory: '/app'
      });
      
      if (response.data.status === 'success') {
        setCommandAnalysis(response.data.analysis);
      }
    } catch (error) {
      console.error('Command analysis failed:', error);
      alert('Command analysis failed: ' + error.response?.data?.detail || error.message);
    }
  };

  const executeCommand = async () => {
    if (!commandInput.trim()) return;
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/ai/execute-command`, {
        natural_language_request: commandInput,
        working_directory: '/app'
      });
      
      setExecutionResults([response.data, ...executionResults]);
      loadCommandHistory(); // Refresh command history
      setCommandInput(''); // Clear input
      setCommandAnalysis(null); // Clear analysis
    } catch (error) {
      console.error('Command execution failed:', error);
      alert('Command execution failed: ' + error.response?.data?.detail || error.message);
    }
  };

  const ConnectionIndicator = ({ name, connected, icon }) => (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {icon}
      <span className="text-sm font-medium">{name}</span>
      <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
    </div>
  );

  const renderPaintbrushInterface = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <FaPalette className="text-3xl text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800">Emergent Paintbrush</h2>
          <span className="text-gray-600">Express Your Vision</span>
        </div>
        
        {/* Repository Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Repository to Deploy
          </label>
          <input
            type="text"
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="username/repository-name"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={analyzeRepository}
            disabled={deploymentInProgress}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaEye />
            <span>Analyze Repository</span>
          </button>
          
          <button
            onClick={executeAutonomousDeployment}
            disabled={deploymentInProgress || !analysisResult}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaRocket />
            <span>Deploy Autonomously</span>
          </button>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Repository Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700">Frontend Strategy</h4>
                <p className="text-sm text-gray-600">
                  Platform: {analysisResult.deployment_strategy.frontend.platform}
                </p>
                <p className="text-sm text-gray-600">
                  Build: {analysisResult.deployment_strategy.frontend.build_command}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Backend Strategy</h4>
                <p className="text-sm text-gray-600">
                  Platform: {analysisResult.deployment_strategy.backend.platform}
                </p>
                <p className="text-sm text-gray-600">
                  Runtime: {analysisResult.deployment_strategy.backend.start_command}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Command Interface */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <FaTerminal className="text-3xl text-green-600" />
          <h2 className="text-2xl font-bold text-gray-800">AI Command Assistant</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe what you want to do
            </label>
            <textarea
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows="3"
              placeholder="e.g., 'Check if the backend server is running and restart it if needed'"
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={analyzeCommand}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FaCog />
              <span>Analyze</span>
            </button>
            
            <button
              onClick={executeCommand}
              disabled={!commandAnalysis || !commandAnalysis.execution_recommended}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaPlay />
              <span>Execute</span>
            </button>
          </div>

          {/* Command Analysis Display */}
          {commandAnalysis && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-3">AI Analysis</h4>
              <div className="space-y-2">
                {commandAnalysis.commands.map((cmd, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <code className="text-sm">{cmd.command}</code>
                    <span className={`px-2 py-1 rounded text-xs ${
                      cmd.safety_level === 'safe' ? 'bg-green-100 text-green-800' :
                      cmd.safety_level === 'caution' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {cmd.safety_level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCanvasInterface = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <FaRobot className="text-3xl text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">AI Canvas</h2>
          <span className="text-gray-600">Where Magic Happens</span>
        </div>

        {/* Recent Executions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Command Executions</h3>
          {executionResults.length > 0 ? (
            executionResults.slice(0, 5).map((result, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Status: {result.status}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    result.status === 'success' ? 'bg-green-100 text-green-800' :
                    result.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {result.status}
                  </span>
                </div>
                
                {result.execution_results && (
                  <div className="space-y-2">
                    {result.execution_results.map((exec, execIndex) => (
                      <div key={execIndex} className="bg-white p-3 rounded border">
                        <div className="text-sm font-mono text-gray-800">
                          $ {exec.command}
                        </div>
                        {exec.output && (
                          <pre className="text-xs text-gray-600 mt-2 overflow-x-auto">
                            {exec.output}
                          </pre>
                        )}
                        {exec.error && (
                          <pre className="text-xs text-red-600 mt-2 overflow-x-auto">
                            {exec.error}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-600">No recent command executions</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderGalleryInterface = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <FaCloud className="text-3xl text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-800">Deployment Gallery</h2>
          <span className="text-gray-600">Your Creations in the Cloud</span>
        </div>

        {/* Deployments List */}
        <div className="space-y-4">
          {deployments.length > 0 ? (
            deployments.map((deployment) => (
              <div key={deployment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{deployment.repository_name}</h3>
                    <p className="text-gray-600">Type: {deployment.deployment_type}</p>
                    <p className="text-sm text-gray-500">{new Date(deployment.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      deployment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      deployment.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {deployment.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <FaDatabase className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No deployments yet. Start by analyzing a repository!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FaPalette className="text-3xl text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-900">Emergent</h1>
                <span className="text-gray-600">AI-Powered Autonomous Deployment</span>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="flex space-x-3">
              <ConnectionIndicator 
                name="GitHub" 
                connected={connectionStatus.github} 
                icon={<FaGithub />} 
              />
              <ConnectionIndicator 
                name="Gemini AI" 
                connected={connectionStatus.gemini} 
                icon={<FaRobot />} 
              />
              <ConnectionIndicator 
                name="Backend" 
                connected={connectionStatus.backend} 
                icon={<FaDatabase />} 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('paintbrush')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'paintbrush'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FaPalette />
                <span>Paintbrush</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('canvas')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'canvas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FaRobot />
                <span>Canvas</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('gallery')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'gallery'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FaCloud />
                <span>Gallery</span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'paintbrush' && renderPaintbrushInterface()}
        {activeTab === 'canvas' && renderCanvasInterface()}
        {activeTab === 'gallery' && renderGalleryInterface()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Emergent - Your AI Paintbrush for Modern Cloud Deployment
            </p>
            <div className="flex items-center space-x-4">
              <a 
                href="https://github.com/thataway61/YazWho-MusicJam-Emergent" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900"
              >
                <FaGithub className="text-xl" />
              </a>
              <FaChartLine className="text-xl text-gray-600" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;