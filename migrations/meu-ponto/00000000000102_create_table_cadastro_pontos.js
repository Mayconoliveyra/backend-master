exports.up = function (knex) {
    return knex.schema
        .createTable("cadastro_pontos", (table) => {
            table.increments("id").primary();
            table.integer('id_usuario').unsigned().notNull().references('id').inTable('cadastro_usuarios')

            table.date('data').notNull().references('data').inTable('calendario')
            table.time('entrada1').nullable()
            table.time('saida1').nullable()
            table.time('entrada2').nullable()
            table.time('saida2').nullable()

            table.time('acrescentar_hrs').nullable()
            table.time('subtrair_hrs').nullable()

            table.enu("obs", [null, "Atestado", "Falta", "Folga", "Feriado", "Compensado", "DSR"])
        })
};

exports.down = function (knex) {
    return knex.schema.dropTable("cadastro_pontos");
};
