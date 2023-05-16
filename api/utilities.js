const CryptoJS = require("crypto-js");

/* Não pode ser alterada se já foi utilizada, poís, vai dar erro para descriptografar */
const SECRET_ENCRYPT = "6vUFBdd3EchhdacEzUpEJ4bVDGoEmBSz2dALGka8";

module.exports = (app) => {
    const msgErrorDefault = "Não foi possível realizar a operação!. Por favor, atualize a página e tente novamente.";

    function existOrError(value, msg) {
        if (!value) throw msg;
        if (Array.isArray(value) && value.length === 0) throw msg;
        if (typeof value === "string" && !value.trim()) throw msg;
    }

    function notExistOrError(value, msg) {
        try {
            existOrError(value, msg);
        } catch (msg) {
            return;
        }
        throw msg;
    }

    async function notExistOrErrorDB({ table, column, data, id }, msg) {
        const dataDB = await app.db.raw(`
        SELECT * FROM 
        ${table} 
        WHERE ${column} = '${data}' 
        AND id != '${id}'`)

        notExistOrError(dataDB[0], msg)
        return
    }

    const existOrErrorDB = async ({ table, column, data }, msg) => {
        const dataDB = await app.db.raw(`
            SELECT * FROM 
            ${table} 
            WHERE ${column} = '${data}' 
            AND deleted_at IS NULL`)

        existOrError(dataDB[0], msg)
        return
    }

    function encrypt(texto) {
        const encryptText = CryptoJS.AES.encrypt(
            texto,
            SECRET_ENCRYPT
        ).toString();
        return encryptText;
    }
    function decrypt(texto) {
        const bytes = CryptoJS.AES.decrypt(texto, SECRET_ENCRYPT);
        const decryptText = bytes.toString(CryptoJS.enc.Utf8);
        return decryptText;
    }
    function validateContact(telefone) {
        //retira todos os caracteres menos os numeros
        telefone = telefone.replace(/\D/g, "");

        //verifica se tem a qtde de numero correto
        if (!telefone.length == 11) return false;

        //verificar se começa com 9 o contato
        if (parseInt(telefone.substring(2, 3)) != 9) return false;

        //verifica se não é nenhum numero digitado errado (propositalmente)
        for (var n = 0; n < 10; n++) {
            //um for de 0 a 9.
            //estou utilizando o metodo Array(q+1).join(n) onde "q" é a quantidade e n é o
            //caractere a ser repetido
            if (
                telefone == new Array(11).join(n) ||
                telefone == new Array(12).join(n)
            )
                return false;
        }
        //DDDs validos
        const codigosDDD = [
            11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33,
            34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55,
            61, 62, 64, 63, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82,
            83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
        ];
        //verifica se o DDD é valido (sim, da pra verificar rsrsrs)
        if (codigosDDD.indexOf(parseInt(telefone.substring(0, 2))) == -1)
            return false;

        //se passar por todas as validações acima, então está tudo certo
        return true
    }
    function validateCPF(cpf) {
        /* https://devarthur.com/javascript/funcao-javascript-para-validar-cpf */
        var Soma = 0
        var Resto

        var strCPF = String(cpf).replace(/[^\d]/g, '')

        if (strCPF.length !== 11)
            return false

        if ([
            '00000000000',
            '11111111111',
            '22222222222',
            '33333333333',
            '44444444444',
            '55555555555',
            '66666666666',
            '77777777777',
            '88888888888',
            '99999999999',
        ].indexOf(strCPF) !== -1)
            return false

        for (i = 1; i <= 9; i++)
            Soma = Soma + parseInt(strCPF.substring(i - 1, i)) * (11 - i);

        Resto = (Soma * 10) % 11

        if ((Resto == 10) || (Resto == 11))
            Resto = 0

        if (Resto != parseInt(strCPF.substring(9, 10)))
            return false

        Soma = 0

        for (i = 1; i <= 10; i++)
            Soma = Soma + parseInt(strCPF.substring(i - 1, i)) * (12 - i)

        Resto = (Soma * 10) % 11

        if ((Resto == 10) || (Resto == 11))
            Resto = 0

        if (Resto != parseInt(strCPF.substring(10, 11)))
            return false

        return true
    }
    function utility_console(name = null, error = null, saveDB = true) {
        console.log("########################################")
        console.log(`Function: ${name}`);
        console.log(JSON.stringify(error));
        console.log("########################################")
        /* Salva no banco de dados */
        if (saveDB) {
            const moodelo = {
                id_store: app.store.id,
                name: name,
                error: JSON.stringify(error),
            };

            app.st
                .insert(moodelo)
                .table("_error_backend")
                .then()
                .catch((error) =>
                    console.log("Utility_console: " + error)
                );
        }
    }
    function dataHoraAtual() {
        const date = new Date();
        return date;
    }
    return {
        existOrError,
        notExistOrError,
        notExistOrErrorDB,
        existOrErrorDB,
        encrypt,
        decrypt,
        validateContact,
        validateCPF,
        utility_console,
        dataHoraAtual,
        msgErrorDefault,
    };
};
