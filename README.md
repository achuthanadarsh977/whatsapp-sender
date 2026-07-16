# whatsapp-sender

A Node.js CLI tool that broadcasts a WhatsApp message to every member of a
specific group individually (as separate DMs), instead of posting to the
group itself. Built on [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js),
which drives a real WhatsApp Web session through a Puppeteer-controlled
Chrome browser.

## How it works

1. On first run, a QR code is printed in the terminal — scan it with
   WhatsApp on your phone (Linked Devices) to authenticate.
2. Once connected, the script looks up a target group by name and lists
   its members.
3. An interactive menu lets you choose what to send: text, image, audio,
   video, or document.
4. The chosen content is sent to every group member one at a time, as an
   individual message, with a short delay between sends and a
   success/failure log per recipient.

## Requirements

- Node.js
- Google Chrome installed at `C:\Program Files\Google\Chrome\Application\chrome.exe`
  (or update the `executablePath` in `index.js` to match your install)

## Setup

```sh
npm install
```

## Configuration

Edit `GROUP_NAME` in `index.js` to match the exact name of the WhatsApp
group you want to message:

```js
const GROUP_NAME = 'Open Truck_Fleetco';
```

## Run

```sh
node index.js
```

Scan the QR code when prompted, then follow the on-screen menu to pick
what to send.

## Notes

- Authentication is cached locally via `LocalAuth`, stored in a
  `.wwebjs_auth` folder — you shouldn't need to re-scan the QR code on
  every run unless that folder is deleted or the session expires.
- If authentication fails, delete the `.wwebjs_auth` folder and re-run.
