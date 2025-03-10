# SOCKS5 Proxy Server

This module provides a SOCKS5 proxy server with optional authentication and support for forwarding requests through an upstream SOCKS5 proxy.

## Features
- SOCKS5 proxy server with authentication
- Upstream SOCKS5 proxy support
- Automatic port allocation
- Error handling mechanisms

## Dependencies
- `socksv5`
- `socks`
- `net`

## Installation
```sh
npm install socksv5 socks net
```
```sh
npm install socks5-proxy-server
```

## Usage

```javascript
const app = require("./socks5-proxy");

(async () => {
    const proxyServer = await app({ port: 1080, user: "test", password: "pass" });
    console.log(`Proxy running on port ${proxyServer.localPort}`);
})();
```

## Using an Upstream Proxy
```javascript
const proxyServer = await app(
    { port: 1080, user: "test", password: "pass" },
    { hostProxy: "172.31.24.202", portProxy: 2001, userProxy: "gemink", passwordProxy: "proxys" }
);
```

## Stopping the Proxy Server
To stop the proxy server, you can simply terminate the process running the script:
```sh
CTRL + C
```
If running as a background process, use:
```sh
kill $(lsof -t -i:1080)
```
Replace `1080` with the actual port if different.

Alternatively, you can stop the server within the script:
```javascript
proxyServer.server.close(() => {
    console.log("Proxy server closed.");
});
```

## Handling Errors
```javascript
process.on('uncaughtException', (err) => {
    console.error("Unhandled exception:", err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error("Unhandled rejection:", reason);
});
```

## API

### `findFreePort()`
Finds an available port.

### `validateConfig(config)`
Validates the user configuration.

### `validateProxy(proxy)`
Validates the proxy settings.

### `app(config, proxy)`
Starts the SOCKS5 proxy server.

#### Response:
- `{ server: Object, localPort: number }` if successful.
- `{ server: null, localPort: null }` if an error occurs.

---
