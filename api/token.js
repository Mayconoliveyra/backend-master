const { SECRET_KEY_SERVER } = require("../.env")
const jwt = require("jwt-simple")

module.exports = (app) => {
    const { existOrError } = app.api.utilities;

    /* Gera o token para ser utilizando no front end, só vai conseguir fazer requisição com esse token setado no header da requisição */
    const get = async (req, res) => {
        const client_id = req.query._client_id
        const client_secret = req.query._client_secret
        const client_app = req.query._client_app

        try {
            existOrError(client_id, "[client_id] não pode ser nulo.")
            existOrError(client_secret, "[client_secret] não pode ser nulo.")
            existOrError(client_app, "[client_app] não pode ser nulo.")
        } catch (error) {
            return res.status(400).send(error)
        }

        const data = Math.floor(Date.now() / 1000)
        const payload = {
            client_id: client_id,
            client_secret: client_secret,
            client_app: client_app,
            iat: data, // emitido em
            exp: data + (60 * 15)  /* token expira em 15 minuto */
        }

        return res.status(200).send(jwt.encode(payload, SECRET_KEY_SERVER))
    };

    return { get }
}