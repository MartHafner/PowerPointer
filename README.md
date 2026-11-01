# PowerPointer

PowerPointer turns an iPhone or another browser into a local remote control for Microsoft PowerPoint. The Node.js server runs on the computer with PowerPoint; the mobile device opens the address shown by the server in its browser. No additional app or cloud connection is required.

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Download and Install from GitHub](#download-and-install-from-github)
  - [Install the Required Software](#install-the-required-software)
  - [Windows](#windows)
  - [macOS](#macos)
  - [Alternative: Download the ZIP Archive](#alternative-download-the-zip-archive)
  - [Connect Your iPhone and Stop the Server](#connect-your-iphone-and-stop-the-server)
- [PowerPoint Permissions](#powerpoint-permissions)
- [Using the Remote](#using-the-remote)
- [Configuration](#configuration)
  - [Demo Mode](#demo-mode)
- [Network and Security](#network-and-security)
- [Project Structure](#project-structure)
- [License](#license)

## Features
<img src="https://github.com/MartHafner/PowerPointer/blob/assets/IMG_0137.jpg" width="300" alt="PowerPointer">
<img src="https://github.com/MartHafner/PowerPointer/blob/assets/IMG_0138.jpg" width="300" alt="PowerPointer">
<img src="https://github.com/MartHafner/PowerPointer/blob/assets/IMG_6761.jpg" width="300" alt="PowerPointer">
- Start and stop a presentation
- Move to the previous or next slide
- Turn the presentation screen black and restore it
- Display the current slide, total slide count, and elapsed time
- Display the connection and PowerPoint status
- Use touch, keyboard, or a Bluetooth clicker to control the presentation
- Protect the WebSocket control connection with a randomly generated session PIN by default
- Use a demo mode that simulates a presentation without PowerPoint

## Requirements

- Node.js 18 or later and npm
- Microsoft PowerPoint for actual presentation control
- The computer and mobile device on the same local network
- macOS or Windows for platform-specific PowerPoint control

PowerPointer can also run without PowerPoint in demo mode. On other operating systems, the server automatically uses this mode.

## Download and Install from GitHub

### Install the Required Software

- **Node.js 18 or later**, including npm. Download and install the current LTS release from [nodejs.org](https://nodejs.org/).
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

1. Install Node.js 18 or later and Git (see above).
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

5. Start the server:

   ```powershell
   npm start
   ```

6. Keep the PowerShell window open. The server prints one or more local addresses. Open one of them in Safari on your iPhone.

### macOS

1. Install Node.js 18 or later. Git is often already available; if macOS prompts you, install the offered Xcode Command Line Tools.
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

5. Start the server:

   ```sh
   npm start
   ```

6. Keep the Terminal window open. Open one of the local addresses printed by the server in Safari on your iPhone.

### Alternative: Download the ZIP Archive

You can download the project without installing Git:

1. Open the [PowerPointer project page on GitHub](https://github.com/MartHafner/PowerPointer).
2. Select **Code**, then **Download ZIP**.
3. Extract the downloaded ZIP archive to a folder of your choice.
4. Open Terminal (macOS) or PowerShell (Windows) in the extracted project folder. This folder contains `package.json`.
5. Run the following commands:

   ```sh
   npm ci
   npm start
   ```

   The same commands work in PowerShell.

### Connect Your iPhone and Stop the Server

After startup, the computer prints the available network addresses and, if possible, a QR code in the terminal. Connect the iPhone and computer to the same local network, then open one of the printed addresses in Safari, for example `http://192.168.1.23:8787`. If the page cannot be reached, allow Node.js to access the private network in your firewall.

Stop the server by pressing `Ctrl+C` in the Terminal or PowerShell window where it is running.

## PowerPoint Permissions

- **macOS:** Allow the application that launched Node.js (for example, Terminal) to control PowerPoint under **System Settings → Privacy & Security → Automation**.
- **Windows:** PowerPoint must be installed and able to start. PowerPointer controls the running PowerPoint instance using PowerShell and COM automation.

## Using the Remote

Use the buttons to control the presentation. While it is running, the interface displays the current slide, the total number of slides, and elapsed time.

Keyboard shortcuts:

| Key | Action |
|---|---|
| Right arrow, Page Down, or Space | Next slide |
| Left arrow or Page Up | Previous slide |
| `b` or `.` | Turn the screen black or restore it |

The server checks PowerPoint's status once per second by default. If the connection is lost, the web interface automatically tries to reconnect.

## Configuration

Settings are stored in [`config/settings.json`](config/settings.json):

| Setting | Default | Description |
|---|---:|---|
| `port` | `8787` | HTTP and WebSocket port |
| `host` | `0.0.0.0` | Network address the server listens on |
| `pin` | `"auto"` | Generate a random four-digit PIN when the server starts; set to `""` to disable PIN protection |
| `pollIntervalMs` | `1000` | Interval between PowerPoint status checks, in milliseconds |

The generated PIN is printed in the server terminal and remains valid until the server stops. Set `pin` to a fixed value to use a custom PIN. `PORT` overrides the configured port; `POWERPOINTER_PIN` overrides the configured PIN, including with `auto` or an empty value. Example for PowerShell:

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

## Network and Security

The web interface and control connection are intended for use on a trusted local network. The server rejects connections from non-local IP addresses. The default PIN is random and changes each time the server starts, but it has only four digits and is displayed in the server terminal. PIN protection is not a substitute for network security.

A PIN protects the WebSocket control connection but does not encrypt it. By default, PowerPointer uses HTTP and WebSocket without TLS, so someone able to monitor local network traffic may capture the PIN and presentation data. Do not expose the server port to the public internet, and only use PowerPointer on networks you trust. Setting `pin` to an empty value disables PIN protection.

## Project Structure

```text
PowerPointer/
├── config/
│   └── settings.json
├── public/
│   ├── App.js
│   ├── Index.html
│   └── Style.css
├── server/
│   ├── platforms/
│   │   ├── macos.js
│   │   └── windows.js
│   ├── network.js
│   ├── powerpoint.js
│   └── server.js
├── install.command
├── package.json
└── package-lock.json
```

- `server/server.js` serves the web interface and manages HTTP, WebSocket, and status connections.
- `server/network.js` discovers local IPv4 addresses and checks whether a client is on a local network.
- `server/powerpoint.js` provides the shared command interface and demo mode.
- `server/platforms/` contains the PowerPoint integrations using AppleScript (macOS) and PowerShell/COM (Windows).
- `public/` contains the remote-control interface.
- `config/settings.json` contains the server settings.
- `install.command` is a macOS installation script.

## License

This project is licensed under the [MIT License](LICENSE).
