exports.up = function (knex) {
    return knex.schema.createTable("address", table => {
        table.increments("id").primary()

        table.string("cep", 9).notNull().unique()
        table.string("logradouro")
        table.string("bairro")
        table.string("localidade")
        table.string("uf")

        table.boolean("api_via", 1).notNull().defaultTo(0)

        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp("updated_at").defaultTo(knex.raw("NULL ON UPDATE CURRENT_TIMESTAMP"));
    })
};

exports.down = function (knex) {
    return knex.schema.dropTable("address")
};
