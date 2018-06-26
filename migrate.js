const fs = require('fs-extra')
const { Client } = require('pg')

const create_db_client = new Client({
    host: '127.0.0.1',
    user: 'postgres',
    password: '1',
    database: 'postgres'
})

const migration_client = new Client({
    host: '127.0.0.1',
    user: 'postgres',
    password: '1',
    database: 'is_app'
})

const migrate = async () => {
    try {
        const create_db_migration = await fs.readFile('./migrations/create_database.sql', { encoding: 'utf8' })
        const create_schema_migration = await fs.readFile('./migrations/create_schema.sql', { encoding: 'utf8' })

        await create_db_client.connect()
        await create_db_client.query(create_db_migration)
        await create_db_client.end()

        await migration_client.connect()
        await migration_client.query(create_schema_migration)
        await migration_client.end()
    } catch (err) {
        console.error('Migration Error: ', err)
    }

    console.info('Migration compeleted!')
}

module.exports = migrate
