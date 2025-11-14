# Quick Reference Card - Print This!

## 📍 Your Network Info
- **PC IP Address**: `10.145.109.202`
- **WiFi Network**: (Write your WiFi name here: _________________)
- **API Endpoint**: `http://10.145.109.202:3000/api/meter-data`

## 🔌 Wiring Diagram

```
     NodeMCU V3                    Push Button
    ┌─────────┐                    
    │         │                    ┌───┐
    │   3V3   │                    │   │
    │   GND   │──────────┬─────────┤   ├─── To GND
    │   D0    │          │         │   │
    │   D1    │          │         └───┘
    │   D2    │          │         
    │   D3    │          │         
    │   D4    │  ← Built-in LED
    │   D5    │          
    │   D6    │          
    │   D7    │──────────┴─── To Button
    │   D8    │              
    │   RX    │              
    │   TX    │              
    └─────────┘              

    LED Behavior:
    ● Blinking = Connecting to WiFi
    ● 3 Quick Blinks = WiFi Connected
    ● Solid ON = Challenge Active
    ● OFF = Standby Mode
```

## 🎬 Demo Script (60 seconds)

### 1. Setup (10 sec)
"This is our JOYBREAD smart meter powered by NodeMCU, connected to our web dashboard via WiFi."

### 2. Show Baseline (10 sec)
"Currently showing baseline consumption of 350 kWh - this is a typical household."
*(Point to Serial Monitor and Dashboard)*

### 3. Activate Challenge (15 sec)
"When a user joins our PeakShift Challenge..."
*(Press button - LED turns ON)*
"The system monitors their real-time consumption across different time periods."

### 4. Explain Behavior (20 sec)
"Notice the time cycling through the day:
- **Normal hours**: Standard consumption ~350 kWh
- **Peak hours (6-9 PM)**: Consumption DROPS to ~300 kWh as users shift their load
- **Off-peak (midnight-6 AM)**: Consumption rises ~380 kWh as users run shifted appliances"

### 5. Benefits (5 sec)
"By avoiding peak rates, users save up to 20% on electricity bills while earning rewards!"

## 🔍 What Judges Should See

### Serial Monitor Output
```
╔════════════════════════════════════╗
║  🚀 PEAKSHIFT CHALLENGE STARTED!  ║
╚════════════════════════════════════╝

📊 Hour: 18:00 | 295.3 kWh | ⚡ PEAK    | ✓ Active
📊 Hour: 19:00 | 302.1 kWh | ⚡ PEAK    | ✓ Active
📊 Hour: 20:00 | 298.7 kWh | ⚡ PEAK    | ✓ Active
📊 Hour: 00:00 | 375.2 kWh | 🌙 OFFPEAK | ✓ Active
```

### Dashboard Display
```
┌─────────────────────────────────────┐
│ Consumption Status    🟢 LIVE       │
│                       🚀 Challenge   │
├─────────────────────────────────────┤
│                                     │
│   305.3 kWh                        │
│                                     │
│   ⚡ Peak Hours  │  19:00          │
│                                     │
│   [Bar Chart showing consumption]   │
│                                     │
└─────────────────────────────────────┘
```

## ⚡ Key Talking Points

1. **Real Hardware Integration**
   - "Not just a concept - we have working hardware"
   - "Uses ESP8266 WiFi module for IoT connectivity"

2. **Real-Time Data**
   - "Dashboard updates every 2-3 seconds"
   - "See the LIVE indicator? That's real data streaming"

3. **Smart Load Shifting**
   - "Algorithm detects peak hours and encourages shifting"
   - "Users save money without sacrificing comfort"

4. **Gamification**
   - "Users earn Kilos Points for participating"
   - "Creates habit formation through rewards"

5. **Scalability**
   - "Single API endpoint can handle multiple meters"
   - "Ready to deploy to actual smart meters"

## 🚨 Emergency Backup Plans

### If WiFi Fails
1. Use **mobile hotspot**
2. Update code with hotspot credentials
3. Re-upload (takes 30 seconds)

### If Button Fails
1. Can trigger via Serial Monitor
2. Send 'T' character to toggle
3. Or restart NodeMCU (auto-sends data)

### If Dashboard Not Updating
1. Show Serial Monitor as proof
2. Explain: "Backend is receiving data"
3. Demonstrate API endpoint directly:
   - Open: `http://10.145.109.202:3000/api/meter-data`
   - Shows JSON response

## 📋 Troubleshooting Checklist

Before demo:
- [ ] WiFi connected ✓
- [ ] Serial Monitor shows "System Ready" ✓
- [ ] Dashboard loaded ✓
- [ ] Button press toggles challenge ✓
- [ ] LIVE indicator appears ✓
- [ ] Consumption changes visible ✓

During demo:
- [ ] PC plugged into power
- [ ] NodeMCU powered (via USB or power bank)
- [ ] Both devices on same WiFi
- [ ] Next.js server running (`npm run dev`)

## 💾 Code Quick Update

If you need to change IP address quickly:

### Arduino Code (Line 28):
```cpp
#define API_ENDPOINT "http://YOUR_NEW_IP:3000/api/meter-data"
```

### WiFi Credentials (Lines 24-25):
```cpp
#define WIFI_SSID "NEW_WIFI_NAME"
#define WIFI_PASSWORD "NEW_PASSWORD"
```

After changes: **Sketch → Upload** (Ctrl+U)

## 🎯 Success Criteria

Your demo is successful when:
1. ✅ NodeMCU connects to WiFi (Serial Monitor confirms)
2. ✅ Button press shows in Serial Monitor
3. ✅ Dashboard shows 🟢 LIVE indicator
4. ✅ Consumption number changes every 3 seconds
5. ✅ Challenge badge appears when button pressed
6. ✅ Peak/Off-peak periods are visible

---

## 📞 Quick Commands

### Start Server
```bash
cd C:\Users\Mark Christian Anub\Desktop\ril\kilos-hackathon\JOYBREAD
npm run dev
```

### Check API
```
http://10.145.109.202:3000/api/meter-data
```

### Arduino Upload
```
Tools → Port → (Select COM port)
Sketch → Upload (Ctrl+U)
```

### Serial Monitor
```
Tools → Serial Monitor (Ctrl+Shift+M)
Set: 115200 baud
```

---

**Print this page and keep it handy during demo!** 🚀

Good luck! You've got this! 💪⚡
