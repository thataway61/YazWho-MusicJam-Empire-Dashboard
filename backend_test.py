#!/usr/bin/env python3
"""
Backend API Testing for YazWho Empire Dashboard - MusicJam Focus
Tests the transformed MusicJam functionality and all backend APIs
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any

class MusicJamAPITester:
    def __init__(self, base_url="https://69bffd45-7c2d-4493-8fe2-c08c0721f2f3.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, data: Dict = None) -> tuple:
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            details = f"Status: {response.status_code}"
            if not success:
                details += f", Expected: {expected_status}, Response: {response.text[:200]}"

            self.log_test(name, success, details)
            return success, response_data

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_basic_endpoints(self):
        """Test basic Empire Dashboard endpoints"""
        print("\n🔍 Testing Basic Empire Dashboard Endpoints...")
        
        # Test root endpoint
        self.run_test("Root API", "GET", "api", 200)
        
        # Test status endpoint
        self.run_test("Status Check", "GET", "api/status", 200)
        
        # Test empire overview
        self.run_test("Empire Overview", "GET", "api/empire/overview", 200)

    def test_musicjam_genres(self):
        """Test MusicJam genres endpoint"""
        print("\n🎵 Testing MusicJam Genres...")
        
        success, data = self.run_test("Get Genres", "GET", "api/musicjam/genres", 200)
        
        if success and 'genres' in data:
            genres = data['genres']
            if len(genres) == 20:
                self.log_test("Genres Count (20)", True)
            else:
                self.log_test("Genres Count (20)", False, f"Found {len(genres)} genres")
            
            # Check for expected genres
            expected_genres = ["Rock", "Pop", "Jazz", "Blues", "Classical"]
            for genre in expected_genres:
                if genre in genres:
                    self.log_test(f"Genre '{genre}' exists", True)
                else:
                    self.log_test(f"Genre '{genre}' exists", False)
        
        return success, data.get('genres', []) if success else []

    def test_jam_sessions_crud(self):
        """Test Jam Sessions CRUD operations"""
        print("\n🎸 Testing Jam Sessions CRUD...")
        
        # Test GET jam sessions (empty or with existing data)
        success, data = self.run_test("Get Jam Sessions", "GET", "api/musicjam/jam-sessions", 200)
        initial_sessions = data.get('jam_sessions', []) if success else []
        
        print(f"   Found {len(initial_sessions)} existing jam sessions")
        
        # Test filtering by status
        self.run_test("Filter by Status (Upcoming)", "GET", "api/musicjam/jam-sessions?status=upcoming", 200)
        self.run_test("Filter by Status (All)", "GET", "api/musicjam/jam-sessions?status=All", 200)
        
        # Test filtering by genre
        self.run_test("Filter by Genre (Rock)", "GET", "api/musicjam/jam-sessions?genre=Rock", 200)
        self.run_test("Filter by Genre (All Genres)", "GET", "api/musicjam/jam-sessions?genre=All%20Genres", 200)
        
        # Test sorting
        self.run_test("Sort by Date", "GET", "api/musicjam/jam-sessions?sort_by=date", 200)
        self.run_test("Sort by Popularity", "GET", "api/musicjam/jam-sessions?sort_by=popularity", 200)
        
        # Create a test jam session
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        test_session = {
            "title": "Test Blues Jam Session",
            "description": "A test jam session for backend testing",
            "location": "Test Studio, Test City",
            "max_participants": 8,
            "date": tomorrow,
            "start_time": "19:00",
            "end_time": "22:00",
            "skill_level": "Intermediate",
            "genres": ["Blues", "Rock"]
        }
        
        success, create_data = self.run_test("Create Jam Session", "POST", "api/musicjam/jam-sessions", 200, test_session)
        
        if success and 'id' in create_data:
            session_id = create_data['id']
            self.log_test("Jam Session ID returned", True)
            
            # Test getting specific jam session
            self.run_test(f"Get Jam Session by ID", "GET", f"api/musicjam/jam-sessions/{session_id}", 200)
        else:
            self.log_test("Jam Session ID returned", False, "No ID in response")
        
        # Verify the session was created
        success, updated_data = self.run_test("Verify Session Created", "GET", "api/musicjam/jam-sessions", 200)
        if success:
            updated_sessions = updated_data.get('jam_sessions', [])
            if len(updated_sessions) > len(initial_sessions):
                self.log_test("Session Count Increased", True)
            else:
                self.log_test("Session Count Increased", False, f"Before: {len(initial_sessions)}, After: {len(updated_sessions)}")

    def test_playlists_crud(self):
        """Test Tab Playlists CRUD operations"""
        print("\n🎼 Testing Tab Playlists CRUD...")
        
        # Test GET playlists
        success, data = self.run_test("Get Playlists", "GET", "api/musicjam/playlists", 200)
        initial_playlists = data.get('playlists', []) if success else []
        
        print(f"   Found {len(initial_playlists)} existing playlists")
        
        # Create a test playlist
        test_playlist = {
            "title": "Test Rock Playlist",
            "description": "A test playlist for backend testing",
            "tabs": [
                {
                    "title": "Smoke on the Water",
                    "artist": "Deep Purple",
                    "tab_url": "https://tabs.ultimate-guitar.com/tab/deep-purple/smoke-on-the-water-tabs-1234",
                    "youtube_url": "https://youtube.com/watch?v=test123"
                }
            ],
            "genres": ["Rock", "Classic Rock"]
        }
        
        success, create_data = self.run_test("Create Playlist", "POST", "api/musicjam/playlists", 200, test_playlist)
        
        if success and 'id' in create_data:
            self.log_test("Playlist ID returned", True)
        else:
            self.log_test("Playlist ID returned", False, "No ID in response")

    def test_ai_enhancements(self):
        """Test AI Enhancement endpoints"""
        print("\n🤖 Testing AI Enhancement Endpoints...")
        
        # Test getting existing enhancements
        self.run_test("Get MusicJam Enhancements", "GET", "api/musicjam/enhancements", 200)
        
        # Test AI music recommendations
        self.run_test("AI Music Recommendations", "GET", "api/ai/recommendations/music?mood=happy&genre=rock", 200)
        
        # Test AI enhancement generation (if Gemini is configured)
        enhancement_request = {
            "musicjam_feature": "social-sharing",
            "enhancement_type": "social",
            "user_preferences": {
                "focus": "user_engagement",
                "platform": "web"
            }
        }
        
        self.run_test("Generate AI Enhancement", "POST", "api/ai/musicjam/enhance", 200, enhancement_request)

    def test_github_integration(self):
        """Test GitHub integration endpoints"""
        print("\n🐙 Testing GitHub Integration...")
        
        # Test getting repositories
        self.run_test("Get GitHub Repositories", "GET", "api/github/repositories", 200)

    def test_deployment_endpoints(self):
        """Test deployment-related endpoints"""
        print("\n🚀 Testing Deployment Endpoints...")
        
        # Test deployment status
        self.run_test("Get Deployment Status", "GET", "api/deploy/status", 200)
        
        # Test projects endpoint
        self.run_test("Get Projects", "GET", "api/projects", 200)

    def test_error_handling(self):
        """Test error handling for invalid requests"""
        print("\n⚠️ Testing Error Handling...")
        
        # Test invalid jam session ID
        self.run_test("Invalid Jam Session ID", "GET", "api/musicjam/jam-sessions/invalid-id", 404)
        
        # Test invalid endpoint
        self.run_test("Invalid Endpoint", "GET", "api/invalid/endpoint", 404)
        
        # Test invalid POST data
        invalid_session = {"title": ""}  # Missing required fields
        self.run_test("Invalid Jam Session Data", "POST", "api/musicjam/jam-sessions", 422, invalid_session)

    def test_existing_test_data(self):
        """Test for existing test data mentioned in the review"""
        print("\n📊 Testing for Existing Test Data...")
        
        success, data = self.run_test("Check for Test Sessions", "GET", "api/musicjam/jam-sessions", 200)
        
        if success and 'jam_sessions' in data:
            sessions = data['jam_sessions']
            
            # Look for Blues Jam and Jazz Fusion Workshop
            blues_found = any("blues" in session.get('title', '').lower() for session in sessions)
            jazz_found = any("jazz" in session.get('title', '').lower() for session in sessions)
            
            self.log_test("Blues Jam Session exists", blues_found)
            self.log_test("Jazz Fusion Workshop exists", jazz_found)
            
            print(f"   Found sessions: {[s.get('title', 'Untitled') for s in sessions]}")

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting YazWho Empire Dashboard Backend Tests")
        print(f"🎯 Target URL: {self.base_url}")
        print("=" * 60)
        
        # Run test suites
        self.test_basic_endpoints()
        self.test_musicjam_genres()
        self.test_jam_sessions_crud()
        self.test_playlists_crud()
        self.test_ai_enhancements()
        self.test_github_integration()
        self.test_deployment_endpoints()
        self.test_error_handling()
        self.test_existing_test_data()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['name']}: {test['details']}")
        
        print("\n🎵 MusicJam Transformation Test Complete!")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = MusicJamAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())