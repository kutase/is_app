const knex = require('knex')

let pg

const connect = () => {
    if (!pg) {
        pg = knex({
            client: 'pg',
            connection: {
                host: '127.0.0.1',
                user: 'postgres',
                password: '1',
                database: 'is_app'
            }
        })

        pg.on('query', query => console.info(`SQL QUERY: ${query.sql}; BINDINGS: ${JSON.stringify(query.bindings)}`))
    }

    return pg
}

const getConnection = () => {
    return pg
}


module.exports = {
    getConnection,
    connect
}
