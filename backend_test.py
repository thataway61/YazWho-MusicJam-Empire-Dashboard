#!/usr/bin/env python3
"""
YazWho Empire Dashboard Backend API Testing Suite
Tests all API endpoints for functionality, integration, and data persistence
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

class YazWhoEmpireAPITester:
    def __init__(self, base_url: str = "https://69bffd45-7c2d-4493-8fe2-c08c0721f2f3.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} | {name}")
        if details:
            print(f"     Details: {details}")
        if not success and response_data:
            print(f"     Response: {response_data}")
        print()

    def test_api_endpoint(self, method: str, endpoint: str, expected_status: int = 200, 
                         data: Optional[Dict] = None, params: Optional[Dict] = None) -> tuple:
        """Generic API endpoint tester"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, params=params, timeout=10)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, params=params, timeout=10)
            else:
                return False, f"Unsupported method: {method}", {}

            success = response.status_code == expected_status
            
            try:
                response_json = response.json()
            except:
                response_json = {"raw_response": response.text}

            if not success:
                details = f"Expected {expected_status}, got {response.status_code}"
            else:
                details = f"Status {response.status_code} - OK"

            return success, details, response_json

        except requests.exceptions.Timeout:
            return False, "Request timeout (10s)", {}
        except requests.exceptions.ConnectionError:
            return False, "Connection error - server may be down", {}
        except Exception as e:
            return False, f"Unexpected error: {str(e)}", {}

    def test_basic_endpoints(self):
        """Test basic API endpoints"""
        print("🔍 Testing Basic API Endpoints...")
        
        # Test root endpoint
        success, details, data = self.test_api_endpoint('GET', '/api')
        self.log_test("Root API Endpoint", success, details, data)
        
        # Test status endpoint
        success, details, data = self.test_api_endpoint('GET', '/api/status')
        self.log_test("Status Endpoint", success, details, data)
        
        return self.tests_passed > 0

    def test_empire_overview(self):
        """Test empire overview endpoint"""
        print("🏰 Testing Empire Overview...")
        
        success, details, data = self.test_api_endpoint('GET', '/api/empire/overview')
        self.log_test("Empire Overview", success, details, data)
        
        if success and data:
            # Validate response structure
            required_fields = ['empire_status', 'musicjam_app', 'managed_projects', 'ai_enhancements', 'integrations']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test("Empire Overview Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Empire Overview Structure", True, "All required fields present")
                
                # Check MusicJam status
                musicjam_status = data.get('musicjam_app', {}).get('status')
                self.log_test("MusicJam Live Status Check", 
                            musicjam_status in ['online', 'offline', 'issues'],
                            f"MusicJam status: {musicjam_status}")

    def test_github_integration(self):
        """Test GitHub integration endpoints"""
        print("🐙 Testing GitHub Integration...")
        
        # Test repositories endpoint
        success, details, data = self.test_api_endpoint('GET', '/api/github/repositories')
        self.log_test("GitHub Repositories", success, details, data)
        
        if success and data:
            repos = data.get('repositories', [])
            self.log_test("GitHub Repositories Count", 
                        len(repos) > 0, 
                        f"Found {len(repos)} repositories")
            
            # Check for YazWho-MusicJam-Empire-Dashboard repo
            empire_repo = any(repo.get('name') == 'YazWho-MusicJam-Empire-Dashboard' for repo in repos)
            self.log_test("Empire Dashboard Repository Found", 
                        empire_repo, 
                        "YazWho-MusicJam-Empire-Dashboard repository detected" if empire_repo else "Repository not found")

    def test_ai_integrations(self):
        """Test AI integration endpoints"""
        print("🤖 Testing AI Integrations...")
        
        # Test MusicJam enhancement generation
        enhancement_data = {
            "musicjam_feature": "playlist-management",
            "enhancement_type": "recommendation",
            "user_preferences": {
                "focus": "user_engagement",
                "platform": "web"
            }
        }
        
        success, details, data = self.test_api_endpoint('POST', '/api/ai/musicjam/enhance', 
                                                       expected_status=200, data=enhancement_data)
        self.log_test("AI MusicJam Enhancement", success, details, data)
        
        if success and data:
            # Validate enhancement response
            required_fields = ['enhancement_id', 'ai_suggestion', 'feature', 'type']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test("Enhancement Response Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Enhancement Response Structure", True, "All required fields present")
                
                # Check if AI suggestion is meaningful
                ai_suggestion = data.get('ai_suggestion', '')
                self.log_test("AI Suggestion Quality", 
                            len(ai_suggestion) > 50,
                            f"AI suggestion length: {len(ai_suggestion)} characters")
        
        # Test music recommendations
        success, details, data = self.test_api_endpoint('GET', '/api/ai/recommendations/music',
                                                       params={'mood': 'happy', 'genre': 'pop'})
        self.log_test("AI Music Recommendations", success, details, data)
        
        if success and data:
            recommendations = data.get('recommendations', '')
            self.log_test("Music Recommendations Quality",
                        len(recommendations) > 50,
                        f"Recommendations length: {len(recommendations)} characters")

    def test_project_management(self):
        """Test project management endpoints"""
        print("📁 Testing Project Management...")
        
        # Test get projects
        success, details, data = self.test_api_endpoint('GET', '/api/projects')
        self.log_test("Get Projects", success, details, data)
        
        if success:
            projects = data.get('projects', [])
            self.log_test("Projects Data Structure", 
                        isinstance(projects, list),
                        f"Projects is a list with {len(projects)} items")

    def test_musicjam_enhancements(self):
        """Test MusicJam enhancements endpoints"""
        print("🎵 Testing MusicJam Enhancements...")
        
        # Test get enhancements
        success, details, data = self.test_api_endpoint('GET', '/api/musicjam/enhancements')
        self.log_test("Get MusicJam Enhancements", success, details, data)
        
        if success:
            enhancements = data.get('enhancements', [])
            self.log_test("Enhancements Data Structure",
                        isinstance(enhancements, list),
                        f"Enhancements is a list with {len(enhancements)} items")

    def test_oauth_integration(self):
        """Test OAuth integration"""
        print("🔐 Testing OAuth Integration...")
        
        success, details, data = self.test_api_endpoint('GET', '/api/oauth/google/url')
        self.log_test("Google OAuth URL", success, details, data)
        
        if success and data:
            oauth_url = data.get('oauth_url', '')
            self.log_test("OAuth URL Validity",
                        'accounts.google.com' in oauth_url,
                        f"OAuth URL contains Google domain: {bool('accounts.google.com' in oauth_url)}")

    def test_deployment_functionality(self):
        """Test deployment functionality"""
        print("🚀 Testing Deployment Functionality...")
        
        # Test deployment endpoint with sample data
        deployment_data = {
            "project_name": "test-deployment",
            "repository_url": "https://github.com/test/test-repo",
            "description": "Test deployment via API testing",
            "target_platform": "vercel"
        }
        
        success, details, data = self.test_api_endpoint('POST', '/api/github/deploy',
                                                       expected_status=200, data=deployment_data)
        self.log_test("Project Deployment", success, details, data)
        
        if success and data:
            project_id = data.get('project_id')
            self.log_test("Deployment Response Structure",
                        bool(project_id),
                        f"Project ID generated: {project_id}")

    def run_comprehensive_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting YazWho Empire Dashboard API Testing Suite")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 80)
        
        # Run all test suites
        self.test_basic_endpoints()
        self.test_empire_overview()
        self.test_github_integration()
        self.test_ai_integrations()
        self.test_project_management()
        self.test_musicjam_enhancements()
        self.test_oauth_integration()
        self.test_deployment_functionality()
        
        # Print summary
        self.print_summary()
        
        return self.tests_passed == self.tests_run

    def print_summary(self):
        """Print test summary"""
        print("=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        # Print failed tests
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  • {test['test']}: {test['details']}")
        
        # Print key findings
        print("\n🔍 KEY FINDINGS:")
        
        # Check integration status
        empire_tests = [r for r in self.test_results if 'Empire Overview' in r['test'] and r['success']]
        if empire_tests:
            print("  • Empire Dashboard is operational")
        
        github_tests = [r for r in self.test_results if 'GitHub' in r['test'] and r['success']]
        if github_tests:
            print("  • GitHub integration is working")
        
        ai_tests = [r for r in self.test_results if 'AI' in r['test'] and r['success']]
        if ai_tests:
            print("  • AI integrations are functional")
        
        print("\n🎯 RECOMMENDATIONS:")
        if self.tests_passed == self.tests_run:
            print("  • All systems operational - ready for frontend testing")
        else:
            print("  • Some backend issues detected - review failed tests before frontend testing")

def main():
    """Main test execution"""
    tester = YazWhoEmpireAPITester()
    
    try:
        success = tester.run_comprehensive_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️ Testing interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Testing failed with error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())