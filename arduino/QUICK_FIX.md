# 🚀 QUICK FIX - Use Mobile Hotspot

## The Problem
- Your PC is on **5 GHz WiFi** (`IDOL HACKATHON 2025`)
- NodeMCU only supports **2.4 GHz**
- They can't talk to each other!

## ✅ EASIEST Solution: Mobile Hotspot

### Step 1: Create Hotspot on Your PC

1. Press `Windows + I` to open Settings
2. Go to **Network & Internet** → **Mobile hotspot**
3. Click **Edit** to set:
   - **Network name**: `JOYBREAD_DEMO`
   - **Network password**: `hackathon2025`
   - **Network band**: **2.4 GHz** (IMPORTANT!)
4. Turn hotspot **ON**

### Step 2: Update Arduino Code

Edit `nodemcu_smart_meter.ino` lines 28-29:

```cpp
#define WIFI_SSID "JOYBREAD_DEMO"
#define WIFI_PASSWORD "hackathon2025"
```

Update API endpoint (line 33):

```cpp
// Your PC will be at 192.168.137.1 when using mobile hotspot
#define API_ENDPOINT "http://192.168.137.1:3000/api/meter-data"
```

### Step 3: Upload to NodeMCU

1. Upload the updated code
2. Open Serial Monitor
3. You should see:
   ```
   ✓ WiFi Connected!
   IP Address: 192.168.137.xxx
   ```

### Step 4: Test!

Press the button on NodeMCU and watch Serial Monitor:
```
✓ Data sent successfully  ← SUCCESS!
```

---

## Alternative: Connect PC to 2.4GHz Network

If there's a 2.4GHz version of `IDOL HACKATHON 2025`:

1. **Disconnect from current WiFi**
2. **Look for 2.4GHz version** (might be same name or with `_2.4G` suffix)
3. **Connect both PC and NodeMCU** to the 2.4GHz network
4. **Update Arduino code** with network name and password

---

## Demo Day Strategy

### Before Demo:
1. Create mobile hotspot on your PC
2. Connect NodeMCU to hotspot
3. Test everything works

### Why This is Better:
- ✅ You control the network (no venue WiFi issues)
- ✅ Works anywhere
- ✅ No dependency on venue WiFi
- ✅ More reliable for demo

### Backup Plan:
Keep venue WiFi credentials ready in case you need internet for other features!

---

## Quick Reference

### For Mobile Hotspot:
```cpp
#define WIFI_SSID "JOYBREAD_DEMO"
#define WIFI_PASSWORD "hackathon2025"
#define API_ENDPOINT "http://192.168.137.1:3000/api/meter-data"
```

### For Venue 2.4GHz WiFi:
```cpp
#define WIFI_SSID "IDOL HACKATHON 2025"  // or the 2.4GHz version
#define WIFI_PASSWORD "ask_venue_for_password"
#define API_ENDPOINT "http://10.145.109.202:3000/api/meter-data"
```

---

**Use mobile hotspot for most reliable demo!** 🚀
