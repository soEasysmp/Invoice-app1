# Complete Update Guide - New Features Added

## 🎉 What's New:

### 1. **CRYPTO Payment Option**
- When creating invoices, you can now select "Crypto (All Addresses)"
- Client will see ALL crypto addresses (LTC, USDT, USDC) and can pay with any
- Or select specific crypto (LTC Only, USDT Only, USDC Only)

### 2. **Automatic Weekly Invoice Generation**
- Enable "Auto-generate this invoice" checkbox when creating invoice
- Choose frequency: Weekly or Monthly
- System automatically generates new invoice for that staff/client

### 3. **Frontend Runs 24/7**
- Created systemd service so frontend stays running forever
- Won't stop when you close terminal

---

## 📋 Update Instructions for Your VPS:

### Step 1: Pull Latest Code
```bash
cd /root/cryptobill
git pull origin main
```

### Step 2: Update Backend
```bash
cd /root/cryptobill/backend
source venv/bin/activate
pip install -r requirements.txt
systemctl restart cryptobill
```

### Step 3: Update Frontend
```bash
cd /root/cryptobill/frontend
npm install
npm run build
```

### Step 4: Setup Frontend Service (Run 24/7)
```bash
# Stop old serve process
pkill -f serve

# Create systemd service
cat > /etc/systemd/system/cryptobill-frontend.service << 'EOF'
[Unit]
Description=CryptoBill Frontend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/cryptobill/frontend
ExecStart=/usr/bin/serve -s build -l 3001
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable cryptobill-frontend
systemctl start cryptobill-frontend

# Check status
systemctl status cryptobill-frontend
```

You should see **"active (running)"** for both services!

---

## 🧪 Testing New Features:

### Test 1: CRYPTO Option
1. Login as admin
2. Go to Invoice Management → Create Invoice
3. Select "Crypto (All Addresses)" from currency dropdown
4. Create invoice
5. Login as client
6. View invoice → You'll see ALL crypto addresses (LTC, USDT, USDC)

### Test 2: Auto-Generate Invoices
1. Login as admin
2. Create Invoice → Check "Auto-generate this invoice"
3. Select "Weekly" frequency
4. Invoice will be auto-created every 7 days

### Test 3: 24/7 Running
1. Close your terminal
2. Open browser → App still works!
3. Check: `systemctl status cryptobill-frontend` → Should be running

---

## 🔧 Useful Commands:

### Check Services Status:
```bash
systemctl status cryptobill                # Backend
systemctl status cryptobill-frontend       # Frontend
```

### Restart Services:
```bash
systemctl restart cryptobill               # Backend
systemctl restart cryptobill-frontend      # Frontend
```

### View Logs:
```bash
journalctl -u cryptobill -f                # Backend logs
journalctl -u cryptobill-frontend -f       # Frontend logs
```

### Stop Services (if needed):
```bash
systemctl stop cryptobill
systemctl stop cryptobill-frontend
```

---

## 📝 How It Works:

### CRYPTO Payment:
- Admin creates invoice with "Crypto (All Addresses)"
- System fetches ALL crypto addresses from staff member
- Client sees:
  ```
  LTC Address: ltc1q...
  USDT Address: 0x...
  USDC Address: 0x...
  ```
- Client can pay with ANY of these

### Auto-Generate Invoices:
- Backend checks every 24 hours
- If 7 days passed (for weekly) → Creates new invoice automatically
- Same amount, same staff, same client
- Stored in `auto_invoices` collection in MongoDB

---

## ✅ Verification Checklist:

- [ ] Backend running: `systemctl status cryptobill`
- [ ] Frontend running: `systemctl status cryptobill-frontend`
- [ ] Can access app at: `http://YOUR_IP:3001`
- [ ] "Crypto (All Addresses)" appears in currency dropdown
- [ ] "Auto-generate" checkbox appears in invoice form
- [ ] Frontend stays running after closing terminal

---

## 🚨 Troubleshooting:

**Frontend not running?**
```bash
systemctl restart cryptobill-frontend
systemctl status cryptobill-frontend
journalctl -u cryptobill-frontend -n 50
```

**Backend issues?**
```bash
systemctl restart cryptobill
journalctl -u cryptobill -n 50
```

**Can't see new features?**
```bash
# Clear browser cache or try incognito mode
# Or rebuild frontend:
cd /root/cryptobill/frontend
npm run build
systemctl restart cryptobill-frontend
```

---

## 🎯 Summary:

**What Changed:**
- ✅ CRYPTO option shows all addresses
- ✅ Auto-generate invoices weekly/monthly
- ✅ Frontend runs 24/7 as systemd service
- ✅ Backend checks auto-invoices daily
- ✅ Payment monitoring every 2 minutes (unchanged)

**Your app is now more powerful and reliable!** 🚀
