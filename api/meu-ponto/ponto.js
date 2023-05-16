const moment = require("moment")

module.exports = (app) => {
    const { existOrError, utility_console } = app.api.utilities;

    const get = async (req, res) => {
        const sortColuns = {
            id: "id",
            data: "data",
            entrada1: "entrada1",
            saida1: "saida1",
            entrada2: "entrada2",
            saida2: "saida2",
            dif_total: "dif_total",
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

        const dinicial = req.query._dinicial ? req.query._dinicial : null
        const dfinal = req.query._dfinal ? req.query._dfinal : null

        const pDiario = req.query._pdiario ? req.query._pdiario : null
        if (pDiario) {
            const dataHora = req.query._dthr ? req.query._dthr : null
            if (!dataHora) return res.status(400).send("Data e hora atual deve ser informado")

            await app.db("vw_cadastro_pontos")
                .select()
                .where({ id_usuario: req.usuario.id, data: dataHora })
                .first()
                .then((pDiario) => res.status(200).json(pDiario))
                .catch((error) => {
                    utility_console("ponto.get", error)
                    return res.status(500).send()
                })

            return
        }

        try {
            existOrError(dinicial, "Data inical deve ser informada.")
            existOrError(dfinal, "Data final deve ser informada.")
        } catch (error) {
            utility_console("ponto.get", error)
            return res.status(400).send(error)
        }

        try {
            const { totalPags } = await app.db("vw_cadastro_pontos")
                .where({ id_usuario: req.usuario.id })
                .count({ totalPags: "*" })
                .whereRaw(`DATE(data) BETWEEN '${dinicial}' AND '${dfinal}'`)
                .first()

            const pontos = await app.db("vw_cadastro_pontos")
                .select()
                .where({ id_usuario: req.usuario.id })
                .whereRaw(`DATE(data) BETWEEN '${dinicial}' AND '${dfinal}'`)
                .limit(limit).offset(page * limit - limit)
                .orderBy(sort, order)

            return res.status(200).json({ data: pontos, totalPags: Math.ceil(totalPags / limit) })
        } catch (error) {
            utility_console("ponto.get", error)
            return res.status(500).send()
        }
    };

    const registrarPonto = async (req, res) => {
        /* dispDataHr = data e hora do dispositivo que ta fazendo requição */
        const modelo = {
            dispDataHr: req.body.dispDataHr
        }
        try {
            existOrError(modelo.dispDataHr, `A data/hora atual deve ser informado.`)

            const dataAtualFormat = moment(modelo.dispDataHr).format('YYYY-MM-DD');
            const horaFormat = moment(modelo.dispDataHr).format('HH:mm:00') /* Segundos ta fixo 00 */

            /* Verifica se tem algum ponto em aberto. (se ponto_saida = null, significa que ta em aberto.) */
            const ponto = await app.db("vw_cadastro_pontos")
                .where({ id_usuario: req.usuario.id, data: dataAtualFormat })
                .first()

            existOrError(ponto, `Não foi encontrado ponto com a data atual: ${dataAtualFormat}`)

            if (!ponto.entrada1) {
                await app.db("cadastro_pontos")
                    .update({ entrada1: horaFormat })
                    .where({ id: ponto.id })
                    .then(() => res.status(204).send())
                    .catch((error) => {
                        utility_console("ponto.registrarPonto[1]", error)
                        return res.status(500).send()
                    });
            } else
                if (!ponto.saida1) {
                    await app.db("cadastro_pontos")
                        .update({ saida1: horaFormat })
                        .where({ id: ponto.id })
                        .then(() => res.status(204).send())
                        .catch((error) => {
                            utility_console("ponto.registrarPonto[2]", error)
                            return res.status(500).send()
                        });
                } else
                    if (!ponto.entrada2) {
                        await app.db("cadastro_pontos")
                            .update({ entrada2: horaFormat })
                            .where({ id: ponto.id })
                            .then(() => res.status(204).send())
                            .catch((error) => {
                                utility_console("ponto.registrarPonto[3]", error)
                                return res.status(500).send()
                            });
                    } else
                        if (!ponto.saida2) {
                            await app.db("cadastro_pontos")
                                .update({ saida2: horaFormat })
                                .where({ id: ponto.id })
                                .then(() => res.status(204).send())
                                .catch((error) => {
                                    utility_console("ponto.registrarPonto[4]", error)
                                    return res.status(500).send()
                                });
                        } else {
                            existOrError(false, `O registro do ponto já foi finalizado.`)
                        }
        } catch (error) {
            return res.status(400).send(error)
        }
    };

    const getADM = async (req, res) => {
        const id = req.params.id
        const isPDF = req.query._pdf ? req.query._pdf : null;

        /* GET BY ID */
        if (id) {
            await app.db("vw_cadastro_pontos")
                .select("vw_cadastro_pontos.*", "cadastro_usuarios.nome")
                .join('cadastro_usuarios', 'vw_cadastro_pontos.id_usuario', '=', 'cadastro_usuarios.id')
                .where({ "vw_cadastro_pontos.id": id })
                .first()
                .then(ponto => res.status(200).json(ponto))
                .catch((error) => {
                    utility_console("ponto.getADMB", error)
                    return res.status(500).send()
                });
            return
        }

        /* GET PARA GERAR PDF */
        if (isPDF) {
            const mes = req.query._mes ? req.query._mes : null;
            const funcionario = req.query._funcionario ? req.query._funcionario : null;

            existOrError(mes, { mes: "Mês deve ser informada." })
            existOrError(funcionario && funcionario != 'Selecione', { funcionario: "Funcionário deve ser informada." })
            const yyyy = mes.slice(0, 4);
            const mm = mes.slice(5, 7);

            const tbody = await app.db("vw_cadastro_pontos")
                .select()
                .whereRaw(`YEAR(data) = '${yyyy}' AND MONTH(data) = '${mm}' AND id_usuario = ${funcionario}`)
                .orderBy("data", "asc")

            const tfoot = await app.db.raw(`SELECT 
        SEC_TO_TIME(SUM(TIME_TO_SEC(IF(dif_total IS NULL, '00:00', dif_total)))) AS banco_horas,
        SEC_TO_TIME(SUM(TIME_TO_SEC(IF(acrescentar_hrs IS NULL, '00:00', acrescentar_hrs)))) AS banco_add,
        SEC_TO_TIME(SUM(TIME_TO_SEC(IF(subtrair_hrs IS NULL, '00:00', subtrair_hrs)))) AS banco_subtrair
        FROM vw_cadastro_pontos WHERE 
        YEAR(data) = '${yyyy}' AND MONTH(data) = '${mm}' AND id_usuario = ${funcionario}
    `)

            const funcionarios = await app.db("cadastro_usuarios")
                .select(app.db.raw('CONCAT(nome," (Cód. ", id,")") as "nome"'))
                .where({ id: funcionario })
                .first()

            const thead = {
                funcionario: funcionarios.nome,
                mes: `${mm}/${yyyy}`
            }

            return res.status(200).json({ thead, tbody, tfoot: tfoot[0][0] })
        }

        const sortColuns = {
            id: "id",
            data: "data",
            entrada1: "entrada1",
            saida1: "saida1",
            entrada2: "entrada2",
            saida2: "saida2",
            dif_total: "dif_total",
            nome: "nome",
            e1_s1: "e1_s1",
            e2_s2: "e2_s2",
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

        const dinicial = req.query._dinicial ? req.query._dinicial : null;
        const dfinal = req.query._dfinal ? req.query._dfinal : null;
        const funcionario = req.query._funcionario && req.query._funcionario != 'Selecione' ? `AND id_usuario = ${req.query._funcionario}` : "";

        existOrError(dinicial, "Data inical deve ser informada.")
        existOrError(dfinal, "Data final deve ser informada.")

        const { totalPags } = await app.db("vw_cadastro_pontos")
            .join('cadastro_usuarios', 'vw_cadastro_pontos.id_usuario', '=', 'cadastro_usuarios.id')
            .count({ totalPags: "*" })
            .whereRaw(`DATE(data) BETWEEN '${dinicial}' AND '${dfinal}' ${funcionario} AND deleted_at IS NULL AND bloqueado = 'Não'`)
            .first()

        const pontos = await app.db("vw_cadastro_pontos")
            .select("vw_cadastro_pontos.*", "cadastro_usuarios.nome")
            .join('cadastro_usuarios', 'vw_cadastro_pontos.id_usuario', '=', 'cadastro_usuarios.id')
            .whereRaw(`DATE(data) BETWEEN '${dinicial}' AND '${dfinal}' ${funcionario} AND deleted_at IS NULL AND bloqueado = 'Não'`)
            .limit(limit).offset(page * limit - limit)
            .orderBy(sort, order)

        /* No primeiro carregamento é arregado os usuarios  */
        const getUsuarios = req.query._getusuarios ? req.query._getusuarios : null;
        if (getUsuarios) {
            const usuarios = await app.db("cadastro_usuarios")
                .select("id as value", app.db.raw('CONCAT(nome," (Cód. ", id,")") as "name"'))
                .where({ bloqueado: "Não" })
                .whereNull("deleted_at")

            return res.status(200).json({ pontos, totalPags: Math.ceil(totalPags / limit), usuarios })
        } else {
            return res.status(200).json({ pontos, totalPags: Math.ceil(totalPags / limit) })
        }
    }

    const saveADM = async (req, res) => {
        const id = req.params.id
        const modelo = {
            entrada1: req.body.entrada1 ? req.body.entrada1 : null,
            saida1: req.body.saida1 ? req.body.saida1 : null,
            entrada2: req.body.entrada2 ? req.body.entrada2 : null,
            saida2: req.body.saida2 ? req.body.saida2 : null,
            acrescentar_hrs: req.body.acrescentar_hrs ? req.body.acrescentar_hrs : null,
            subtrair_hrs: req.body.subtrair_hrs ? req.body.subtrair_hrs : null,
            obs: req.body.obs ? req.body.obs : null
        }

        try {
            existOrError(id, "[id] deve ser informado.")
        } catch (error) {
            return res.status(400).send(error)
        }

        const ponto = await app.db("vw_cadastro_pontos")
            .select("vw_cadastro_pontos.*", "cadastro_usuarios.nome")
            .join('cadastro_usuarios', 'vw_cadastro_pontos.id_usuario', '=', 'cadastro_usuarios.id')
            .where({ "vw_cadastro_pontos.id": id })
            .first()

        try {
            existOrError(ponto, "Registro não existe ou já foi excluído.")
        } catch (error) {
            return res.status(400).send(error)
        }


        const modelo_edit = {
            id_ponto: id,
            entrada1_new: req.body.entrada1,
            saida1_new: req.body.saida1,
            entrada2_new: req.body.entrada2,
            saida2_new: req.body.saida2,
            acrescentar_hrs_new: req.body.acrescentar_hrs,
            subtrair_hrs_new: req.body.subtrair_hrs,
            obs_new: req.body.obs,

            entrada1_old: ponto.entrada1,
            saida1_old: ponto.saida1,
            entrada2_old: ponto.entrada2,
            saida2_old: ponto.saida2,
            acrescentar_hrs_old: ponto.acrescentar_hrs,
            subtrair_hrs_old: ponto.subtrair_hrs,
            obs_old: ponto.obs,

            msg_solicitacao: req.body.msg_solicitacao,
            adm_id: req.usuario.id,
            adm_nome: req.usuario.nome,
        }

        await app.db("edit_pontos")
            .insert(modelo_edit)

        await app.db("cadastro_pontos")
            .update(modelo)
            .where({ id: id })
            .then(() => res.status(204).send())
            .catch((error) => {
                utility_console("ponto.saveADM", error)
                return res.status(500).send()
            });
    }

    return { get, registrarPonto, getADM, saveADM };
};
