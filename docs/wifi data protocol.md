For **manhole monitoring**, Wi-Fi is usually *not* the best option unless:

* the manholes are very close to buildings with reliable Wi-Fi
* you can provide power easily
* and signal coverage underground is good.

Underground + metal covers + concrete = difficult radio conditions.

The best communication method depends on:

* how many manholes
* how often data must be sent
* whether you need real-time alerts
* and battery life expectations.

---

# Important distinction: HTTP is NOT the radio technology

The person mentioning “HTTP” was talking about the **protocol**, not the wireless method.

Think of it like this:

| Layer              | Example                     |
| ------------------ | --------------------------- |
| Wireless transport | Wi-Fi / LoRa / LTE / NB-IoT |
| Data protocol      | HTTP / MQTT / CoAP          |

HTTP is just how data is formatted and sent to a server.

So your ESP32 could:

* use Wi-Fi + HTTP
* or cellular + HTTP
* or Wi-Fi + MQTT
* etc.

---

# Best options for manhole systems

## Option 1 — LoRa / LoRaWAN (usually best)

For city-wide sensors, this is often the winner.

Using:

* ESP32 + LoRa radio module

Advantages:

* 2–15 km range
* excellent battery life
* works well for tiny sensor messages
* cheap operating cost
* good penetration

Perfect for:

* smoke alerts
* flooding alerts
* open/closed detection
* distance level monitoring

### Battery life

Can be:

* 1–5 years on battery

if the node only transmits occasionally.

### Downsides

You need:

* a LoRa gateway
* or a city LoRaWAN network

---

# Option 2 — NB-IoT / LTE-M (excellent for municipalities)

This uses cellular towers.

Advantages:

* very long range
* no local gateway needed
* designed for IoT
* good underground penetration compared to Wi-Fi

Disadvantages:

* SIM card cost
* data plans
* more power than LoRa

Still, battery life can be:

* months to years

with proper sleep cycles.

Very common in:

* smart water meters
* utility monitoring
* smart city systems

---

# Option 3 — GSM/LTE normal cellular

Simplest to prototype.

ESP32 + SIM7600 / A7670 / SIM800 module.

Advantages:

* easy internet access
* works almost everywhere

Disadvantages:

* highest power usage
* more expensive
* not ideal for multi-year battery systems

---

# Option 4 — Wi-Fi

Usually only suitable if:

* the manholes are on private property
* close to routers
* or you have municipal mesh Wi-Fi

Underground performance can be poor.

Battery life is also much worse than LoRa.

---

# Recommended architecture

For your project, I would strongly consider:

## Sensor Node

* Espressif Systems ESP32-C3
* Distance sensor
* Smoke/gas sensor
* Battery
* LoRa module

## Communication

* LoRaWAN

## Backend

* MQTT broker or HTTP API

## Dashboard

* Web dashboard
* SMS/WhatsApp alerts
* map of manholes

---

# MQTT vs HTTP

For IoT sensors:

## MQTT

Usually better.

Advantages:

* lightweight
* tiny data usage
* reliable
* lower battery usage
* ideal for intermittent devices

## HTTP

Works fine, but:

* heavier
* more overhead
* less battery-efficient

HTTP is easier for beginners because:

* every web server supports it.

MQTT is more “industrial IoT”.

---

# What I would personally choose

## Small prototype

ESP32 + LTE module + HTTP

because:

* easy to build
* no infrastructure needed

## Serious deployment

ESP32 + LoRaWAN + MQTT

because:

* huge battery life
* scalable
* lower operational cost
* ideal for many manholes

---

# One more important issue: underground signal

Manholes are difficult RF environments.

Many real systems use:

* antenna mounted under non-metallic section
* antenna near cover edge
* external waterproof antenna
* gateway on nearby poles/buildings

Metal covers can block signals heavily.

---

# My recommendation for your exact use case

If this is:

* fewer than ~10 manholes
* proof-of-concept

→ Cellular LTE/NB-IoT is easiest.

If this is:

* municipality-scale
* dozens/hundreds of nodes

→ LoRaWAN is likely the best engineering choice.
