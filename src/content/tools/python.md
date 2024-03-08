---
title: Python
columns: two
layout: commonTwo.hbs
description: Python
includeDefinitions: [api-helper, api-helper-events, api-helper-extras, api-helper-usb, python]
---

# {{title}}

*Run Python scripts on Particle Gen 4 (unofficial, experimental)*

This project works on Particle Gen 4 devices including the P2, Photon 2, and M-SoM. It does not work on earlier devices. It is experimental and incomplete at this time, more of a proof-of-concept.

{{> sso}}

---

## Flash firmware

In order to use Python on your Particle device, you must flash firmware to the device to enable that functionality.

## Connect

This project is intended for development, testing, and experimentation. For this reason, the device must be connected 
to USB to this computer to use this tool in order to upload Python scripts, view debug logs, and view Python output
at this time.

{{> python-connect}}

## Python standard output viewer

This section shows the Python standard output from the `print` command in a Python script.

{{> python-output cols="90" rows="10"}}


## Debug log viewer

This section shows the device debug logs, the USB serial logs that can also be displayed using `particle serial monitor`.

{{> python-debug-logs cols="90" rows="10"}}


## Event viewer

You can view events in your developer sandbox here, or in the Particle console. This is handy for testing when you publish events from your Python script.

{{> event-viewer height="300" style="table"}}




