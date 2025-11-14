# NodeMCU Smart Meter Setup Guide

## 🔌 Hardware Wiring

```
NodeMCU V3          Push Button
-----------         -----------
D7 (GPIO13) ────────► Button Pin 1
GND         ────────► Button Pin 2

Built-in LED (D4/GPIO2) - No wiring needed
```

### Button Connection Options

**Option 1: With Pulldown Resistor**
- Connect button between D7 and GND
- Add 10kΩ resistor from D7 to GND

**Option 2: Using Internal Pullup (Easier - Used in code)**
- Connect one side of button to D7
- Connect other side to GND
- Code uses `INPUT_PULLUP` mode

## 📦 Software Setup

### 1. Install Arduino IDE
- Download from: https://www.arduino.cc/en/software
- Install and open

### 2. Add ESP8266 Board Support
1. Open **File → Preferences**
2. In "Additional Board Manager URLs", add:
   ```
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
3. Click **OK**
4. Go to **Tools → Board → Boards Manager**
5. Search for "esp8266"
6. Install **esp8266 by ESP8266 Community**

### 3. Install Required Libraries
1. Go to **Tools → Manage Libraries**
2. Search and install:
   - **ArduinoJson** by Benoit Blanchon (version 6.x or higher)

### 4. Configure Board Settings
- **Tools → Board**: "NodeMCU 1.0 (ESP-12E Module)"
- **Tools → Upload Speed**: 115200
- **Tools → CPU Frequency**: 80 MHz
- **Tools → Flash Size**: 4MB (FS:2MB OTA:~1019KB)
- **Tools → Port**: Select your NodeMCU COM port

## ⚙️ Configuration

### Edit the Arduino Code

Open `nodemcu_smart_meter.ino` and update:

```cpp
// WiFi credentials
#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// API endpoint - Your PC's IP address
#define API_ENDPOINT "http://10.145.109.202:3000/api/meter-data"
```

**Your current PC IP: `10.145.109.202`**

> ⚠️ **Important**: Your PC and NodeMCU must be on the SAME WiFi network!

## 🚀 Upload & Test

### 1. Start Your Next.js Server
```bash
cd C:\Users\Mark Christian Anub\Desktop\ril\kilos-hackathon\JOYBREAD
npm run dev
```

Server should be running at: `http://localhost:3000`

### 2. Upload Code to NodeMCU
1. Connect NodeMCU to PC via USB
2. Select correct COM port in Arduino IDE
3. Click **Upload** button (→)
4. Wait for "Done uploading"

### 3. Open Serial Monitor
1. Click **Tools → Serial Monitor**
2. Set baud rate to **115200**
3. You should see:

```
╔════════════════════════════════════╗
║   JOYBREAD Smart Meter v1.0       ║
║   NodeMCU V3 - PeakShift Demo     ║
╚════════════════════════════════════╝

📡 Connecting to WiFi...
   SSID: Your_WiFi_Name
......

✓ WiFi Connected!
   IP Address: 10.145.xxx.xxx
   Signal: -45 dBm

════════════════════════════════════
   ✓ System Ready
   📍 Press button to start demo
════════════════════════════════════
```

### 4. Test the Button
1. **Press the button** on D7
2. You should see:
```
╔════════════════════════════════════╗
║  🚀 PEAKSHIFT CHALLENGE STARTED!  ║
╚════════════════════════════════════╝

📊 Hour: 12:00 | 355.2 kWh |    NORMAL  | ✓ Active
📊 Hour: 13:00 | 348.7 kWh |    NORMAL  | ✓ Active
```

3. **Open your dashboard**: `http://localhost:3000/dashboard`
4. You should see **LIVE** indicator and real-time updates!

## 🎬 Demo Day Checklist

### Before Demo
- [ ] Test WiFi connection at venue
- [ ] Bring mobile hotspot as backup
- [ ] Charge power bank for NodeMCU
- [ ] Test button multiple times
- [ ] Verify dashboard updates in real-time
- [ ] Print this wiring diagram

