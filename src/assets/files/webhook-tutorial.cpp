#include "Particle.h"

SerialLogHandler logHandler;

SYSTEM_THREAD(ENABLED);

const char *eventName = "WebhookTutorial01";

std::chrono::milliseconds testPublishPeriod = 1min;
unsigned long lastPublish = 0;

bool buttonClicked = false;

void testPeriodic();
void testButton();
void clickHandler(system_event_t event, int param);

void setup() {
    // Register a click handler for the MODE button
    System.on(button_click, clickHandler);
}

void loop() {
    if (buttonClicked) {
        buttonClicked = false;
        testButton();
    }

    if (millis() - lastPublish >= testPublishPeriod.count()) {
        lastPublish = millis();

        testPeriodic();
    }
}

void testPeriodic() {
    char buf[256];

    JSONBufferWriter writer(buf, sizeof(buf));
    writer.beginObject();
        writer.name("op").value("periodic");
#if HAL_PLATFORM_POWER_MANAGEMENT
        writer.name("powerSource").value(System.powerSource());
        writer.name("soc").value(System.batteryCharge());
#endif
    writer.endObject();
    writer.buffer()[std::min(writer.bufferSize(), writer.dataSize())] = 0;

    if (Particle.connected()) {
        Particle.publish(eventName, buf);
        Log.info("publish %s %s", eventName, buf);
    }
    else {
        Log.info("periodic but not cloud connected %s", buf);
    }
}

void testButton() {
    char buf[256];

    JSONBufferWriter writer(buf, sizeof(buf));
    writer.beginObject();
        writer.name("op").value("button");
    writer.endObject();
    writer.buffer()[std::min(writer.bufferSize(), writer.dataSize())] = 0;

    if (Particle.connected()) {
        Particle.publish(eventName, buf);
        Log.info("publish %s %s", eventName, buf);
    }
    else {
        Log.info("button pressed but not cloud connected %s", buf);
    }

}

// MODE button click handler
void clickHandler(system_event_t event, int param) {
    // int times = system_button_clicks(param);

    // This can be called from an interrupt context so you can only use the small
    // number of interrupt-safe functions here
    buttonClicked = true;
}