module.exports = (app) => {
    const get = async (req, res) => {
        const store = app.store

        const modelo = {
            nome: store.nome,
            cpf: store.cpf,
            cnpj: store.cnpj,
            url_logo: store.url_logo,
            cep: store.cep,
            logradouro: store.logradouro,
            bairro: store.bairro,
            localidade: store.localidade,
            uf: store.uf,
        }

        return res.status(200).json(modelo)
    };

    return { get };
};

