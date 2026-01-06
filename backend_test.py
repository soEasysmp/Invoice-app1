#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class CryptoPaymentAPITester:
    def __init__(self, base_url="https://cryptbill-system.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.client_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Expected {expected_status}, got {response.status_code}"
            if not success and response.text:
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', response.text[:100])}"
                except:
                    details += f" - {response.text[:100]}"

            self.log_test(name, success, details if not success else "")
            return success, response.json() if success and response.text else {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_admin_registration(self):
        """Test admin user registration"""
        admin_data = {
            "email": f"admin_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "AdminPass123!",
            "full_name": "Test Admin",
            "role": "admin"
        }
        
        success, response = self.run_test(
            "Admin Registration",
            "POST",
            "auth/register",
            200,
            data=admin_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            return admin_data
        return None

    def test_client_registration(self):
        """Test client user registration"""
        client_data = {
            "email": f"client_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "ClientPass123!",
            "full_name": "Test Client",
            "role": "client"
        }
        
        success, response = self.run_test(
            "Client Registration",
            "POST",
            "auth/register",
            200,
            data=client_data
        )
        
        if success and 'access_token' in response:
            self.client_token = response['access_token']
            return client_data
        return None

    def test_login(self, email, password, user_type):
        """Test user login"""
        login_data = {"email": email, "password": password}
        
        success, response = self.run_test(
            f"{user_type} Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        return success, response.get('access_token') if success else None

    def get_auth_headers(self, token):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {token}"}

    def test_dashboard_stats(self, token, user_type):
        """Test dashboard stats endpoint"""
        success, response = self.run_test(
            f"{user_type} Dashboard Stats",
            "GET",
            "dashboard/stats",
            200,
            headers=self.get_auth_headers(token)
        )
        return success, response

    def test_staff_creation(self):
        """Test staff member creation"""
        if not self.admin_token:
            self.log_test("Staff Creation", False, "No admin token available")
            return None, None

        staff_data = {
            "name": "Test Staff Member",
            "email": f"staff_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "StaffPass123!",
            "ltc_address": "ltc1qtest123456789",
            "usdt_address": "0xtest123456789abcdef",
            "usdc_address": "0xtest987654321fedcba"
        }
        
        success, response = self.run_test(
            "Staff Creation",
            "POST",
            "staff",
            200,
            data=staff_data,
            headers=self.get_auth_headers(self.admin_token)
        )
        
        return response.get('id') if success else None, staff_data if success else None

    def test_staff_list(self, token):
        """Test staff listing"""
        success, response = self.run_test(
            "Staff List",
            "GET",
            "staff",
            200,
            headers=self.get_auth_headers(token)
        )
        return success, response

    def test_invoice_creation(self, staff_id, client_id):
        """Test invoice creation"""
        if not self.admin_token or not staff_id or not client_id:
            self.log_test("Invoice Creation", False, "Missing required data")
            return None

        invoice_data = {
            "staff_id": staff_id,
            "client_id": client_id,
            "amount": 100.50,
            "currency": "USDT",
            "description": "Test Payment Invoice"
        }
        
        success, response = self.run_test(
            "Invoice Creation",
            "POST",
            "invoices",
            200,
            data=invoice_data,
            headers=self.get_auth_headers(self.admin_token)
        )
        
        return response.get('id') if success else None

    def test_invoice_list(self, token, user_type):
        """Test invoice listing"""
        success, response = self.run_test(
            f"{user_type} Invoice List",
            "GET",
            "invoices",
            200,
            headers=self.get_auth_headers(token)
        )
        return success, response

    def test_invoice_detail(self, invoice_id, token):
        """Test invoice detail retrieval"""
        if not invoice_id:
            self.log_test("Invoice Detail", False, "No invoice ID available")
            return False

        success, response = self.run_test(
            "Invoice Detail",
            "GET",
            f"invoices/{invoice_id}",
            200,
            headers=self.get_auth_headers(token)
        )
        return success, response

    def test_payment_check(self, invoice_id, token):
        """Test payment status check"""
        if not invoice_id:
            self.log_test("Payment Check", False, "No invoice ID available")
            return False

        success, response = self.run_test(
            "Payment Status Check",
            "POST",
            f"invoices/{invoice_id}/check-payment",
            200,
            headers=self.get_auth_headers(token)
        )
        return success, response

    def test_unauthorized_access(self):
        """Test unauthorized access scenarios"""
        # Test accessing admin endpoints without token
        self.run_test(
            "Unauthorized Staff Access",
            "GET",
            "staff",
            401
        )
        
        # Test accessing admin endpoints with client token
        if self.client_token:
            self.run_test(
                "Client Accessing Admin Endpoint",
                "POST",
                "staff",
                403,
                data={"name": "Test", "email": "test@test.com"},
                headers=self.get_auth_headers(self.client_token)
            )

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Crypto Payment System API Tests")
        print("=" * 50)

        # Test user registration and authentication
        admin_data = self.test_admin_registration()
        client_data = self.test_client_registration()

        if not admin_data or not client_data:
            print("❌ Failed to create test users, stopping tests")
            return False

        # Test login functionality
        admin_login_success, admin_token = self.test_login(admin_data['email'], admin_data['password'], "Admin")
        client_login_success, client_token = self.test_login(client_data['email'], client_data['password'], "Client")

        if admin_token:
            self.admin_token = admin_token
        if client_token:
            self.client_token = client_token

        # Test dashboard stats
        if self.admin_token:
            self.test_dashboard_stats(self.admin_token, "Admin")
        if self.client_token:
            self.test_dashboard_stats(self.client_token, "Client")

        # Test staff management
        staff_id = self.test_staff_creation()
        if self.admin_token:
            self.test_staff_list(self.admin_token)

        # Test invoice management
        invoice_id = None
        if staff_id and client_data:
            # Extract client ID from registration response
            client_id = None
            if self.client_token:
                # Get client info to extract ID
                success, client_info = self.run_test(
                    "Get Client Info",
                    "GET",
                    "auth/me",
                    200,
                    headers=self.get_auth_headers(self.client_token)
                )
                if success:
                    client_id = client_info.get('id')

            if client_id:
                invoice_id = self.test_invoice_creation(staff_id, client_id)

        # Test invoice operations
        if self.admin_token:
            self.test_invoice_list(self.admin_token, "Admin")
        if self.client_token:
            self.test_invoice_list(self.client_token, "Client")

        if invoice_id:
            self.test_invoice_detail(invoice_id, self.admin_token if self.admin_token else self.client_token)
            self.test_payment_check(invoice_id, self.admin_token if self.admin_token else self.client_token)

        # Test security
        self.test_unauthorized_access()

        # Print results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed. Check details above.")
            return False

def main():
    tester = CryptoPaymentAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'success_rate': f"{(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%",
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())