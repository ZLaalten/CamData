#include <Arduino.h>
#ifdef ESP32
#include <WiFi.h>
#else
#include <ESP8266WiFi.h>
#endif
#include "AudioFileSourceICYStream.h"
#include "AudioFileSourceBuffer.h"
#include "AudioGeneratorMP3.h"
#include "AudioOutputI2SNoDAC.h"
#include <PubSubClient.h>

// To run, set your ESP8266 build to 160MHz, update the SSID info, and upload.
// Enter your WiFi setup here:
const char *SSID = "Kush";
const char *PASSWORD = "8505988865";
const char *mqtt_server = "13.233.63.39";
WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;
#define MSG_BUFFER_SIZE (50)
char msg[MSG_BUFFER_SIZE];
int value = 0;
int messageCounter = 0;
int lastMessageUpdated = 0;
boolean playingMusic = false;
// Uncomment one link (I have added 6 radio streaming link, you can check each)
//flawlessly working radio streaming link
const char *URL = "http://192.168.1.5:3000/images?image_name=speach.mp3";
// const char *URL = "http://ndr-edge-206c.fra-lg.cdn.addradio.net/ndr/njoy/live/mp3/128/stream.mp3"; //'N-JOY vom NDR - www.n-joy.de'
//const char *URL="http://ndr-edge-10ad-fra-dtag-cdn.cast.addradio.de/ndr/ndr1niedersachsen/hannover/mp3/128/stream.mp3";
//const char *URL="http://jazz.streamr.ru/jazz-64.mp3";
// It will work but buffer alot
//const char *URL="http://stream.ca.morow.com:8003/morow_med.mp3";
//const char *URL= "http://ndr-ndr1radiomv-schwerin.sslcast.addradio.de/ndr/ndr1radiomv/schwerin/mp3/128/stream.mp3";
//const char *URL="http://mms.hoerradar.de:8000/rst128k";//Radio RST(German)
AudioGeneratorMP3 *mp3;
AudioFileSourceICYStream *file;
AudioFileSourceBuffer *buff;
AudioOutputI2SNoDAC *out;
// Called when a metadata event occurs (i.e. an ID3 tag, an ICY block, etc.

void callback(char *topic, byte *payload, unsigned int length)
{
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  messageCounter = messageCounter+1;
  for (int i = 0; i < length; i++)
  {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}

void reconnect()
{
  // Loop until we're reconnected
  while (!client.connected())
  {
    Serial.print("Attempting MQTT connection...");
    // Create a random client ID
    String clientId = "ESP8266Client-";
    clientId += String(random(0xffff), HEX);
    // Attempt to connect
    if (client.connect(clientId.c_str()))
    {
      Serial.println("connected");
      // Once connected, publish an announcement...
      client.publish("outTopic", "hello world");
      // ... and resubscribe
      client.subscribe("speaker_01");
    }
    else
    {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

void MDCallback(void *cbData, const char *type, bool isUnicode, const char *string)
{
  const char *ptr = reinterpret_cast<const char *>(cbData);
  (void)isUnicode; // Punt this ball for now
  // Note that the type and string may be in PROGMEM, so copy them to RAM for printf
  char s1[32], s2[64];
  strncpy_P(s1, type, sizeof(s1));
  s1[sizeof(s1) - 1] = 0;
  strncpy_P(s2, string, sizeof(s2));
  s2[sizeof(s2) - 1] = 0;
  Serial.printf("METADATA(%s) '%s' = '%s'\n", ptr, s1, s2);
  Serial.flush();
}
// Called when there's a warning or error (like a buffer underflow or decode hiccup)
void StatusCallback(void *cbData, int code, const char *string)
{
  const char *ptr = reinterpret_cast<const char *>(cbData);
  // Note that the string may be in PROGMEM, so copy it to RAM for printf
  char s1[64];
  strncpy_P(s1, string, sizeof(s1));
  s1[sizeof(s1) - 1] = 0;
  Serial.printf("STATUS(%s) '%d' = '%s'\n", ptr, code, s1);
  Serial.flush();
}
void setup()
{
  Serial.begin(115200);
  delay(1000);
  Serial.println("Connecting to WiFi");
  WiFi.disconnect();
  WiFi.softAPdisconnect(true);
  WiFi.mode(WIFI_STA);
  WiFi.begin(SSID, PASSWORD);
  // Try forever
  while (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("...Connecting to WiFi");
    delay(1000);
  }
  Serial.println("Connected");
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void playMusic(){
  playingMusic = true;
  audioLogger = &Serial;
  file = new AudioFileSourceICYStream(URL);
  file->RegisterMetadataCB(MDCallback, (void *)"ICY");
  buff = new AudioFileSourceBuffer(file, 4096);
  buff->RegisterStatusCB(StatusCallback, (void *)"buffer");
  out = new AudioOutputI2SNoDAC();
  mp3 = new AudioGeneratorMP3();
  mp3->RegisterStatusCB(StatusCallback, (void *)"mp3");
  mp3->begin(buff, out);
}
void loop()
{
  if(lastMessageUpdated != messageCounter){
    playMusic(); 
    lastMessageUpdated = messageCounter;
  }

  if(playingMusic == true){
    static int lastms = 0;
    if (mp3->isRunning())
    {
      if (millis() - lastms > 1000)
      {
        lastms = millis();
        Serial.printf("Running for %d ms...\n", lastms);
        Serial.flush();
      }
      if (!mp3->loop())
        mp3->stop();
    }
    else
    {
      playingMusic == false;
      Serial.printf("MP3 done\n");
      delay(1000);
    } 
  }

  if (!client.connected())
  {
    reconnect();
  }
  client.loop();
}