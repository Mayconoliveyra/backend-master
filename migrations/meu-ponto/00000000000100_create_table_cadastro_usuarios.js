exports.up = function (knex) {
    return knex.schema
        .createTable("cadastro_usuarios", (table) => {
            table.increments("id").primary();

            table.string("nome").notNull()
            table.string("cpf", 14)
            table.string("rg", 12)
            table.string("data_nasc", 10)

            table.string("email").notNull().unique()
            table.string("senha")
            table.string("contato", 15)
            table.enu("sexo", ["Selecione", "Masculino", "Feminino"]).notNull().defaultTo('Selecione')

            table.enu("bloqueado", ["Sim", "Não"]).notNull().defaultTo('Não')
            table.string("motivo_bloqueio")

            table.boolean("adm", 1).notNull().defaultTo(0)

            table.timestamp("updated_at").defaultTo(knex.raw("NULL ON UPDATE CURRENT_TIMESTAMP"));
            table.timestamp('created_at').defaultTo(knex.fn.now())
            table.timestamp("deleted_at").nullable();
        })
        .then(function () {
            return knex("cadastro_usuarios").insert([
                {
                    nome: "Maycon Deyvid Brito de Oliveira",
                    email: "dev@softconnect.com",
                    senha: "$2b$11$Gugk6YdJ/dOd1VSXBfSVXuD0fzdKdOTaeZpCRNe0DwMmtnoG5DG6u",
                    adm: true
                }
            ])
        })
};

exports.down = function (knex) {
    return knex.schema.dropTable("cadastro_usuarios");
};
