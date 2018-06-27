const renderBooks = (books) => {
    if (books.length > 0) {
        const template = `
            <ul class="collection">
                <% books.forEach(book => { %>
                    <li class="collection-item avatar book_avatar" book_id="<%=book.id%>">
                        <img src="<%=book.cover_url%>" alt="" class="book_image">
                        <span class="title book_title"><%=book.name%></span>
                        <p class="author"><%=book.author%></p>
                        <p class="books_count">Доступно экземпляров: <%=book.count%></p>
                    </li>
                <% }) %>
            </ul>
        `

        const booksHtml = _.template(template)({ books })

        $('.books_collection').html(booksHtml)

        $('.books_collection .book_avatar').click(e => {
            const bookId = e.currentTarget.getAttribute('book_id')

            window.router.navigate(`/books/${bookId}`)
        })
    }
}

const renderCurrentBook = (book) => {
    const template = `
        <div class="card large">
            <div class="card-image book_current_image">
                <img src="<%=book.cover_url%>">
            </div>
            <div class="card-content">
                <span class="card-title"><%=book.name%></span>
                <p><%=book.description%></p>
            </div>
            <div class="card-action">
                <a href="" id="reserve_book">Зарезервировать книгу</a>
            </div>
        </div>
    `

    const bookHtml = _.template(template)({ book })

    $('.current_book').html(bookHtml)

    $('#reserve_book').click(e => {
        e.preventDefault()

        //clear form
        $('.modal_reserve_form_form')[0].reset()

        $('#modal_reserve_form').modal('open')
    })

    let canSubmit = true

    $('.modal_reserve_form_form').submit(e => {
        if (canSubmit) {
            canSubmit = false
            e.preventDefault()
            
            const data = {
                expirePeriod: $('select')[0].value,
                name: $('#name')[0].value,
                email: $('#email')[0].value
            }

            axios.put(`/api/books/${book.id}/reserve`, data)
                .then(resp => {
                    const { orderId } = resp.data

                    $('#modal_reserve_form').modal('close')

                    router.navigate(`/books/${book.id}/showOrderId/${orderId}`)

                    canSubmit = true
                })
                .catch(err => {
                    console.error('Error:', err)

                    $('#modal_reserve_form').modal('close')

                    if (err.response) {
                        const data = err.response.data

                        switch (data.message) {
                            case 'Customer already has this book':
                                M.toast({ html: `<span style="color: red;"><strong>Вы не можете взять больше одного экземпляра одной и той же книги</strong></span>` })
                                break

                            case 'Customer need to pay off the debt':
                                M.toast({ html: `<span style="color: red;"><strong>Вы не можете резервировать книги, пока не погасите задолженность</strong></span>` })
                                break

                            case 'Books is over':
                                M.toast({ html: `<span style="color: red;"><strong>К сожалению не осталось свободных экземпляров данной книги</strong></span>` })
                                break                    

                            default:
                                break
                        }
                    }

                    canSubmit = true
                })
        }
    })

}

const renderOrderId = (orderId) => {
    $('#modal_show_order_id_text').text(orderId)

    $('#modal_show_order_id').modal('open')
}

const initElements = () => {
    $('.books_collection').hide()
}