### For Stable Connection (Recommended)
Use **ngrok** to avoid IP issues:

1. Install ngrok: https://ngrok.com/download
2. Run in terminal:
   ```bash
   ngrok http 3000
   ```
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Update Arduino code:
   ```cpp
   #define API_ENDPOINT "https://abc123.ngrok.io/api/meter-data"
   ```
5. Re-upload to NodeMCU

### During Demo Script
1. **Introduction**: "This is our JOYBREAD smart meter running on NodeMCU"
2. **Show Serial Monitor**: Live data streaming
3. **Press Button**: "User joins PeakShift Challenge!"
4. **Show Dashboard**: Real-time consumption updates
5. **Explain**:
   - During peak hours (6-9 PM), consumption drops
   - Off-peak hours (12-6 AM) show shifted loads
   - User saves money by avoiding peak rates

## 🔧 Troubleshooting

### WiFi Won't Connect
- Check SSID and password (case-sensitive!)
- Ensure 2.4GHz WiFi (NodeMCU doesn't support 5GHz)
- Try connecting to phone hotspot

### Button Not Responding
- Check wiring: D7 to one side, GND to other
- Press firmly for 1 second
- LED should blink when pressed

### Dashboard Not Updating
- Check if Next.js server is running (`npm run dev`)
- Verify API endpoint IP address matches your PC
- Check Serial Monitor for error messages
- Try accessing: `http://localhost:3000/api/meter-data`

### Data Sending Errors
```
✗ Connection failed: connection refused
```
**Solutions**:
1. Ensure Next.js server is running
2. Check Windows Firewall (allow Node.js)
3. Verify IP address is correct
4. Try using ngrok instead

### LED Always On/Off
- LED is inverted on ESP8266 (LOW = ON, HIGH = OFF)
- This is normal behavior

## 📊 Understanding the Data

### Time Periods
- **🌙 OFF-PEAK** (12 AM - 6 AM): Cheapest rates, higher consumption
- **NORMAL** (6 AM - 6 PM): Standard rates, normal consumption  
- **⚡ PEAK** (6 PM - 9 PM): Expensive rates, REDUCED consumption (challenge active)

### Challenge Behavior
When challenge is **ACTIVE**:
- Peak hours: Consumption drops by 40-60 kWh (user shifts load)
- Off-peak: Consumption rises (using shifted appliances)
- Demonstrates smart energy management!

## 🎯 API Endpoints

### POST `/api/meter-data`
Send meter data from NodeMCU:
```json
{
  "meterId": "demo_meter_001",
  "consumption": 350.5,
  "hour": 19,
  "challengeActive": true,
  "period": "peak",
  "timestamp": 12345
}
```

### GET `/api/meter-data`
Retrieve latest meter data for dashboard:
```json
{
  "success": true,
  "data": {
    "consumption": 350.5,
    "hour": 19,
    "challengeActive": true,
    "period": "peak",
    "lastUpdated": "2025-11-14T10:30:00Z"
  }
}
```

## 📱 Dashboard Features

The dashboard now shows:
- 🟢 **LIVE** indicator when receiving real-time data
- 🚀 **Challenge Active** badge when NodeMCU button is pressed
- ⚡/**🌙** Period indicators (Peak/Off-peak/Normal)
- ⏰ Current simulated hour
- 📊 Real-time consumption updates with animation

## 💡 Tips for Best Demo

1. **Start with button NOT pressed** - Shows baseline
2. **Press button during demo** - Watch metrics change live
3. **Explain the time cycle** - Shows 24 hours in ~2 minutes
4. **Point out peak hour behavior** - Consumption drops = savings!
5. **Show LIVE indicator** - Proves real hardware connection

---

**Need help?** Check Serial Monitor output for detailed debugging info!

Good luck with your demo! 🚀⚡
