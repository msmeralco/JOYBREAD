# JOYBREAD - Connection Troubleshooting Guide

## 🔴 Problem: NodeMCU Can't Connect

Your error shows:
```
✗ Connection failed: connection failed
   Check if Next.js server is running!
```

## ✅ Good News

- ✅ Next.js server IS running
- ✅ API endpoint works: `http://10.145.109.202:3000/api/meter-data`
- ✅ Server is listening on all interfaces

## 🔥 Most Likely Issue: Windows Firewall

### Quick Fix (Choose ONE method):

---

### Method 1: Run as Administrator (RECOMMENDED)

1. **Right-click** on `fix-firewall.bat`
2. Select **"Run as administrator"**
3. Click **Yes** when prompted
4. Done! NodeMCU should connect now

---

### Method 2: Disable Windows Firewall (Temporary - for testing only)

1. Press `Windows + R`
2. Type: `firewall.cpl`
3. Click **"Turn Windows Defender Firewall on or off"**
4. Select **"Turn off"** for Private networks
5. Click **OK**
6. ⚠️ **REMEMBER TO TURN IT BACK ON AFTER DEMO!**

---

### Method 3: Manual Firewall Rule

1. Press `Windows + R`
2. Type: `wf.msc` and press Enter
3. Click **"Inbound Rules"** → **"New Rule"**
4. Select **"Port"** → Click **Next**
5. Select **"TCP"** → Type **3000** → Click **Next**
6. Select **"Allow the connection"** → Click **Next**
7. Check all boxes (Domain, Private, Public) → Click **Next**
8. Name it **"Node.js - JOYBREAD"** → Click **Finish**

---

## 🧪 How to Test If It's Fixed

### Test 1: From Your PC
```bash
curl http://10.145.109.202:3000/api/meter-data
```
Should return JSON data ✅ (This already works)

### Test 2: From Another Device (Phone)
1. Connect phone to same WiFi
2. Open browser
3. Visit: `http://10.145.109.202:3000/api-test.html`
4. If you see the test page → Firewall is open! ✅
5. If timeout/error → Firewall is blocking ❌

### Test 3: NodeMCU Serial Monitor
After fixing firewall, you should see:
```
✓ Data sent successfully
```
Instead of:
```
✗ Connection failed: connection failed
```

---

## 🔍 Other Possible Issues

### Issue: Wrong WiFi Network

**Check NodeMCU WiFi:**
Look at Serial Monitor when it connects:
```
✓ WiFi Connected!
   IP Address: 10.145.xxx.xxx  ← Must start with 10.145
```

If it shows different IP (like `192.168.x.x`), it's on a different network!

**Solution:**
- Make sure NodeMCU connects to the SAME WiFi as your PC
- Update WiFi credentials in Arduino code

---

### Issue: Wrong API Endpoint

**In your Arduino code, verify line 28:**
```cpp
#define API_ENDPOINT "http://10.145.109.202:3000/api/meter-data"
```

Must match your PC's IP: `10.145.109.202`

---

### Issue: CORS (Cross-Origin) - Unlikely but possible

If you see CORS errors, add to `/app/api/meter-data/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  // ... rest of code
}
```

---

## 🎯 Final Checklist

Before NodeMCU will work:

- [ ] Next.js server running (`npm run dev`)
- [ ] Windows Firewall allows port 3000
- [ ] NodeMCU on same WiFi network as PC
- [ ] NodeMCU IP starts with `10.145.x.x`
- [ ] API endpoint in Arduino code is correct
- [ ] Arduino code uploaded to NodeMCU

---

## 🚀 Quick Test Command

Run this on your PC to test if firewall is open:

```powershell
Test-NetConnection -ComputerName 10.145.109.202 -Port 3000
```

**Expected Output:**
```
TcpTestSucceeded : True  ← Good! Firewall is open
```

If `False`, firewall is blocking!

---

## 📞 Emergency Backup: Use ngrok

If firewall issues persist on demo day, use ngrok:

1. Download ngrok: https://ngrok.com/download
2. Run: `ngrok http 3000`
3. Copy HTTPS URL (e.g., `https://abc123.ngrok-free.app`)
4. Update Arduino code:
   ```cpp
   #define API_ENDPOINT "https://abc123.ngrok-free.app/api/meter-data"
   ```
5. Upload to NodeMCU
6. Works from ANY network! (no firewall issues)

---

**Start with Method 1 (Run fix-firewall.bat as admin)** - it's the easiest! 🚀
