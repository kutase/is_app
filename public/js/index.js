const renderBooks = (books) => {
    if (books.length > 0) {
        const template = `
            <ul class="collection">
                <% books.forEach(book => { %>
                    <li class="collection-item avatar book_avatar">
                        <img src="<%=book.cover_url%>" alt="" class="book_image">
                        <span class="title book_title"><%=book.name%></span>
                        <p><%=book.author%></p>
                    </li>
                <% }) %>
            </ul>
        `

        const booksHtml = _.template(template)({ books })

        $('.books_collection').html(booksHtml)
    }
}

const initElements = () => {
    $('.books_collection').hide()
}

(function ($) {
    $(function () {

        const router = new Navigo('http://localhost:1337/')

        router
            .on('/books', (params, query) => {
                console.log('trigger books')
                const { search } = Qs.parse(query)

                console.log('query:', query)

                $('.books_collection').hide()
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
            })
            .resolve()

        $('#search_books_btn').click(() => {
            const search = document.getElementById('search_books_input').value

            console.info('search:', search)

            router.navigate(`/books?search=${search}`)
        })

        $('.sidenav').sidenav();

    }); // end of document ready
})(jQuery); // end of jQuery name space