(function ($) {
    $('.modal').modal()
    $('select').formSelect()

    $("select[required]").css({ position: 'absolute', display: 'inline', height: 0, padding: 0, width: 0 })

    $('#get_order_btn').click(e => {
        e.preventDefault()

        $('.current_order').hide()
        $('.nothing').hide()
        $('.current_order').empty()

        const orderId = $('#search_order_input_el')[0].value

        axios.get(`/api/orders/${orderId}`)
            .then(resp => {
                const order = resp.data

                $('.current_order').html(`
                    <ul class="collection">
                        <li class="collection-item avatar book_avatar" order_id="${order.orderId}">
                            <img src="${order.book_cover_url}" alt="" class="book_image">
                            <span class="title book_title">Заказ №${order.orderId}</span>
                            <p class="book_title">${order.book_name}</p>
                            <p class="author">${order.book_author}</p>
                            <p>Заказал: ${order.customer_name}</p>
                            <p class="books_count">Доступно экземпляров: ${order.book_count}</p>
                            <button class="waves-effect waves-light btn red" id="close_book_order">Завершить заказ</button>
                        </li>
                    </ul>
                `)

                $('.current_order').show()

                let orderIsClosing = false

                $('#close_book_order').click(() => {
                    if (!orderIsClosing) {
                        orderIsClosing = true
                        if (window.confirm('Завершить заказ?')) {
                            axios.put(`/api/books/${order.book_id}/process_order/${order.orderId}`)
                                .then(resp => {
                                    orderIsClosing = false
                                    $('.current_order').empty()
                                    router.navigate('/admin/orders')
                                })
                                .catch(err => {
                                    console.error('Error:', err)
                                    orderIsClosing = false
                                })
                        } else {
                            orderIsClosing = false
                        }
                    }
                })
            })
            .catch(err => {
                console.error('Error:', err)
                
                if (err.response.status === 404) {
                    $('.nothing').show()
                }
            })
    })

    $(function () {

        const router = new Navigo('http://localhost:1337/')

        router
            .on('/books', (params, query) => {
                console.log('trigger books')
                const { search } = Qs.parse(query)

                console.log('query:', query)

                $('.search_input').show()

                $('#modal_show_order_id').modal('close')

                $('#admin_order_page').hide()
                $('.nothing').hide()

                $('.books_collection').hide()
                $('.current_book').hide()
                $('.books_collection').empty()
                
                axios.get(`/api/books?search=${encodeURIComponent(search)}`)
                    .then(resp => {
                        const books = resp.data

                        renderBooks(books)
                        $('.books_collection').show()

                        console.info('books', books)
                    })
                    .catch(err => {
                        console.error('Error:', err)
                    })
            })
            .on('/', () => {
                $('.books_collection').hide()
                $('.current_book').hide()
                $('.nothing').hide()
                $('.search_input').show()
                $('#admin_order_page').hide()
            })
            .on('/books/:id', (params, query) => {
                const { id } = params

                $('#modal_show_order_id').modal('close')

                $('.books_collection').hide()
                $('.search_input').hide()
                $('.nothing').hide()

                $('#admin_order_page').hide()

                $('.current_book').hide()
                $('.current_book').empty()

                axios.get(`/api/books/${id}`)
                    .then(resp => {
                        const book = resp.data

                        renderCurrentBook(book)
                        $('.current_book').show()

                        console.info('book', book)
                    })
                    .catch(err => {
                        console.error('Error:', err)
                    })
            })
            .on('/books/:id/showOrderId/:orderId', (params, query) => {
                const { id, orderId } = params

                $('#admin_order_page').hide()
                $('.nothing').hide()

                renderOrderId(orderId)
            })
            .on('/admin/orders', (params, query) => {
                $('#modal_show_order_id').modal('close')
                $('.books_collection').hide()
                $('.search_input').hide()
                $('.nothing').hide()
                $('.current_book').hide()
                $('#search_books_input').hide()

                $('#admin_order_page').show()
            })
            // .on('/admin/orders/:id', (params, query) => {
            //     const { id, orderId } = params

            //     $('#modal_show_order_id').modal('close')
            //     $('.books_collection').hide()
            //     $('.search_input').hide()
            //     $('.current_book').hide()
            //     $('#search_books_input').hide()

            //     $('#admin_order_page').show()
            // })
            .resolve()

        window.router = router

        $('#search_books_btn').click(() => {
            const search = document.getElementById('search_books_input').value

            console.info('search:', search)

            router.navigate(`/books?search=${search}`)
        })

        $('.sidenav').sidenav();

    }); // end of document ready
})(jQuery); // end of jQuery name space
