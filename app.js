/**
 * SOCKS5 Proxy Server
 * 
 * This module provides a SOCKS5 proxy server with optional authentication
 * and support for forwarding requests through an upstream SOCKS5 proxy.
 * 
 * Dependencies:
 * - socksv5
 * - socks
 * - net
 * 
 * Functions:
 * - findFreePort(): Finds an available port.
 * - validateConfig(config): Validates the user configuration.
 * - validateProxy(proxy): Validates the proxy settings.
 * - app(config, proxy): Starts the SOCKS5 proxy server.
 * 
 * Response:
 * - { server: Object, localPort: number } if successful.
 * - { server: null, localPort: null } if an error occurs.
 */

const socks = require("socksv5");
const { SocksClient } = require("socks");
const net = require("net");

/**
 * Finds an available port on the system.
 * @returns {Promise<number>} Available port number.
 */
async function findFreePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });
        server.on("error", reject);
    });
}

/**
 * Validates the SOCKS5 server configuration.
 * @param {Object} config - Configuration object.
 * @throws {Error} If configuration is invalid.
 */
function validateConfig(config) {
    if (config !== null && typeof config !== "object") throw new Error("Invalid config object");
    if (config && config.port !== undefined && typeof config.port !== "number") throw new Error("Invalid port");
    if (config && config.user !== undefined && typeof config.user !== "string") throw new Error("Invalid user");
    if (config && config.password !== undefined && typeof config.password !== "string") throw new Error("Invalid password");
}

/**
 * Validates the proxy configuration.
 * @param {Object} proxy - Proxy settings.
 * @throws {Error} If proxy settings are invalid.
 */
function validateProxy(proxy) {
    if (proxy !== null && typeof proxy !== "object") throw new Error("Invalid proxy object");
    if (proxy && (!proxy.hostProxy || typeof proxy.hostProxy !== "string")) throw new Error("Invalid or missing hostProxy");
    if (proxy && (!proxy.portProxy || typeof proxy.portProxy !== "number")) throw new Error("Invalid or missing portProxy");
    if (proxy && (!proxy.userProxy || typeof proxy.userProxy !== "string")) throw new Error("Invalid or missing userProxy");
    if (proxy && (!proxy.passwordProxy || typeof proxy.passwordProxy !== "string")) throw new Error("Invalid or missing passwordProxy");
}

/**
 * Starts the SOCKS5 proxy server.
 * @param {Object} config - Configuration for the proxy server.
 * @param {number} [config.port] - Port number (optional, will be auto-assigned if missing).
 * @param {string} [config.user] - Username for authentication (optional).
 * @param {string} [config.password] - Password for authentication (optional).
 * @param {Object} proxy - Upstream proxy settings (optional).
 * @returns {Promise<{server: Object, localPort: number}>} Proxy server instance and port.
 */
async function app(config = {}, proxy = null) {
    validateConfig(config);
    validateProxy(proxy);
    
    const { port = null, user = null, password = null } = config;
    let server;

    try {
        const localPort = port || await findFreePort();

        server = socks.createServer((info, accept, deny) => {
            const { dstAddr, dstPort } = info;

            if (proxy) {
                const { hostProxy, portProxy, userProxy, passwordProxy } = proxy;
                const connectionOptions = {
                    proxy: {
                        ipaddress: hostProxy,
                        port: parseInt(portProxy, 10),
                        type: 5,
                        userId: userProxy,
                        password: passwordProxy,
                    },
                    command: "connect",
                    destination: { host: dstAddr, port: dstPort },
                };

                SocksClient.createConnection(connectionOptions)
                    .then(({ socket }) => {
                        const outbound = accept(true);
                        outbound.pipe(socket);
                        socket.pipe(outbound);

                        socket.on("error", () => outbound.end());
                        outbound.on("error", () => socket.end());
                    })
                    .catch(() => deny());
            } else {
                const directSocket = net.connect(dstPort, dstAddr, () => {
                    const outbound = accept(true);
                    outbound.pipe(directSocket);
                    directSocket.pipe(outbound);
                });

                directSocket.on("error", () => deny());
            }
        });

        server.listen(localPort, () => {
            console.log(
                `Socks5 server running on localhost:${localPort}, ${
                  user && password ? `user:${user}, password:${password}` : "no authentication"
                }`
            );
        });

        server.on("error", (err) => {
            console.error("Server error:", err);
        });

        server.useAuth(user && password ? socks.auth.UserPassword((usr, pwd, cb) => cb(usr === user && pwd === password)) : socks.auth.None());

        return { server, localPort, user, password };
    } catch (error) {
        console.error("Error : " + error)
        if (server) {
            server.close(() => {
                console.log("Application socks5 stoped")
            });
        }
        return { server: null, localPort: null, user: null, password: null };
    }
}

module.exports = app;


// Global unhandled error handler for the process
process.on('uncaughtException', (err) => {
    console.error("Unhandled exception:", err);
    performAdditionalAction("Unhandled exception in process.");
});

process.on('unhandledRejection', (reason, promise) => {
    console.error("Unhandled rejection:", reason);
    performAdditionalAction("Unhandled rejection in process.");
});
