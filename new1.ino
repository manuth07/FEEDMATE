#include <WiFi.h>
#include <FirebaseESP32.h>
#include <ESP32Servo.h>

// Firebase configuration
FirebaseData firebaseData;
FirebaseAuth auth;
FirebaseConfig config;
Servo myServo;

// Wi-Fi credentials
const char* ssid = "Vishaka cyburg";
const char* password = "yjxf8750";

// Firebase credentials
#define FIREBASE_HOST "https://website-hosting-a5a67-default-rtdb.firebaseio.com/"
#define FIREBASE_AUTH "eRUSqN4fbDH0WgWbYRJulu8PqRqcRUyPYGvxmoAU"

// Buzzer pin
#define BUZZER_PIN 25

void setup() {
  Serial.begin(115200);

  // Setup servo motor
  myServo.attach(4);   // Pin 4 for servo control
  myServo.write(0);    // Initial position

  // Setup buzzer pin
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW); // Ensure buzzer is initially off

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to Wi-Fi...");
  }
  Serial.println("Connected to Wi-Fi!");

  // Firebase configuration
  config.database_url = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;

  // Initialize Firebase
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  Serial.println("Firebase initialized");
}

void loop() {
  if (Firebase.ready()) {
    // Listen for "feeding" value
    if (Firebase.getJSON(firebaseData, "/feeding")) {
      FirebaseJson& json = firebaseData.jsonObject();
      FirebaseJsonData jsonData;

      bool feedNowValue = false;
      String portionSize = "";

      // Extract "feednow" value
      if (json.get(jsonData, "/feednow") && jsonData.type == "boolean") {
        feedNowValue = jsonData.boolValue;
      }

      // Extract "portionSize" value
      if (json.get(jsonData, "/portionSize") && jsonData.type == "string") {
        portionSize = jsonData.stringValue;
      }

      Serial.print("FeedNow: ");
      Serial.println(feedNowValue);
      Serial.print("Portion Size: ");
      Serial.println(portionSize);

      if (feedNowValue) {
        // Trigger the buzzer
        digitalWrite(BUZZER_PIN, HIGH); // Turn on the buzzer
        delay(4000);                   // Beep for 4 seconds
        digitalWrite(BUZZER_PIN, LOW); // Turn off the buzzer

        // Adjust servo behavior based on portion size
        if (portionSize == "Small") {
          myServo.write(90); // Rotate servo for a short time
          delay(2000);       // Small portion
        } else if (portionSize == "Medium") {
          myServo.write(90);
          delay(4000);       // Medium portion
        } else if (portionSize == "Large") {
          myServo.write(90);
          delay(6000);       // Large portion
        }

        myServo.write(0); // Reset servo position

        // Reset "feednow" to false
        Firebase.setBool(firebaseData, "/feeding/feednow", false);
      }
    } else {
      Serial.print("Error fetching feeding data: ");
      Serial.println(firebaseData.errorReason());
    }
  }

  delay(2000); // Poll Firebase every 2 seconds
}