#include "Particle.h"

SerialLogHandler logHandler;

SYSTEM_THREAD(ENABLED);

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

    if (Particle.connected() && millis() - lastPublish >= testPublishPeriod.count()) {
        lastPublish = millis();

        testPeriodic();
    }
}

void testPeriodic() {

}

void testButton() {
    char buf[256];

    JSONBufferWriter writer(buf, sizeof(buf));
    writer.beginObject();
        writer.name("op").value("button");
    writer.endObject();

    if (Particle.connected()) {
        Particle.publish
    }

}

// MODE button click handler
void clickHandler(system_event_t event, int param) {
    // int times = system_button_clicks(param);

    // This can be called from an interrupt context so you can only use the small
    // number of interrupt-safe functions here
    buttonClicked = true;
}