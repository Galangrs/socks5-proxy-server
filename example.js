const startProxy = require("./app");

startProxy({ port: 1080, user: "test", password: "pass" }).then(({ server, port, user, password }) => {
    console.log(`Proxy server running on port ${port}`);
    
    
    server.close(() => {
        console.log("Proxy server closed.");
    });
});
