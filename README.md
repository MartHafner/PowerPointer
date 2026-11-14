# PowerPointer

PowerPointer turns your phone or tablet into a remote control for Microsoft PowerPoint. The Node.js server runs on the computer with PowerPoint, and the mobile device opens the address shown by the server in its browser. No additional app or cloud connection is required.

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Download and Install from GitHub](#download-and-install-from-github)
  - [Install the Required Software](#install-the-required-software)
  - [Windows](#windows)
  - [macOS](#macos)
  - [Alternative: Download the ZIP Archive](#alternative-download-the-zip-archive)
  - [Updating](#updating)
- [Start Options](#start-options)
- [Desktop App](#desktop-app)
- [Connect Your Phone and Stop the Server](#connect-your-phone-and-stop-the-server)
- [Using a Personal Hotspot](#using-a-personal-hotspot)
- [PowerPoint Permissions](#powerpoint-permissions)
- [Using the Remote](#using-the-remote)
- [Configuration](#configuration)
  - [Demo Mode](#demo-mode)
  - [Debugging](#debugging)
- [Network and Security](#network-and-security)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)
- [License](#license)

## Features
### iPad view
<p align="center">
   <img src="https://github.com/MartHafner/PowerPointer/blob/assets/IMG_0137.jpg" width="300" alt="PowerPointer">
   <img src="https://github.com/MartHafner/PowerPointer/blob/assets/IMG_0138.jpg" width="300" alt="PowerPointer">
</p>

### iPhone view
<p align="center">
   <img src="https://github.com/MartHafner/PowerPointer/blob/assets/IMG_6761.jpg" width="300" alt="PowerPointer">
</p>

- Start and stop a presentation
- Move to the previous or next slide
- Turn the presentation screen black and restore it
- Display the current slide, total slide count, and elapsed time
- Display speaker notes on tablet-sized screens (viewport width of 700 px or more)
- Display the connection and PowerPoint status
- Use touch, keyboard, or a Bluetooth clicker to control the presentation
- Keep the phone screen awake while the remote is open (where the browser supports the Screen Wake Lock API) and give short haptic feedback on button presses (where the browser supports vibration)
- Protect the WebSocket control connection with a randomly generated session PIN by default
- Show status, connected clients, PIN, addresses, and a QR code in an optional desktop dashboard
- Use a demo mode that simulates a presentation without PowerPoint

## Requirements

- Node.js and npm:
  - **Desktop app and `npm start`:** Node.js 22.12 or later (required by Electron 45)
  - **Headless server only (`npm run server`):** Node.js 18 or later
- Microsoft PowerPoint for actual presentation control
- The computer and mobile device must be connected to the same local network
- macOS or Windows for platform-specific PowerPoint control

PowerPointer can also run without PowerPoint in demo mode. On other operating systems, the server automatically uses this mode.

If you only have Node.js 18 to 20, install without the Electron development dependency and use the headless server:

```sh
npm ci --omit=dev
npm run server
```

## Download and Install from GitHub

### Install the Required Software

- **Node.js 22.12 or later** (18 or later if you only use the headless server), including npm. Download and install the current LTS release from [nodejs.org](https://nodejs.org/).
- **Git**, if you want to clone the repository using `git clone`. Download it from [git-scm.com](https://git-scm.com/downloads).
- Microsoft PowerPoint for actual presentation control.
- The computer and mobile device on the same local network.

After installation, check that Node.js and npm are available:

```sh
node --version
npm --version
```

Both commands should print version numbers. If they do not, close and reopen the terminal. If the commands are still not found, check your Node.js installation.

### Windows

1. Install Node.js and Git (see above).
2. Open **PowerShell**.
3. Change to the folder where you want to keep the project, then clone the repository:

   ```powershell
   cd $HOME\Documents
   git clone https://github.com/MartHafner/PowerPointer.git
   cd PowerPointer
   ```

4. Install the exact project dependencies:

   ```powershell
   npm ci
   ```

5. Start PowerPointer (this opens the desktop dashboard):

   ```powershell
   npm start
   ```

6. The dashboard shows the local addresses, a QR code, and the connection code. Open one of the addresses in the browser on your phone. To run without the dashboard, use `npm run server` instead and keep the PowerShell window open; the addresses are then printed there.
7. If Windows Defender Firewall asks whether to allow Node.js or PowerPointer on the network, allow it for **private networks**. Otherwise the phone cannot reach the server.

### macOS

1. Install Node.js. Git is often already available; if macOS prompts you, install the offered Xcode Command Line Tools.
2. Open **Terminal**.
3. Change to the folder where you want to keep the project, then clone the repository:

   ```sh
   cd ~/Documents
   git clone https://github.com/MartHafner/PowerPointer.git
   cd PowerPointer
   ```

4. Install the project dependencies:

   ```sh
   npm ci
   ```

   Alternatively, double-click `install.command` in the project folder. It checks that Node.js 18 or later is installed, runs `npm install`, and offers to start PowerPointer afterwards. If macOS blocks the script because it was downloaded from the internet, right-click it, choose **Open**, and confirm.

5. Start PowerPointer (this opens the desktop dashboard):

   ```sh
   npm start
   ```

6. Open one of the addresses shown in the dashboard in your phone's browser. To run without the dashboard, use `npm run server` instead and keep the Terminal window open; the addresses are then printed there.

### Alternative: Download the ZIP Archive

You can download the project without installing Git:

1. Open the [latest release of PowerPointer](https://github.com/MartHafner/PowerPointer/releases/latest) on GitHub.
2. Under **Assets**, download **Source code (zip)**.
3. Extract the downloaded ZIP archive to a folder of your choice.
4. Open Terminal (macOS) or PowerShell (Windows) in the extracted project folder. This folder contains `package.json`.
5. Run the following commands:

   ```sh
   npm ci
   npm start
   ```

   The same commands work in PowerShell.

### Updating

- **Git:** Run `git pull` and `npm ci` in the project folder, then restart PowerPointer.
- **ZIP:** Download the [latest release](https://github.com/MartHafner/PowerPointer/releases/latest), extract it to a new folder, copy your `config/settings.json` from the old folder, and run `npm ci` and `npm start`.

## Start Options

| Command | What it does |
|---|---|
| `npm start` | Starts the desktop app (Electron dashboard) and the server. Terminal output appears only when `DEBUG` is set. |
| `npm run desktop` | Same as `npm start`. |
| `npm run server` | Starts only the server without a dashboard. Prints addresses, a QR code, and the PIN in the terminal. |
| `npm run dev` | `npm start` in [demo mode](#demo-mode) (Unix-style shells). |
| `npm run desktop:dev` | Same as `npm run dev`. |
| `npm run server:dev` | `npm run server` in demo mode (Unix-style shells). |
| `npm run debug` | `npm start` with [debug logging](#debugging) (Unix-style shells). |

The `dev`, `server:dev`, `desktop:dev`, and `debug` scripts set environment variables with Unix syntax. In PowerShell, set the variable first as shown in the [Demo Mode](#demo-mode) and [Debugging](#debugging) sections.

## Desktop App

PowerPointer includes an optional Electron desktop app. It starts the server and opens a dashboard showing the PowerPoint status, current slide, connected clients, connection PIN, and local network addresses. Select an address to display its QR code, or copy it to the clipboard to open it on your phone.

Install the project dependencies as described above, then start the desktop app from the project folder:

```sh
npm start
```

`npm run desktop` does the same. You do not need to start the server separately; the desktop app starts it for you. Only one instance can run at a time: starting PowerPointer a second time brings the existing window to the front. If the configured port is already in use, the app shows an error message and quits.

On macOS, closing the dashboard window leaves the server running; use **Cmd+Q** to quit the app and stop the server. On Windows, closing the window stops the app and server.

## Connect Your Phone and Stop the Server

Connect your phone and computer to the same local network, then open one of the addresses in your phone's browser, for example `http://192.168.1.23:8787`. You can find the addresses in the desktop dashboard (select one to show its QR code) or, when running `npm run server`, in the terminal together with a QR code for the first address.

macOS: If the page cannot be reached, allow node to accept incoming connections under System Settings → Network → Firewall → Options.

Windows: If the page cannot be reached, make sure the firewall allows Node.js or PowerPointer on private networks.

Stop the server by quitting the desktop app (Cmd+Q on macOS, closing the window on Windows) or, when using `npm run server`, by pressing `Ctrl+C` in the Terminal or PowerShell window where it is running.

## Using a Personal Hotspot

If you are on an untrusted or shared network (for example, at a conference), you can use your phone's personal hotspot instead:

1. On your iPhone, turn on **Settings → Personal Hotspot**.
2. Connect the computer to your iPhone's Wi-Fi network.
3. Start PowerPointer and open the address shown in the dashboard (or printed in the terminal) in your iPhone's browser. The address usually starts with `172.20.10.` when using an iPhone hotspot.

If the computer has several network connections, several addresses are listed. Use the one that matches the hotspot network. In the dashboard you can select the address whose QR code you want to scan; the terminal QR code uses only the first address.

## PowerPoint Permissions

- **macOS:** Allow the application that launched PowerPointer (for example, Terminal or the Electron app) to control PowerPoint under **System Settings → Privacy & Security → Automation**.
- **Windows:** PowerPoint must be installed and running with a presentation open. PowerPointer connects to the running instance using PowerShell and COM automation.

## Using the Remote

Use the buttons to control the presentation. While it is running, the interface displays the current slide, the total number of slides, and elapsed time. On tablet-sized screens, the speaker notes of the current slide are shown as well.

Keyboard shortcuts:

| Key | Action |
|---|---|
| Right arrow, Page Down, or Space | Next slide |
| Left arrow or Page Up | Previous slide |
| `b` or `.` | Turn the screen black or restore it |

The shortcuts are inactive while the PIN dialog is open.

Status messages:

| Message | Meaning |
|---|---|
| Presentation running | A slide show is running. |
| Screen hidden | The slide show is running and the screen is black. |
| Ready – no presentation active | PowerPoint is open, but no slide show is running. Use **Start**. |
| PowerPoint is not open | PowerPoint is not running. |
| PowerPoint not reachable / Error: … | The server could not talk to PowerPoint, for example because of missing permissions. |

The server checks PowerPoint's status every 500 milliseconds (twice per second) by default. If the connection is lost, the web interface automatically tries to reconnect.

## Configuration

Settings are stored in [`config/settings.json`](config/settings.json):

| Setting | Default | Description |
|---|---:|---|
| `port` | `8787` | HTTP and WebSocket port |
| `host` | `0.0.0.0` | Network address the server listens on |
| `pin` | `"auto"` | Generate a random four-digit PIN when the server starts; set to `""` to disable PIN protection |
| `pollIntervalMs` | `500` | Interval between PowerPoint status checks, in milliseconds (if the setting is missing, the server falls back to 1000) |

The generated PIN is shown in the desktop dashboard (or printed in the terminal when running `npm run server`) and remains valid until the server stops. Set `pin` to a fixed value to use a custom PIN. The web interface only accepts exactly four digits, so a fixed PIN must consist of four digits (for example `"1234"`); longer or non-numeric PINs cannot be entered on the phone. `PORT` overrides the configured port; `POWERPOINTER_PIN` overrides the configured PIN, including with `auto` or an empty value. Example for PowerShell:

```powershell
$env:POWERPOINTER_PIN = "1234"
npm start
```

The web interface prompts for the PIN when connecting. It is stored for the current browser tab session.

### Demo Mode

Demo mode simulates a presentation with ten slides. On macOS and Windows, enable it with the `POWERPOINTER_MOCK` environment variable:

```sh
POWERPOINTER_MOCK=1 npm start
```

In PowerShell:

```powershell
$env:POWERPOINTER_MOCK = "1"
npm start
```

The `npm run dev` script enables the same mode in shells that support Unix-style environment variable assignment.

### Debugging

Debug logging adds timestamps and details about server startup and shutdown, TCP and HTTP connections, WebSocket connections and messages, and process warnings. With `npm start`, the terminal UI (addresses, QR code, PIN) is normally hidden; enabling debug mode shows it together with the log output. To enable it on macOS or Linux, run:

```sh
DEBUG=1 npm start
```

The `npm run debug` script does the same on shells that support Unix-style environment variable assignment. In PowerShell, use:

```powershell
$env:DEBUG = "1"
npm start
```

`DEBUG=0` and `DEBUG=false` keep debug mode off. Debug output appears in the same terminal as the server. HTTP and WebSocket URLs have their PIN masked, but WebSocket message contents are logged. Avoid sharing debug logs publicly; to return to normal logging in PowerShell, run `Remove-Item Env:DEBUG` before starting the server again.

## Network and Security

The web interface and control connection are intended for use on a trusted local network. The server rejects connections from non-local IP addresses (private IPv4 ranges, link-local addresses, loopback, and the IPv6 equivalents). It answers only `GET` and `HEAD` requests, serves only the files in `public/`, and limits WebSocket messages to 1 KB. Clients can only trigger a fixed set of commands: `next`, `prev`, `start`, `stop`, and `blank`.

The PIN protects the WebSocket control connection, not the static web page itself. The page contains no presentation data, but anyone on the local network can load it; without the PIN they cannot receive status or send commands.

The default PIN is random and changes each time the server starts, but it has only four digits and is displayed in the dashboard or server terminal. To slow PIN guessing, five incorrect PIN attempts from the same client IP trigger a lockout. The first lockout lasts one minute; subsequent lockouts double in duration up to a maximum of 15 minutes. During a lockout, even the correct PIN is rejected. An attempt to connect without a PIN does not count as a failed attempt, and a successful connection resets the failed-attempt and lockout history for that IP. This rate limit is held in memory and resets when the server restarts.

A PIN protects the WebSocket control connection but does not encrypt it. By default, PowerPointer uses HTTP and WebSocket without TLS, so someone able to monitor local network traffic may capture the PIN and presentation data (including speaker notes). Do not expose the server port to the public internet, and only use PowerPointer on networks you trust. Setting `pin` to an empty value disables PIN protection.

## Troubleshooting

| Problem | Solution |
|---|---|
| The page does not load on the phone | Make sure phone and computer are on the same network, use an address shown by PowerPointer, and check the firewall (see [Connect Your Phone](#connect-your-phone-and-stop-the-server)). Some guest or hotel networks isolate devices from each other; use a [personal hotspot](#using-a-personal-hotspot) instead. |
| "Port 8787 is already in use" | PowerPointer may already be running. Quit it, or change `port` in `config/settings.json` or set the `PORT` environment variable. |
| "Wrong PIN" or "Locked" | Enter the PIN currently shown in the dashboard or terminal. After five wrong attempts, wait for the lockout to end (1 to 15 minutes) or restart the server. |
| The PIN dialog does not accept my custom PIN | The web interface accepts exactly four digits. Use a four-digit `pin`. |
| "PowerPoint is not open" | Start PowerPoint and open a presentation. |
| "PowerPoint not reachable" or an automation error (macOS) | Allow the launching application to control PowerPoint under **System Settings → Privacy & Security → Automation**. |
| "PowerPoint not reachable" (Windows) | Make sure PowerPoint is running with a presentation open and that PowerShell scripts can be executed in your environment. |
| Speaker notes are not shown | Notes are displayed only on tablet-sized screens (width of 700 px or more) and only while a slide show is running. |
| `npm ci` or Electron fails on an older Node.js version | Electron 45 requires Node.js 22.12 or later. Update Node.js, or use `npm ci --omit=dev` and `npm run server`. |
| Nothing to try without PowerPoint | Use the [demo mode](#demo-mode). |

## Project Structure

```text
PowerPointer/
├── config/
│   └── settings.json
├── desktop/
│   ├── main.js
│   ├── panel.css
│   ├── panel.html
│   ├── panel.js
│   └── preload-panel.js
├── public/
│   ├── app.js
│   ├── index.html
│   └── style.css
├── server/
│   ├── platforms/
│   │   ├── macos.js
│   │   └── windows.js
│   ├── network.js
│   ├── debug.js
│   ├── pin.js
│   ├── ratelimit.js
│   ├── powerpoint.js
│   └── server.js
├── install.command
├── LICENSE
├── package.json
└── package-lock.json
```

- `server/server.js` serves the web interface and manages HTTP, WebSocket, and status connections.
- `server/network.js` discovers local IPv4 addresses and checks whether a client is on a local network.
- `server/debug.js` provides optional timestamped logging when `DEBUG` is enabled.
- `server/pin.js` generates the random session PIN.
- `server/ratelimit.js` limits repeated incorrect PIN attempts per client IP.
- `server/powerpoint.js` provides the shared command interface and demo mode.
- `server/platforms/` contains the PowerPoint integrations using AppleScript (macOS) and PowerShell/COM (Windows).
- `desktop/` contains the optional Electron app and its connection dashboard.
- `public/` contains the remote-control interface.
- `config/settings.json` contains the server settings.
- `install.command` is a macOS installation script.

## License

This project is licensed under the [MIT License](LICENSE).