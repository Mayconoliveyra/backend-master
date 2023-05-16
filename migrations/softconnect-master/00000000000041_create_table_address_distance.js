exports.up = function (knex) {
    return knex.schema.createTable("address_distance", table => {
        table.increments("id").primary()
        table.string('id_cep_origem', 9).notNull().references('cep').inTable('address')
        table.string('id_cep_destino', 9).notNull().references('cep').inTable('address')

        table.float("distancia_km", 8, 1).notNull().defaultTo(0)
        table.float("tempo", 8, 1).notNull().defaultTo(0)

        table.boolean("api_maps", 1).notNull().defaultTo(0)

        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp("updated_at").defaultTo(knex.raw("NULL ON UPDATE CURRENT_TIMESTAMP"));
    })
};

exports.down = function (knex) {
    return knex.schema.dropTable("address_distance")
};
