exports.up = function (knex) {
    return knex.schema
        .createTable("cadastro_empresas", (table) => {
            table.increments("id").primary();

            table.string("nome").notNull();
            table.string("cpf", 14).notNull().defaultTo("000.000.000-00");
            table.string("cnpj", 18).notNull().defaultTo("00.000.000/0000-00");

            table.string("cep", 9).notNull();
            table.string("logradouro").notNull();
            table.string("bairro").notNull();
            table.string("localidade").notNull();
            table.string("uf", 2).notNull();
            table.string("numero").notNull();


            table.string("resp_nome").notNull().defaultTo("Não informado");
            table.string("resp_contato", 15);

            table.string("email_user")
            table.string("email_pass")
            table.string("email_host")
            table.string("email_port")
            table.boolean("email_secure", 1).notNull().defaultTo(false);

            table.string("client_id").notNull().unique();
            table.string("client_secret").notNull().unique();
            table.enu("client_app", ["softconnect-master", "meu-ponto", "ta-na-mao"]).notNull()
            table.string("client_database").notNull().unique();

            table.timestamp('created_at').defaultTo(knex.fn.now())
            table.timestamp("updated_at").defaultTo(knex.raw("NULL ON UPDATE CURRENT_TIMESTAMP"));
            table.timestamp("deleted_at").nullable();
        })
        .then(function () {
            return knex("cadastro_empresas").insert([
                {
                    id: 1,
                    nome: "Softconnect",
                    cpf: "116.751.744-07",
                    cep: "58046-520",
                    logradouro: "Rua Empresário Paulo Miranda d' Oliveira",
                    bairro: "Portal do Sol",
                    localidade: "João Pessoa",
                    uf: "PB",
                    numero: "S/N",

                    client_id: "Softconnect",
                    client_secret: "Softconnect",
                    client_app: "softconnect-master",
                    client_database: "softconnect",
                },
                {
                    id: 2,
                    nome: "Cazimi",
                    cnpj: "32.550.788/0001-04",
                    cep: "58046-520",
                    logradouro: "Rua Empresário Paulo Miranda d' Oliveira",
                    bairro: "Portal do Sol",
                    localidade: "João Pessoa",
                    uf: "PB",
                    numero: "S/N",

                    email_user: "softconnectecnologia",
                    email_pass: "rtrbfimmlovhoapd",
                    email_host: "smtp.gmail.com",
                    email_port: "587",
                    email_secure: false,

                    client_id: "H7eH2CuTNjdKUaHsc2aE93tXsNcT94",
                    client_secret: "JLT8LqVeKHHXxrJXiutm6pVxR3eyJS",
                    client_app: "meu-ponto",
                    client_database: "meu-ponto-cazimi",
                },
            ]);
        });
};

exports.down = function (knex) {
    return knex.schema.dropTable("cadastro_empresas");
};
