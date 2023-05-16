const { DB_CONFIG, SECRET_KEY_SERVER } = require("../.env")
const knex = require("knex")
const passport = require("passport")
const passportJwt = require("passport-jwt")
const { Strategy, ExtractJwt } = passportJwt

/* Conecta a base Softconnect(master) */
const DBSoftconnect = {
        client: "mysql2",
        connection: {
                host: DB_CONFIG.host,
                user: DB_CONFIG.user,
                password: DB_CONFIG.password,
                database: "softconnect",
                port: DB_CONFIG.port,
                dateStrings: true,
        },
        pool: {
                min: 0,
                max: 7
        },
        migrations: {
                directory: './migrations/softconnect-master',
        },
}
const softconnect = knex(DBSoftconnect)
softconnect.migrate.latest()

const validarEmpresa = (empresa) => {
        try {
                if (empresa.client_app === "meu-ponto") {
                        if (!empresa.nome) throw "Empresa[nome] não pode ser nulo."
                        if (!empresa.client_database) throw "Empresa[client_database] não pode ser nulo."
                }
        } catch (error) {
                return error
        }
}

/* configuração da base */
/* nome da base, nome aplicação(ex: meu ponto, tá na mão...) */
const config = (base_nome, app) => {
        return {
                client: "mysql2",
                connection: {
                        host: DB_CONFIG.host,
                        user: DB_CONFIG.user,
                        password: DB_CONFIG.password,
                        database: base_nome,
                        port: DB_CONFIG.port,
                        dateStrings: true,
                },
                pool: {
                        min: 0,
                        max: 7
                },
                migrations: {
                        directory: `./migrations/${app}`,
                },
        }
}

module.exports = app => {
        const params = {
                secretOrKey: SECRET_KEY_SERVER,
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
        }

        const strategy = new Strategy(params, async (payload, done) => {
                const { client_id, client_secret, client_app } = payload
                try {
                        if (!client_id) throw "[client_id] não pode ser nulo"
                        if (!client_secret) throw "[client_secret] não pode ser nulo"
                        if (!client_app) throw "[client_app] não pode ser nulo"

                        const store = await softconnect("cadastro_empresas")
                                .where({ client_id: client_id, client_secret: client_secret })
                                .andWhere({ client_app: client_app })
                                .first()
                        if (!store) throw `Empresa não foi encontrada. client_id: ${client_id} client_secret: ${client_secret} client_app: ${client_app}`

                        /* Verifica se todos dados obrigatorios estão preenchidos no cadastro. */
                        /* Se existe algum campo pendente será retornar erro */
                        const storeValid = validarEmpresa(store)
                        if (storeValid) throw storeValid

                        /* Seta a instancia da loja, caso ainda nao tiver setana na variavel "app.connections" */
                        const empresaBase = store.client_database /* Nome da base do cliente */
                        const empresaAPP = store.client_app  /* aplicação */
                        if (!app.connections[empresaBase]) {
                                const conexao = knex(config(empresaBase, empresaAPP))
                                await conexao.migrate.latest()

                                /* Seta instancia para ser utilizada nas proximas requisição; */
                                app.connections[empresaBase] = conexao
                        }

                        app.db = app.connections[empresaBase]
                        app.st = softconnect
                        app.store = store

                        return done(null, { ...payload })
                } catch (error) {
                        softconnect.insert({ name: "passport", error: JSON.stringify(error) })
                                .table("_error_backend")
                                .then()
                                .catch((error) => console.log("softconnect.insert: " + error));

                        app.st = false
                        app.db = false
                        app.store = false
                        return done(null, false)
                }
        })

        passport.use(strategy)
        return {
                authenticate: () => passport.authenticate('jwt', { session: false })
        }
}