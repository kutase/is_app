const express = require('express')
const http = require('http')
const asyncHandler = require('express-async-handler')
const moment = require('moment')

const migrate = require('./migrate')
const { connect, getConnection } = require('./database')

migrate()
    .then(() => {
        connect()
    })

const app = express()

app.set('port', 1337)

app.get('/books', asyncHandler(async (req, res) => {
    const pg = getConnection()
    const { search = '' } = req.query

    const books = await pg
        .select('*')
        .from('books')
        .where('name', 'ilike', `%${search}%`)
        .limit(10)

    res.json(books)
}))

app.get('/books/:id', asyncHandler(async (req, res) => {
    const pg = getConnection()
    const { id } = req.params

    const books = await pg
        .select('*')
        .from('books')
        .where('id', id)
        .limit(1)

    if (books.length === 0) {
        return res.status(404).end()
    }

    return res.json(books[0])
}))

// пользователь резервирует книгу
app.put('/books/:id/reserve', asyncHandler(async (req, res) => {
    const pg = getConnection()
    const { id } = req.params

    const { name, email, expirePeriod } = req.body

    const books = await pg
        .select('*')
        .from('books')
        .where('id', id)
        .limit(1)

    if (books.length === 0) {
        return res.status(404).end()
    }

    if (!name || !email || !expireDate) {
        return res.status(403).end()
    }

    const book = books[0]

    if (book.count === 0) {
        return res.status(403).json({
            message: 'Books is over'
        })
    }

    const customers = await pg
        .select('*')
        .from('customers')
        .where('email', email)
        .limit(1)

    let customer

    if (customers.length === 0) {
        customer = await pg('customers')
            .insert({
                name,
                email
            })
            .returning('*')
    } else {
        customer = customers[0]
    }

    const orders = await pg
        .select('*')
        .from('book_orders')
        .where('customer_id', customer.id)

    let customerCanMakeOrder = true

    for (let order of orders) {
        if (moment(order.expires_at).isAfter(moment(order.created_at))) {
            customerCanMakeOrder = false
            break
        }
    }

    if (!customerCanMakeOrder) {
        return res.status(403).json({
            message: 'Customer need to pay off the debt'
        })
    }

    const bookOrder = await pg('book_orders')
        .insert({
            book_id: book.id,
            customer_id: customer.id,
            expires_at: moment().add(expirePeriod, 'days')
        })
        .returning('*')

    return res.json({
        orderId: bookOrder.id
    })
}))

// сотрудник библиотеки делает при выдаче книги
app.put('/books/:id/process_order/:orderId', asyncHandler(async (req, res) => {
    const pg = getConnection()
    const { id, orderId } = req.params

    const books = await pg
        .select('*')
        .from('books')
        .where('id', id)
        .limit(1)

    if (books.length === 0) {
        return res.status(404).end()
    }

    const book = books[0]

    const orders = await pg
        .select('*')
        .from('book_orders')
        .where('id', orderId)
        .limit(1)

    if (orders.length === 0) {
        return res.status(404).end()
    }

    const order = orders[0]

    if (order.is_done) {
        return res.status(403).json({
            message: 'Order is already finished!'
        })
    }

    const updatedOrder = await pg('book_orders')
        .where('id', order.id)
        .update({
            is_done: true
        })

    await pg('books')
        .where('id', book.id)
        .update({
            count: book.count - 1
        })

    return res.json(updatedOrder)
}))

http.createServer(app)
    .listen(app.get('port'), () => {
        console.info(`Listening on port: ${app.get('port')}`)
    })