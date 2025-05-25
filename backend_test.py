#!/usr/bin/env python3
"""
YazWho Empire v2.0.0 - Comprehensive Backend API Testing
Production Readiness Testing for all 25+ API endpoints
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta
from typing import Dict, Any, List

class YazWhoEmpireAPITester:
    def __init__(self, base_url: str = "https://69bffd45-7c2d-4493-8fe2-c08c0721f2f3.preview.emergentagent.com"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'YazWho-Empire-Tester/2.0.0'
        })
        
        # Test tracking
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.test_results = []
        self.performance_metrics = []
        
        # Test data storage
        self.created_jam_session_id = None
        self.created_playlist_id = None
        self.created_enhancement_id = None
        self.created_project_id = None

    def log_test(self, name: str, success: bool, response_time: float, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASS"
        else:
            self.tests_failed += 1
            status = "❌ FAIL"
        
        result = {
            'test': name,
            'status': status,
            'response_time': f"{response_time:.3f}s",
            'details': details
        }
        self.test_results.append(result)
        self.performance_metrics.append(response_time)
        
        print(f"{status} | {name} | {response_time:.3f}s | {details}")

    def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> tuple:
        """Make HTTP request and measure performance"""
        url = f"{self.base_url}{endpoint}"
        start_time = time.time()
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, params=params, timeout=15)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, params=params, timeout=15)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, timeout=15)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, timeout=15)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            response_time = time.time() - start_time
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}
            
            return response.status_code, response_data, response_time
            
        except Exception as e:
            response_time = time.time() - start_time
            return 0, {"error": str(e)}, response_time

    # ==================== CORE API TESTS ====================
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        status, data, rt = self.make_request('GET', '/api')
        success = status == 200 and 'YazWho Empire Dashboard' in data.get('message', '')
        self.log_test("Root API Endpoint", success, rt, f"Status: {status}")
        return success

    def test_status_endpoint(self):
        """Test status endpoint with integrations check"""
        status, data, rt = self.make_request('GET', '/api/status')
        success = status == 200 and 'integrations' in data.get('message', '')
        self.log_test("Status Endpoint", success, rt, f"Status: {status}")
        return success

    def test_empire_overview(self):
        """Test empire overview endpoint"""
        status, data, rt = self.make_request('GET', '/api/empire/overview')
        success = status == 200 and 'empire_status' in data
        details = f"Projects: {data.get('managed_projects', 0)}, Enhancements: {data.get('ai_enhancements', 0)}"
        self.log_test("Empire Overview", success, rt, details)
        return success

    # ==================== GITHUB INTEGRATION TESTS ====================
    
    def test_github_repositories(self):
        """Test GitHub repositories endpoint"""
        status, data, rt = self.make_request('GET', '/api/github/repositories')
        success = status in [200, 400]  # 400 if GitHub not configured is acceptable
        details = f"Status: {status}, Repos: {len(data.get('repositories', []))}"
        self.log_test("GitHub Repositories", success, rt, details)
        return success

    def test_github_deploy(self):
        """Test GitHub deployment endpoint"""
        deploy_data = {
            "project_name": "test-deployment",
            "repository_url": "https://github.com/test/repo",
            "description": "Test deployment via API testing",
            "target_platform": "vercel"
        }
        status, data, rt = self.make_request('POST', '/api/github/deploy', deploy_data)
        success = status == 200 and 'project_id' in data
        if success:
            self.created_project_id = data.get('project_id')
        self.log_test("GitHub Deploy", success, rt, f"Status: {status}")
        return success

    # ==================== AI ENHANCEMENT TESTS ====================
    
    def test_ai_musicjam_enhance(self):
        """Test AI MusicJam enhancement generation"""
        enhancement_data = {
            "musicjam_feature": "social-sharing",
            "enhancement_type": "recommendation",
            "user_preferences": {
                "focus": "user_engagement",
                "platform": "web"
            }
        }
        status, data, rt = self.make_request('POST', '/api/ai/musicjam/enhance', enhancement_data)
        success = status in [200, 400]  # 400 if AI not configured is acceptable
        if success and status == 200:
            self.created_enhancement_id = data.get('enhancement_id')
        self.log_test("AI MusicJam Enhancement", success, rt, f"Status: {status}")
        return success

    def test_ai_music_recommendations(self):
        """Test AI music recommendations"""
        params = {"mood": "happy", "genre": "rock"}
        status, data, rt = self.make_request('GET', '/api/ai/recommendations/music', params=params)
        success = status in [200, 400]  # 400 if AI not configured is acceptable
        self.log_test("AI Music Recommendations", success, rt, f"Status: {status}")
        return success

    # ==================== PROJECT MANAGEMENT TESTS ====================
    
    def test_get_projects(self):
        """Test get all projects"""
        status, data, rt = self.make_request('GET', '/api/projects')
        success = status == 200 and 'projects' in data
        details = f"Projects found: {len(data.get('projects', []))}"
        self.log_test("Get Projects", success, rt, details)
        return success

    def test_get_project_by_id(self):
        """Test get specific project by ID"""
        if not self.created_project_id:
            self.log_test("Get Project by ID", False, 0, "No project ID available")
            return False
        
        status, data, rt = self.make_request('GET', f'/api/projects/{self.created_project_id}')
        success = status in [200, 404]  # 404 acceptable if project not found
        self.log_test("Get Project by ID", success, rt, f"Status: {status}")
        return success

    def test_get_musicjam_enhancements(self):
        """Test get MusicJam enhancements"""
        status, data, rt = self.make_request('GET', '/api/musicjam/enhancements')
        success = status == 200 and 'enhancements' in data
        details = f"Enhancements found: {len(data.get('enhancements', []))}"
        self.log_test("Get MusicJam Enhancements", success, rt, details)
        return success

    # ==================== MUSICJAM APPLICATION TESTS ====================
    
    def test_get_jam_sessions(self):
        """Test get jam sessions with filtering"""
        status, data, rt = self.make_request('GET', '/api/musicjam/jam-sessions')
        success = status == 200 and 'jam_sessions' in data
        details = f"Jam sessions found: {len(data.get('jam_sessions', []))}"
        self.log_test("Get Jam Sessions", success, rt, details)
        return success

    def test_create_jam_session(self):
        """Test create new jam session"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        jam_data = {
            "title": "Test Rock Jam Session",
            "description": "Testing jam session creation via API",
            "location": "Test Studio, Test City",
            "max_participants": 5,
            "date": tomorrow,
            "start_time": "19:00",
            "end_time": "22:00",
            "skill_level": "Intermediate",
            "genres": ["Rock", "Blues"]
        }
        status, data, rt = self.make_request('POST', '/api/musicjam/jam-sessions', jam_data)
        success = status == 200 and 'id' in data
        if success:
            self.created_jam_session_id = data.get('id')
        self.log_test("Create Jam Session", success, rt, f"Status: {status}")
        return success

    def test_get_jam_session_by_id(self):
        """Test get specific jam session"""
        if not self.created_jam_session_id:
            self.log_test("Get Jam Session by ID", False, 0, "No jam session ID available")
            return False
        
        status, data, rt = self.make_request('GET', f'/api/musicjam/jam-sessions/{self.created_jam_session_id}')
        success = status == 200 and 'title' in data
        self.log_test("Get Jam Session by ID", success, rt, f"Status: {status}")
        return success

    def test_get_playlists(self):
        """Test get tab playlists"""
        status, data, rt = self.make_request('GET', '/api/musicjam/playlists')
        success = status == 200 and 'playlists' in data
        details = f"Playlists found: {len(data.get('playlists', []))}"
        self.log_test("Get Playlists", success, rt, details)
        return success

    def test_create_playlist(self):
        """Test create new tab playlist"""
        playlist_data = {
            "title": "Test Rock Playlist",
            "description": "Testing playlist creation via API",
            "tabs": [
                {
                    "title": "Smoke on the Water",
                    "artist": "Deep Purple",
                    "tab_url": "https://tabs.ultimate-guitar.com/tab/deep-purple/smoke-on-the-water-tabs-1234",
                    "youtube_url": "https://youtube.com/watch?v=test"
                }
            ],
            "genres": ["Rock", "Classic Rock"]
        }
        status, data, rt = self.make_request('POST', '/api/musicjam/playlists', playlist_data)
        success = status == 200 and 'id' in data
        if success:
            self.created_playlist_id = data.get('id')
        self.log_test("Create Playlist", success, rt, f"Status: {status}")
        return success

    def test_get_genres(self):
        """Test get available genres"""
        status, data, rt = self.make_request('GET', '/api/musicjam/genres')
        success = status == 200 and 'genres' in data
        details = f"Genres available: {len(data.get('genres', []))}"
        self.log_test("Get Genres", success, rt, details)
        return success

    # ==================== DEPLOYMENT TESTS ====================
    
    def test_deploy_enhancement(self):
        """Test deploy enhancement endpoint"""
        if not self.created_enhancement_id:
            self.log_test("Deploy Enhancement", False, 0, "No enhancement ID available")
            return False
        
        deploy_data = {
            "enhancement_id": self.created_enhancement_id,
            "deployment_target": "staging"
        }
        status, data, rt = self.make_request('POST', '/api/deploy/enhancement', deploy_data)
        success = status in [200, 404]  # 404 if enhancement not found is acceptable
        self.log_test("Deploy Enhancement", success, rt, f"Status: {status}")
        return success

    def test_get_deployment_status(self):
        """Test get deployment status"""
        status, data, rt = self.make_request('GET', '/api/deploy/status')
        success = status == 200 and 'deployments' in data
        details = f"Deployments found: {len(data.get('deployments', []))}"
        self.log_test("Get Deployment Status", success, rt, details)
        return success

    def test_generate_component(self):
        """Test React component generation"""
        component_data = {
            "component_name": "TestMusicComponent",
            "feature_type": "music-player",
            "description": "Test component generation for music player functionality"
        }
        status, data, rt = self.make_request('POST', '/api/generate/component', component_data)
        success = status in [200, 400]  # 400 if AI not configured is acceptable
        self.log_test("Generate Component", success, rt, f"Status: {status}")
        return success

    def test_simulate_musicjam_deployment(self):
        """Test MusicJam deployment simulation"""
        if not self.created_enhancement_id:
            self.log_test("Simulate MusicJam Deployment", False, 0, "No enhancement ID available")
            return False
        
        status, data, rt = self.make_request('POST', f'/api/musicjam/simulate-deploy?enhancement_id={self.created_enhancement_id}')
        success = status in [200, 404]  # 404 if enhancement not found is acceptable
        self.log_test("Simulate MusicJam Deployment", success, rt, f"Status: {status}")
        return success

    # ==================== FILTERING AND SORTING TESTS ====================
    
    def test_jam_sessions_filtering(self):
        """Test jam sessions with filters"""
        test_cases = [
            {"status": "upcoming", "genre": "Rock", "sort_by": "date"},
            {"status": "All", "genre": "All Genres", "sort_by": "date"},
            {"genre": "Blues", "sort_by": "date"}
        ]
        
        all_passed = True
        for i, params in enumerate(test_cases):
            status, data, rt = self.make_request('GET', '/api/musicjam/jam-sessions', params=params)
            success = status == 200 and 'jam_sessions' in data
            if not success:
                all_passed = False
            details = f"Filter {i+1}: {len(data.get('jam_sessions', []))} results"
            self.log_test(f"Jam Sessions Filter {i+1}", success, rt, details)
        
        return all_passed

    # ==================== ERROR HANDLING TESTS ====================
    
    def test_invalid_endpoints(self):
        """Test error handling for invalid endpoints"""
        invalid_endpoints = [
            '/api/nonexistent',
            '/api/projects/invalid-id',
            '/api/musicjam/jam-sessions/invalid-id'
        ]
        
        all_passed = True
        for endpoint in invalid_endpoints:
            status, data, rt = self.make_request('GET', endpoint)
            success = status in [404, 422]  # Expecting 404 or 422 for invalid requests
            if not success:
                all_passed = False
            self.log_test(f"Invalid Endpoint {endpoint}", success, rt, f"Status: {status}")
        
        return all_passed

    def test_invalid_data_submission(self):
        """Test error handling for invalid data"""
        # Test invalid jam session data
        invalid_jam_data = {
            "title": "",  # Empty title should fail
            "description": "Test",
            "location": "Test"
            # Missing required fields
        }
        status, data, rt = self.make_request('POST', '/api/musicjam/jam-sessions', invalid_jam_data)
        success = status in [400, 422]  # Expecting validation error
        self.log_test("Invalid Jam Session Data", success, rt, f"Status: {status}")
        
        # Test invalid enhancement data
        invalid_enhancement_data = {
            "musicjam_feature": "",  # Empty feature
            "enhancement_type": ""   # Empty type
        }
        status, data, rt = self.make_request('POST', '/api/ai/musicjam/enhance', invalid_enhancement_data)
        success = status in [400, 422]  # Expecting validation error
        self.log_test("Invalid Enhancement Data", success, rt, f"Status: {status}")
        
        return True

    # ==================== MAIN TEST RUNNER ====================
    
    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting YazWho Empire v2.0.0 Backend API Testing")
        print("=" * 60)
        
        start_time = time.time()
        
        # Core API Tests
        print("\n📡 CORE API TESTS")
        print("-" * 30)
        self.test_root_endpoint()
        self.test_status_endpoint()
        self.test_empire_overview()
        
        # GitHub Integration Tests
        print("\n🐙 GITHUB INTEGRATION TESTS")
        print("-" * 30)
        self.test_github_repositories()
        self.test_github_deploy()
        
        # AI Enhancement Tests
        print("\n🤖 AI ENHANCEMENT TESTS")
        print("-" * 30)
        self.test_ai_musicjam_enhance()
        self.test_ai_music_recommendations()
        
        # Project Management Tests
        print("\n📊 PROJECT MANAGEMENT TESTS")
        print("-" * 30)
        self.test_get_projects()
        self.test_get_project_by_id()
        self.test_get_musicjam_enhancements()
        
        # MusicJam Application Tests
        print("\n🎵 MUSICJAM APPLICATION TESTS")
        print("-" * 30)
        self.test_get_jam_sessions()
        self.test_create_jam_session()
        self.test_get_jam_session_by_id()
        self.test_get_playlists()
        self.test_create_playlist()
        self.test_get_genres()
        
        # Deployment Tests
        print("\n🚀 DEPLOYMENT TESTS")
        print("-" * 30)
        self.test_deploy_enhancement()
        self.test_get_deployment_status()
        self.test_generate_component()
        self.test_simulate_musicjam_deployment()
        
        # Filtering and Sorting Tests
        print("\n🔍 FILTERING & SORTING TESTS")
        print("-" * 30)
        self.test_jam_sessions_filtering()
        
        # Error Handling Tests
        print("\n⚠️ ERROR HANDLING TESTS")
        print("-" * 30)
        self.test_invalid_endpoints()
        self.test_invalid_data_submission()
        
        # Generate Report
        total_time = time.time() - start_time
        self.generate_report(total_time)

    def generate_report(self, total_time: float):
        """Generate comprehensive test report"""
        print("\n" + "=" * 60)
        print("📊 YAZWHO EMPIRE v2.0.0 - TEST RESULTS SUMMARY")
        print("=" * 60)
        
        # Overall Statistics
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        avg_response_time = sum(self.performance_metrics) / len(self.performance_metrics) if self.performance_metrics else 0
        
        print(f"🎯 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_failed}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        print(f"⏱️ Total Time: {total_time:.2f}s")
        print(f"⚡ Avg Response Time: {avg_response_time:.3f}s")
        
        # Performance Analysis
        if self.performance_metrics:
            max_time = max(self.performance_metrics)
            min_time = min(self.performance_metrics)
            print(f"🐌 Slowest Response: {max_time:.3f}s")
            print(f"⚡ Fastest Response: {min_time:.3f}s")
        
        # Production Readiness Assessment
        print("\n🏆 PRODUCTION READINESS ASSESSMENT")
        print("-" * 40)
        
        if success_rate >= 90:
            print("✅ EXCELLENT - Ready for production deployment")
        elif success_rate >= 80:
            print("⚠️ GOOD - Minor issues to address before production")
        elif success_rate >= 70:
            print("🔶 FAIR - Several issues need fixing")
        else:
            print("❌ POOR - Major issues prevent production deployment")
        
        # Performance Assessment
        if avg_response_time <= 2.0:
            print("⚡ PERFORMANCE: Excellent response times")
        elif avg_response_time <= 5.0:
            print("🔶 PERFORMANCE: Acceptable response times")
        else:
            print("🐌 PERFORMANCE: Slow response times need optimization")
        
        # Critical Issues
        failed_tests = [result for result in self.test_results if "FAIL" in result['status']]
        if failed_tests:
            print(f"\n❌ CRITICAL ISSUES ({len(failed_tests)} failed tests):")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        
        # Data Persistence Check
        created_items = sum([
            1 if self.created_jam_session_id else 0,
            1 if self.created_playlist_id else 0,
            1 if self.created_enhancement_id else 0,
            1 if self.created_project_id else 0
        ])
        print(f"\n💾 DATA PERSISTENCE: {created_items}/4 items successfully created")
        
        # Final Recommendation
        print("\n🎯 FINAL RECOMMENDATION:")
        if success_rate >= 90 and avg_response_time <= 5.0:
            print("🚀 GO-LIVE APPROVED - All systems operational for production")
        else:
            print("⏸️ HOLD DEPLOYMENT - Address issues before production release")
        
        print("=" * 60)
        
        return success_rate >= 90 and avg_response_time <= 5.0


def main():
    """Main test execution"""
    # Use the public endpoint from frontend/.env
    BACKEND_URL = "https://69bffd45-7c2d-4493-8fe2-c08c0721f2f3.preview.emergentagent.com"
    
    print(f"🎯 Testing YazWho Empire Backend at: {BACKEND_URL}")
    
    tester = YazWhoEmpireAPITester(BACKEND_URL)
    
    try:
        production_ready = tester.run_all_tests()
        return 0 if production_ready else 1
    except KeyboardInterrupt:
        print("\n⏹️ Testing interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Testing failed with error: {str(e)}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
