module.exports = (app) => {
    const { existOrError, utility_console, dataHoraAtual, notExistOrErrorDB, existOrErrorDB } = app.api.utilities;
    const simplify = (text) => {
        const removeFilter = [
            "",
            "a",
            "e",
            "i",
            "o",
            "u",
            "ao",
            "um",
            "de",
            "da",
            "das",
            "dos",
            "que",
            "para",
            "um",
            "nas",
            "ter",
            "com",
            "tem",
            "em",
            "AND"];

        const search = text
            .normalize("NFD")
            .replace(/[^a-zA-Z0-9\s]/g, "")
            .trim()
            .toLowerCase()
            .split(' ');

        const searchArray = search
        let textAndReturn = ""

        searchArray.map(elemento => {
            /* Se tiver algum caracteres do removeFilter remover */
            if (removeFilter.includes(elemento)) return

            if (elemento.slice(-1) == 's') {
                /* Remove o 's' do final da palavra. ex: lampadas, tintas...*/
                textAndReturn = `${textAndReturn} 
                    id LIKE '%${elemento.slice(0, elemento.length - 1)}%' OR
                    cpf LIKE '%${elemento.slice(0, elemento.length - 1)}%' OR
                    nome LIKE '%${elemento.slice(0, elemento.length - 1)}%'
                AND`;

            } else {
                textAndReturn = `${textAndReturn} 
                    id LIKE '%${elemento}%' OR
                    cpf LIKE '%${elemento}%' OR
                    nome LIKE '%${elemento}%' 
                AND`;
            }
        });
        /* Remover o AND do final da query */
        return `(${textAndReturn.slice(0, textAndReturn.length - 3)})`
    }

    const getADM = async (req, res) => {
        const id = req.params.id
        if (id) {
            await app.db("cadastro_usuarios")
                .select("id", "nome", "cpf", "rg", "data_nasc", "email", "contato", "sexo", "bloqueado", "motivo_bloqueio", "updated_at", "created_at")
                .where({ id: id })
                .whereNull("deleted_at")
                .first()
                .then(funcionario => res.status(200).json(funcionario))
                .catch((error) => {
                    utility_console("funcionario.getADM", error)
                    return res.status(500).send()
                });
            return
        }
        const sortColuns = {
            id: "id",
            nome: "nome",
            cpf: "cpf"
        }
        const orderColuns = {
            ASC: "ASC",
            asc: "ASC",
            DESC: "DESC",
            desc: "DESC",
        }
        const page = parseInt(req.query._page) ? parseInt(req.query._page) : 1;
        const limit = parseInt(req.query._limit) ? parseInt(req.query._limit) : 20;
        const sort = sortColuns[req.query._sort] ? sortColuns[req.query._sort] : 'id';
        const order = orderColuns[req.query._order] ? orderColuns[req.query._order] : 'ASC';
        const search = req.query._search ? req.query._search : null

        /* Se tiver setado texto para pesquisa executa LIKE */
        if (search) {
            const { totalPags } = await app.db("cadastro_usuarios")
                .whereRaw(simplify(search))
                .whereRaw('deleted_at IS NULL')
                .count({ totalPags: "*" })
                .first()
            const funcionarios = await app.db("cadastro_usuarios")
                .select("id", "nome", "cpf", "rg", "data_nasc", "email", "contato", "sexo", "bloqueado", "motivo_bloqueio", "updated_at", "created_at")
                .whereRaw(simplify(search))
                .whereRaw('deleted_at IS NULL')
                .limit(limit).offset(page * limit - limit)
                .orderBy(sort, order)

            return res.status(200).json({ data: funcionarios, totalPags: Math.ceil(totalPags / limit) })
        } else {
            const { totalPags } = await app.db("cadastro_usuarios")
                .count({ totalPags: "*" })
                .whereNull("deleted_at")
                .first()

            const funcionarios = await app.db("cadastro_usuarios")
                .select("id", "nome", "cpf", "rg", "data_nasc", "email", "contato", "sexo", "bloqueado", "motivo_bloqueio", "updated_at", "created_at")
                .whereNull("deleted_at")
                .limit(limit).offset(page * limit - limit)
                .orderBy(sort, order)

            return res.status(200).json({ data: funcionarios, totalPags: Math.ceil(totalPags / limit) })
        }
    };

    const saveADM = async (req, res) => {
        const id = req.params.id
        const redefinirSenha = req.query._defaltsenha ? req.query._defaltsenha : null;

        const modelo = {
            nome: req.body.nome,
            cpf: req.body.cpf,
            rg: req.body.rg,
            data_nasc: req.body.data_nasc,
            email: req.body.email,
            contato: req.body.contato,
            sexo: req.body.sexo,
            bloqueado: req.body.bloqueado,
            motivo_bloqueio: req.body.motivo_bloqueio,
        }

        try {
            await notExistOrErrorDB({ table: "cadastro_usuarios", column: 'email', data: modelo.email, id: id }, { email: "Já existe cadastro para o e-mail informado." })
        } catch (error) {
            return res.status(400).send(error)
        }

        if (id) {
            try {
                await existOrErrorDB({ table: "cadastro_usuarios", column: 'id', data: id }, "Registro não existe ou já foi excluído.")
            } catch (error) {
                return res.status(400).send(error)
            }

            /* REDEFINE SENHA PARA PADRAO sT123456 */
            if (redefinirSenha) {
                await app.db("cadastro_usuarios")
                    .update({
                        senha: "$2b$11$Gugk6YdJ/dOd1VSXBfSVXuD0fzdKdOTaeZpCRNe0DwMmtnoG5DG6u"
                    })
                    .where({ id: id })
                    .whereNull("deleted_at")
                    .then(() => res.status(204).send())
                    .catch((error) => {
                        utility_console("funcionario.saveADM.redefinirSenha", error)
                        return res.status(500).send()
                    });

                return
            }

            delete modelo.email
            await app.db("cadastro_usuarios")
                .update(modelo)
                .where({ id: id })
                .whereNull("deleted_at")
                .then(() => res.status(204).send())
                .catch((error) => {
                    utility_console("funcionario.saveADM.update", error)
                    return res.status(500).send()
                });
        } else {
            modelo.senha = "$2b$11$Gugk6YdJ/dOd1VSXBfSVXuD0fzdKdOTaeZpCRNe0DwMmtnoG5DG6u"  /* Senha padrão= sT123456 */
            await app.db.transaction(async trans => {
                const id_usuario = await trans.insert(modelo)
                    .table("cadastro_usuarios")
                    .returning('id')
                    .then((id) => id[0])

                await trans.raw(`
                INSERT INTO cadastro_pontos ( data, id_usuario )
                SELECT calendario.data, ${id_usuario} AS id_usuario
                FROM calendario;`)
            })
                .then(() => res.status(204).send())
                .catch((error) => {
                    utility_console("funcionario.saveADM.insert", error)
                    return res.status(500).send()
                });
        }
    }

    const deleteADM = async (req, res) => {
        const id = req.params.id

        try {
            existOrError(id, "[id] deve ser informado.")
            await existOrErrorDB({ table: "cadastro_usuarios", column: 'id', data: id }, "Registro não existe ou já foi excluído.")
        } catch (error) {
            return res.status(400).send(error)
        }

        const funcionarioDB = await app.db("cadastro_usuarios")
            .where({ id: id })
            .whereNull("deleted_at")
            .first()
        const modeloDelete = {
            email: `#[${id}]# - ${funcionarioDB.email}`,
            deleted_at: dataHoraAtual()
        }

        await app.db("cadastro_usuarios")
            .update(modeloDelete)
            .where({ id: id })
            .whereNull("deleted_at")
            .then(() => res.status(204).send())
            .catch((error) => {
                utility_console("funcionario.delete", error)
                return res.status(500).send()
            });
    }
    return { getADM, saveADM, deleteADM };
};
