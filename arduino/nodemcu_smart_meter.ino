/*
 * JOYBREAD Smart Meter - NodeMCU V3
 * Simulates real-time electricity consumption for PeakShift Challenge demo
 * 
 * Hardware:
 * - NodeMCU V3 (ESP8266)
 * - Push Button connected to D7 (GPIO13)
 * - Built-in LED for status indication
 * 
 * Setup Instructions:
 * 1. Install Arduino IDE: https://www.arduino.cc/en/software
 * 2. Add ESP8266 board: File > Preferences > Additional Board URLs:
 *    http://arduino.esp8266.com/stable/package_esp8266com_index.json
 * 3. Install Libraries (Tools > Manage Libraries):
 *    - ArduinoJson by Benoit Blanchon
 * 4. Select Board: Tools > Board > ESP8266 Boards > NodeMCU 1.0
 * 5. Update WiFi credentials below
 * 6. Upload to NodeMCU
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

// ===== CONFIGURATION - UPDATE THESE =====
// WiFi credentials
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// API endpoint - Use your PC's IP address
// Your PC IP: 10.145.109.202 (from Wi-Fi adapter)
#define API_ENDPOINT "http://10.145.109.202:3000/api/meter-data"

// For production/demo day with ngrok:
// #define API_ENDPOINT "https://your-ngrok-url.ngrok.io/api/meter-data"
// ========================================

// Hardware pins
#define BUTTON_PIN 13  // D7 on NodeMCU
#define LED_PIN 2      // Built-in LED (D4)

// Variables
bool challengeActive = false;
unsigned long lastUpdate = 0;
unsigned long lastButtonPress = 0;
float currentConsumption = 350.0;
float baseConsumption = 350.0;
int hour = 12; // Start at noon
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
  digitalWrite(LED_PIN, HIGH); // LED off (inverted on ESP8266)
  
  // Connect to WiFi
  Serial.println("📡 Connecting to WiFi...");
  Serial.print("   SSID: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
    
    // Blink LED while connecting
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n\n✓ WiFi Connected!");
    Serial.print("   IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("   Signal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    
    // Success blink pattern
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_PIN, LOW);
      delay(200);
      digitalWrite(LED_PIN, HIGH);
      delay(200);
    }
  } else {
    Serial.println("\n\n✗ WiFi Connection Failed!");
    Serial.println("   Check credentials and try again");
    digitalWrite(LED_PIN, LOW); // Keep LED on to show error
    while(1) { delay(1000); }
  }
  
  Serial.println("\n════════════════════════════════════");
  Serial.println("   ✓ System Ready");
  Serial.println("   📍 Press button to start demo");
  Serial.println("════════════════════════════════════\n");
}

void loop() {
  // Button handling with debounce
  buttonState = digitalRead(BUTTON_PIN);
  
  if (buttonState == LOW && lastButtonState == HIGH) {
    if (millis() - lastButtonPress > 500) { // 500ms debounce
      lastButtonPress = millis();
      toggleChallenge();
    }
  }
  
  lastButtonState = buttonState;
  
  // Update every 3 seconds
  if (millis() - lastUpdate > 3000) {
    lastUpdate = millis();
    
    if (challengeActive) {
      generateMockData();
      // Quick blink when sending data
      digitalWrite(LED_PIN, LOW);
      delay(50);
      digitalWrite(LED_PIN, HIGH);
    }
    
    sendToAPI();
    printStatus();
    
    // Cycle through 24 hours (speed up time for demo)
    hour = (hour + 1) % 24;
  }
}

void toggleChallenge() {
  challengeActive = !challengeActive;
  
  if (challengeActive) {
    Serial.println("\n╔════════════════════════════════════╗");
    Serial.println("║  🚀 PEAKSHIFT CHALLENGE STARTED!  ║");
    Serial.println("╚════════════════════════════════════╝");
    digitalWrite(LED_PIN, LOW); // LED on during challenge
  } else {
    Serial.println("\n╔════════════════════════════════════╗");
    Serial.println("║  ⏸️  CHALLENGE STOPPED             ║");
    Serial.println("╚════════════════════════════════════╝");
    currentConsumption = baseConsumption;
    digitalWrite(LED_PIN, HIGH); // LED off
  }
  
  Serial.println();
}

void generateMockData() {
  // Simulate realistic peak shift behavior
  // Peak hours: 18:00-21:00 (6 PM - 9 PM) - HIGH RATES
  // Off-peak: 00:00-06:00 (12 AM - 6 AM) - LOW RATES
  // Normal: All other hours
  
  if (hour >= 18 && hour <= 21) {
    // PEAK HOURS - User reduces consumption (shifts load)
    // This shows the benefit of the PeakShift Challenge
    currentConsumption = baseConsumption - random(40, 60);
  } else if (hour >= 0 && hour <= 6) {
    // OFF-PEAK HOURS - Using shifted load
    // Consumption increases as user uses appliances at cheaper rates
    currentConsumption = baseConsumption + random(10, 30);
  } else {
    // NORMAL HOURS - Standard consumption
    currentConsumption = baseConsumption + random(-10, 10);
  }
  
  // Add realistic fluctuation (±0.5 kWh)
  currentConsumption += (random(-5, 5) * 0.1);
  
  // Ensure consumption stays positive
  if (currentConsumption < 0) currentConsumption = 0;
}

void sendToAPI() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("✗ WiFi disconnected! Reconnecting...");
    WiFi.reconnect();
    return;
  }
  
  http.begin(wifiClient, API_ENDPOINT);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000); // 5 second timeout
  
  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["meterId"] = "demo_meter_001";
  doc["consumption"] = round(currentConsumption * 10) / 10.0; // Round to 1 decimal
  doc["hour"] = hour;
  doc["challengeActive"] = challengeActive;
  doc["timestamp"] = millis() / 1000;
  
  // Determine period
  if (hour >= 18 && hour <= 21) {
    doc["period"] = "peak";
  } else if (hour >= 0 && hour <= 6) {
    doc["period"] = "offpeak";
  } else {
    doc["period"] = "normal";
  }
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Send POST request
  int httpCode = http.POST(jsonString);
  
  if (httpCode > 0) {
    if (httpCode == HTTP_CODE_OK || httpCode == 200) {
      // Success - silent unless there's an error
    } else {
      Serial.printf("✗ HTTP Error: %d\n", httpCode);
    }
  } else {
    Serial.printf("✗ Connection failed: %s\n", http.errorToString(httpCode).c_str());
    Serial.println("   Check if Next.js server is running!");
  }
  
  http.end();
}

void printStatus() {
  // Format: Hour: 18:00 | 305.3 kWh | ⚡ PEAK | ✓ Challenge Active
  Serial.print("📊 ");
  
  // Time
  Serial.print("Hour: ");
  if (hour < 10) Serial.print("0");
  Serial.print(hour);
  Serial.print(":00 | ");
  
  // Consumption
  Serial.print(currentConsumption, 1);
  Serial.print(" kWh | ");
  
  // Period indicator
  if (hour >= 18 && hour <= 21) {
    Serial.print("⚡ PEAK    ");
  } else if (hour >= 0 && hour <= 6) {
    Serial.print("🌙 OFFPEAK ");
  } else {
    Serial.print("   NORMAL  ");
  }
  
  // Challenge status
  Serial.print("| ");
  if (challengeActive) {
    Serial.println("✓ Active");
  } else {
    Serial.println("⏸ Standby");
  }
}
