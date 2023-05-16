exports.up = function (knex) {
    return knex.schema
        .createTable("edit_pontos", (table) => {
            table.increments("id").primary();

            table.integer('id_ponto').unsigned().notNull().references('id').inTable('cadastro_pontos')

            table.time('entrada1_new').nullable()
            table.time('saida1_new').nullable()
            table.time('entrada2_new').nullable()
            table.time('saida2_new').nullable()
            table.time('acrescentar_hrs_new').nullable()
            table.time('subtrair_hrs_new').nullable()
            table.string("obs_new")

            table.time('entrada1_old').nullable()
            table.time('saida1_old').nullable()
            table.time('entrada2_old').nullable()
            table.time('saida2_old').nullable()
            table.time('acrescentar_hrs_old').nullable()
            table.time('subtrair_hrs_old').nullable()
            table.string("obs_old")

            table.string("msg_solicitacao")

            table.integer("adm_id");
            table.string("adm_nome");

            table.timestamp("updated_at").defaultTo(knex.raw("NULL ON UPDATE CURRENT_TIMESTAMP"));
            table.timestamp('created_at').defaultTo(knex.fn.now())
        })
};

exports.down = function (knex) {
    return knex.schema.dropTable("edit_pontos");
};
