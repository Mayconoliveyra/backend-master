const { SECRET_KEY_AUTH } = require("../.env")
const jwt = require("jwt-simple")
module.exports = middleware => {
        return (req, res, next) => {
                try {
                        if (!req.headers || !req.headers.usuario) throw "[1] Autenticação inválida"
                        const body = jwt.decode(req.headers.usuario, SECRET_KEY_AUTH);

                        if (body && body.id && body.email && body.adm) {
                                req.usuario = body
                                middleware(req, res, next)
                        } else {
                                throw "[2] Autenticação inválida"
                        }
                } catch (error) {
                        console.log(error)
                        res.status(401).send("Usuário não está autenticado ou não é ADM")
                }
        }
}