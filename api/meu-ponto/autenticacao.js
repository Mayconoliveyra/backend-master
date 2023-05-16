const { SECRET_KEY_AUTH } = require("../../.env")
const jwt = require("jwt-simple")
const bcrypt = require('bcrypt')
const encryptPassword = password => {
    const salt = bcrypt.genSaltSync(11)
    return bcrypt.hashSync(password, salt)
}

module.exports = (app) => {
    const { existOrError, utility_console } = app.api.utilities;

    const entradaUsuario = async (req, res) => {
        const modelo = {
            email: req.body.email,
            senha: req.body.senha,
        }

        try {
            existOrError(modelo.email, { email: "E-mail é obrigatório" })
            existOrError(modelo.senha, { senha: "Senha é obrigatório" })

            if (!modelo.senha.length >= 3) throw { senha: "A senha precisa ter no minimo 3 caracteres." }

            const user = await app.db("cadastro_usuarios")
                .where({ email: modelo.email })
                .whereNull("deleted_at")
                .first()
            if (!user) throw { email: "Email não encontrado" }
            if (user.bloqueado == "Sim") throw "Usuário bloqueado."
        } catch (error) {
            return res.status(400).send(error)
        }

        try {
            const user = await app.db("cadastro_usuarios")
                .select("id", "nome", "email", "contato", "adm", "senha", "bloqueado")
                .where({ email: modelo.email })
                .whereNull("deleted_at")
                .first()
            const isMatch = bcrypt.compareSync(modelo.senha, user.senha)
            if (!isMatch) return res.status(400).send({ senha: "Senha incorreta" })

            delete user.senha

            const data = Math.floor(Date.now() / 1000)
            const payload = {
                ...user,
                iat: data, // emitido em
                exp: data + (60 * 60 * 24)  /* token expira em  24hrs */
            }

            const usuario = {
                ...user,
                token: jwt.encode(payload, SECRET_KEY_AUTH)
            }

            return res.status(200).json(usuario)
        } catch (error) {
            return res.status(400).send({ senha: "Senha incorreta" })
        }
    }

    const alterarSenha = async (req, res) => {
        const modelo = {
            senha_old: req.body.senha_old,
            senha_new: req.body.senha_new,
            confirsenha: req.body.confirsenha,
        }
        const msgFixa = "Campo de preenchimento obrigatorio.";
        try {
            existOrError(modelo.senha_old, { senha_old: msgFixa })
            existOrError(modelo.senha_new, { senha_new: msgFixa })
            existOrError(modelo.confirsenha, { confirsenha: msgFixa })
            if (modelo.senha_new != modelo.confirsenha) throw { confirsenha: 'A confirmação de senha não confere.' }
        } catch (error) {
            return res.status(400).send(error)
        }

        const usuario = await app.db("cadastro_usuarios")
            .where({ id: req.usuario.id })
            .whereNull("deleted_at")
            .first()
        if (!usuario) return res.status(400).send("Usuario não encontrado.")

        try {
            const isMatch = bcrypt.compareSync(modelo.senha_old, usuario.senha)
            if (!isMatch) throw { senha_old: "Senha incorreta" }
        } catch (error) {
            return res.status(400).send({ senha_old: "Senha incorreta" })
        }

        await app.db("cadastro_usuarios")
            .update({ senha: encryptPassword(modelo.senha_new) })
            .where({ id: usuario.id })
            .then(() => res.status(204).send())
            .catch((error) => {
                utility_console("autenticacao.alterarSenha", error)
                return res.status(500).send()
            });
    }

    /* Valida se o token de autenticação do usuario é valido  */
    const validarTokenUsuario = async (req, res) => {
        const usuario = req.body || null

        try {
            if (usuario && usuario.id && usuario.token) {
                // converte token em objeto e validar se ainda é valido, se tiver expirado cai no catch
                const token = jwt.decode(usuario.token, SECRET_KEY_AUTH)

                /* Valida se os dados do token é compativel com os dados do objeto usuario */
                if (usuario.id !== token.id) return res.status(200).send(false)
                if (usuario.nome !== token.nome) return res.status(200).send(false)
                if (usuario.email !== token.email) return res.status(200).send(false)
                if (usuario.bloqueado !== token.bloqueado) return res.status(200).send(false)
                if (usuario.adm !== token.adm) return res.status(200).send(false)

                /* valida se os dados do header é igual o da base. Se tiver alguma alteração no cadastro vai redirecionar para relongar */
                const user = await app.db("cadastro_usuarios")
                    .select("id", "nome", "email", "contato", "adm", "bloqueado")
                    .where({ id: usuario.id })
                    .whereNull("deleted_at")
                    .first()
                if (user.email !== usuario.email) return res.status(200).send(false)
                if (user.nome !== usuario.nome) return res.status(200).send(false)
                if (user.bloqueado !== usuario.bloqueado) return res.status(200).send(false)
                if (user.adm !== usuario.adm) return res.status(200).send(false)

                //NO JS A DATA E EM MILISSEGUNDOS, NO TOKEN ESTA EM SEGUNDOS, MULTIPLICO POR 1000 PRA TRANSFORMA EM MILISSEGUNDOS TBM.
                if (new Date(token.exp * 1000) > new Date()) {
                    return res.send(true)
                }
            }
        } catch (e) {
            return res.status(200).send(false)
        }

        /* Retorna */
        return res.status(200).send(false)
    }

    return { entradaUsuario, alterarSenha, validarTokenUsuario };
};
