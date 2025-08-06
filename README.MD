# xoxa-msg

<img src="./assets/banner.png" width="300" alt="banner"/>

A TypeScript-first, multi-platform messaging SDK for **SMS**, **WhatsApp**, and **Telegram**, built with developer speed in mind.

## 📲 What is xoxa-msg?

**xoxa-msg** is a class-based, strongly typed messaging library that gives you a single API to send messages across multiple providers. No need to juggle three different APIs — this package serves as a wrapper that unifies them.

✅ SMS via **Twilio**  
✅ WhatsApp via **Meta's WhatsApp Cloud API**  
✅ Telegram via **Bot API**

Supports:

- Media attachments
- Typed delivery receipts
- Retry with exponential backoff
- Full OOP and TypeScript typing
- Pluggable transports
- Form encoding support for Twilio

---

## 📦 Installation

```bash
npm install xoxa-msg
```

---

## 📂 Folder Structure

```bash
src/
├── core/            # Core logic (XoxaClient, Events, Errors)
├── types/           # Reusable types (message, config)
├── interfaces/      # Logger + Transport interfaces
├── transports/      # Twilio, WhatsApp, Telegram classes
├── utilities/       # HTTP, form encoding, logger
├── dtos/            # Normalized message/delivery DTOs
└── constants/       # Defaults, channel enums
```

---

## 🧑‍💻 Example Usage

```ts
import { XoxaClient, TwilioSmsTransport, WhatsAppTransport, TelegramTransport } from "xoxa-msg";

const client = new XoxaClient({ appId: "xoxa-app", debug: true });

// Register SMS (Twilio)
client.registerTransport(
    new TwilioSmsTransport({
        accountSid: process.env.TWILIO_SID!,
        authToken: process.env.TWILIO_TOKEN!,
        from: process.env.TWILIO_FROM!,
    }),
);

// Register WhatsApp (Meta)
client.registerTransport(
    new WhatsAppTransport({
        accessToken: process.env.WHATSAPP_TOKEN!,
        phoneNumberId: process.env.WHATSAPP_NUMBER_ID!,
    }),
);

// Register Telegram
client.registerTransport(
    new TelegramTransport({
        botToken: process.env.TELEGRAM_BOT_TOKEN!,
    }),
);

await client.connect();

// Send SMS
await client.send({
    channel: "sms",
    to: "+2783XXXXXXX",
    body: "Hello from Durban! 🇿🇦",
});

// Send WhatsApp with image
await client.send({
    channel: "whatsapp",
    to: "+2783XXXXXXX",
    body: "Check this out!",
    media: [
        {
            kind: "image",
            url: "https://example.com/dog.jpg",
            caption: "Here’s my dog 🐶",
        },
    ],
});

// Send Telegram text
await client.send({
    channel: "telegram",
    to: "123456789",
    body: "Yo, from xoxa!",
});

await client.disconnect();
```
