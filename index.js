const fs = require('fs');
const https = require('https');
const app = require("express")()
const consign = require("consign");

const privateKey = fs.readFileSync('/etc/letsencrypt/live/softconnectdeveloper.shop/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/softconnectdeveloper.shop/fullchain.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };
const httpsServer = https.createServer(credentials, app);

app.connections = {}; /* amazena as instancia mysql */
consign()
    .include('./config/passport.js')
    .then("./config/middlewares.js")
    .then("./api/utilities.js")
    .then("./services")
    .then("./api")
    .then("./config/routes")
    .into(app)

httpsServer.listen(3030, () => {
    console.log("Backend executando HTTPS...")
}) 