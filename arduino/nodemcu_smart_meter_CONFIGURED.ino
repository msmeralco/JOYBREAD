/*
 * JOYBREAD Smart Meter - NodeMCU V3
 * READY TO UPLOAD - WiFi credentials configured!
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

// ===== CONFIGURATION - READY FOR UPLOAD =====
// WiFi credentials - YOUR MOBILE HOTSPOT
#define WIFI_SSID "YOUR_HOTSPOT_NAME"  // ← Put your hotspot name here
#define WIFI_PASSWORD "YOUR_HOTSPOT_PASSWORD"  // ← Put your hotspot password here

// API endpoint - Mobile Hotspot IP
#define API_ENDPOINT "http://192.168.31.10:3000/api/meter-data"
// ============================================

// Hardware pins
#define BUTTON_PIN 13  // D7 on NodeMCU
#define LED_PIN 2      // Built-in LED (D4)

// Variables
bool challengeActive = false;
unsigned long lastUpdate = 0;
unsigned long lastButtonPress = 0;
float currentConsumption = 350.0;
float baseConsumption = 350.0;
int hour = 12;
int buttonState = HIGH;
int lastButtonState = HIGH;

WiFiClient wifiClient;
HTTPClient http;

void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n\n╔════════════════════════════════════╗");
  Serial.println("║   JOYBREAD Smart Meter v1.0       ║");
  Serial.println("║   NodeMCU V3 - PeakShift Demo     ║");
  Serial.println("╚════════════════════════════════════╝\n");
  
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);
  
  // Connect to WiFi
  Serial.println("📡 Connecting to WiFi...");
  Serial.print("   SSID: ");
  Serial.println(WIFI_SSID);
  Serial.println("   Note: Connecting to 2.4GHz access point...");
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n\n✓ WiFi Connected!");
    Serial.print("   IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("   Signal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    
    // Success blink
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_PIN, LOW);
      delay(200);
      digitalWrite(LED_PIN, HIGH);
      delay(200);
    }
  } else {
    Serial.println("\n\n✗ WiFi Connection Failed!");
    Serial.println("   Check password and try again");
    digitalWrite(LED_PIN, LOW);
    while(1) { delay(1000); }
  }
  
  Serial.println("\n════════════════════════════════════");
  Serial.println("   ✓ System Ready");
  Serial.println("   📍 Press button to start demo");
  Serial.println("════════════════════════════════════\n");
}

void loop() {
  buttonState = digitalRead(BUTTON_PIN);
  
  if (buttonState == LOW && lastButtonState == HIGH) {
    if (millis() - lastButtonPress > 500) {
      lastButtonPress = millis();
      toggleChallenge();
    }
  }
  
  lastButtonState = buttonState;
  
  if (millis() - lastUpdate > 3000) {
    lastUpdate = millis();
    
    if (challengeActive) {
      generateMockData();
      digitalWrite(LED_PIN, LOW);
      delay(50);
      digitalWrite(LED_PIN, HIGH);
    }
    
    sendToAPI();
    printStatus();
    
    hour = (hour + 1) % 24;
  }
}

void toggleChallenge() {
  challengeActive = !challengeActive;
  
  if (challengeActive) {
    Serial.println("\n╔════════════════════════════════════╗");
    Serial.println("║  🚀 PEAKSHIFT CHALLENGE STARTED!  ║");
    Serial.println("╚════════════════════════════════════╝\n");
    digitalWrite(LED_PIN, LOW);
  } else {
    Serial.println("\n╔════════════════════════════════════╗");
    Serial.println("║  ⏸️  CHALLENGE STOPPED             ║");
    Serial.println("╚════════════════════════════════════╝\n");
    currentConsumption = baseConsumption;
    digitalWrite(LED_PIN, HIGH);
  }
}

void generateMockData() {
  // Realistic household consumption patterns based on time of day
  float baseLoad = 50.0; // Always-on appliances (fridge, router, etc.)
  float hourlyConsumption = baseLoad;
  
  // Time-based consumption patterns
  if (hour >= 0 && hour <= 5) {
    // Late night/Early morning (12 AM - 5 AM) - Minimal usage
    hourlyConsumption = baseLoad + random(5, 15);  // 55-65 kWh
  } 
  else if (hour >= 6 && hour <= 8) {
    // Morning peak (6 AM - 8 AM) - Breakfast, shower, prep
    hourlyConsumption = baseLoad + random(80, 120); // 130-170 kWh
  }
  else if (hour >= 9 && hour <= 11) {
    // Mid-morning (9 AM - 11 AM) - Moderate usage
    hourlyConsumption = baseLoad + random(30, 50); // 80-100 kWh
  }
  else if (hour >= 12 && hour <= 14) {
    // Lunch time (12 PM - 2 PM) - Cooking, AC
    hourlyConsumption = baseLoad + random(60, 90); // 110-140 kWh
  }
  else if (hour >= 15 && hour <= 17) {
    // Afternoon (3 PM - 5 PM) - Moderate, AC running
    hourlyConsumption = baseLoad + random(70, 100); // 120-150 kWh
  }
  else if (hour >= 18 && hour <= 21) {
    // PEAK HOURS (6 PM - 9 PM) - Dinner, lights, TV, AC
    if (challengeActive) {
      // User is shifting load - reduced consumption
      hourlyConsumption = baseLoad + random(20, 40); // 70-90 kWh (REDUCED!)
    } else {
      // Normal peak usage
      hourlyConsumption = baseLoad + random(120, 180); // 170-230 kWh
    }
  }
  else if (hour >= 22 && hour <= 23) {
    // Evening wind-down (10 PM - 11 PM)
    hourlyConsumption = baseLoad + random(40, 70); // 90-120 kWh
  }
  
  // If challenge is active and NOT peak hours, show shifted load
  if (challengeActive && (hour >= 0 && hour <= 5)) {
    // OFF-PEAK load shifting - running washing machine, dishwasher, etc.
    hourlyConsumption += random(80, 120); // Extra 80-120 kWh from shifted appliances
  }
  
  // Add realistic fluctuation (±5%)
  float fluctuation = hourlyConsumption * (random(-5, 5) / 100.0);
  currentConsumption = hourlyConsumption + fluctuation;
  
  // Ensure consumption stays positive
  if (currentConsumption < 0) currentConsumption = baseLoad;
  
  // Smooth the transition to avoid jarring jumps
  static float lastConsumption = 350.0;
  currentConsumption = (lastConsumption * 0.7) + (currentConsumption * 0.3);
  lastConsumption = currentConsumption;
}

void sendToAPI() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("✗ WiFi disconnected! Reconnecting...");
    WiFi.reconnect();
    return;
  }
  
  http.begin(wifiClient, API_ENDPOINT);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);
  
  StaticJsonDocument<256> doc;
  doc["meterId"] = "demo_meter_001";
  doc["consumption"] = round(currentConsumption * 10) / 10.0;
  doc["hour"] = hour;
  doc["challengeActive"] = challengeActive;
  doc["timestamp"] = millis() / 1000;
  
  if (hour >= 18 && hour <= 21) {
    doc["period"] = "peak";
  } else if (hour >= 0 && hour <= 6) {
    doc["period"] = "offpeak";
  } else {
    doc["period"] = "normal";
  }
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpCode = http.POST(jsonString);
  
  if (httpCode > 0) {
    if (httpCode == HTTP_CODE_OK || httpCode == 200) {
      // Success
    } else {
      Serial.printf("✗ HTTP Error: %d\n", httpCode);
    }
  } else {
    Serial.printf("✗ Connection failed: %s\n", http.errorToString(httpCode).c_str());
    Serial.println("   Check PC IP and server status!");
  }
  
  http.end();
}

void printStatus() {
  Serial.print("📊 Hour: ");
  if (hour < 10) Serial.print("0");
  Serial.print(hour);
  Serial.print(":00 | ");
  Serial.print(currentConsumption, 1);
  Serial.print(" kWh | ");
  
  if (hour >= 18 && hour <= 21) {
    Serial.print("⚡ PEAK    ");
  } else if (hour >= 0 && hour <= 6) {
    Serial.print("🌙 OFFPEAK ");
  } else {
    Serial.print("   NORMAL  ");
  }
  
  Serial.print("| ");
  if (challengeActive) {
    Serial.println("✓ Active");
  } else {
    Serial.println("⏸ Standby");
  }
}
