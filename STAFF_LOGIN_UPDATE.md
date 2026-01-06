# Staff Login Feature - Deployment Guide

## What Changed:

### Backend Changes:
1. Added `password` field to StaffCreate model
2. Staff passwords are now hashed and stored securely
3. New endpoint: `POST /api/auth/staff/login` for staff authentication
4. Staff can now see their own invoices via `GET /api/invoices` (filtered by staff_id)
5. Staff dashboard stats show earnings breakdown by currency

### Frontend Changes:
1. New Staff Dashboard page at `/staff`
2. Login page now has 3 tabs: Client, Staff, Register
3. Staff Management form now includes password field
4. Staff can login and see:
   - Total invoices assigned to them
   - Pending/Paid status
   - Earnings by currency (LTC, USDT, USDC)
   - Invoice details

## How to Update Your VPS:

### Step 1: Pull Latest Code from GitHub

```bash
cd /root/cryptobill
git pull origin main
```

### Step 2: Update Backend

```bash
cd /root/cryptobill/backend

# Activate virtual environment
source venv/bin/activate

# Install any new dependencies (if requirements.txt changed)
pip install -r requirements.txt

# Restart backend service
systemctl restart cryptobill
systemctl status cryptobill
```

### Step 3: Update Frontend

```bash
cd /root/cryptobill/frontend

# Install any new dependencies
npm install

# Rebuild
npm run build

# Restart frontend (kill old serve process and start new one)
pkill -f serve
nohup serve -s build -l 3001 > /dev/null 2>&1 &
```

### Step 4: Create a Test Staff Account

```bash
# Replace YOUR_SERVER_IP with your actual IP
API_URL="http://YOUR_SERVER_IP:8001"

# First login as admin to get token
ADMIN_TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cryptobill.com","password":"admin123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Create a staff member with password
curl -X POST "$API_URL/api/staff" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "John Staff",
    "email": "staff@test.com",
    "password": "staff123",
    "ltc_address": "ltc1qtest123",
    "usdt_address": "0xtest123",
    "usdc_address": "0xtest456"
  }'
```

## Testing the New Feature:

1. Go to `http://YOUR_IP:3001`
2. Click "Staff" tab
3. Login with:
   - Email: `staff@test.com`
   - Password: `staff123`
4. You should see the Staff Dashboard!

## How Staff Members Use the System:

### For Admin:
1. Go to Staff Management
2. Click "Add Staff"
3. Fill in: Name, Email, **Password**, Crypto Addresses
4. Staff member can now login!

### For Staff:
1. Login using "Staff" tab
2. See all invoices assigned to them
3. View earnings breakdown
4. Check payment status
5. View invoice details

## Important Notes:

- **Existing staff members** in your database won't have passwords yet
- You'll need to **edit each existing staff** and set a password for them
- Or delete old staff and create new ones with passwords

## Quick Command to Check Everything:

```bash
# Check backend is running
systemctl status cryptobill

# Check frontend is running
netstat -tlnp | grep 3001

# View backend logs
journalctl -u cryptobill -n 50
```

## Access URLs:

- **Admin Portal:** http://YOUR_IP:3001 → Login as Client/Admin
- **Staff Portal:** http://YOUR_IP:3001 → Click "Staff" tab
- **Client Portal:** http://YOUR_IP:3001 → Login as Client/Admin

All three use the same URL, just different login tabs and credentials!
