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
        console.log('open modal', $('.modal'))

        //clear form
        $('.modal_reserve_form_form')[0].reset()

        $('.modal').modal('open')
    })

    $('.modal_reserve_form_form').submit(e => {
        e.preventDefault()
        
        const data = {
            expirePeriod: $('select')[0].value,
            name: $('#name')[0].value,
            email: $('#email')[0].value
        }

        console.log(data)
    })

}

const initElements = () => {
    $('.books_collection').hide()
}

(function ($) {
    $('.modal').modal()
    $('select').formSelect()

    $(function () {

        const router = new Navigo('http://localhost:1337/')

        router
            .on('/books', (params, query) => {
                console.log('trigger books')
                const { search } = Qs.parse(query)

                console.log('query:', query)

                $('.search_input').show()

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
                $('.search_input').show()
            })
            .on('/books/:id', (params, query) => {
                const { id } = params

                $('.books_collection').hide()
                $('.search_input').hide()

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
