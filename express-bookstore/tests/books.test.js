process.env.NODE_ENV = "test"
const request = require("supertest");
const { response } = require("../app");
const app = require("../app");
const db = require("../db");

let book_isbn;

beforeEach(async () => {
    let result = await db.query(`
    INSERT INTO books (
        isbn,
        amazon_url,
        author,
        language,
        pages,
        publisher,
        title,
        year) 
        VALUES(
            '0691161518', 'http://a.co/eobPtX2', 'danieltest', 'English', 420,  'Nothing publishers', 'testbook', 2021) 
          RETURNING isbn`);

    book_isbn = result.rows[0].isbn;
})

afterEach(async () => {
    await db.query(`DELETE FROM books`);
})

describe("get request for /books", async () => {
    test("get all books", async () => {
        const res = await request(app).get("/books");
        const books = res.body.books;
        expect(books).toHaveLength(1);
        expect(books[0]).toHaveProperty("isbn");
    });
})



describe("get request for /book/:id", async () => {
    test("get one specific book", async () => {
        const res = await request(app).get("/books/0691161518");
        const book = res.body.book;
        expect(book).toHaveProperty("isbn", "0691161518");
        expect(book).toHaveProperty("pages");
    });

    test("respond with 404 if isbn doesn't exist", async () => {
        const res = await request(app).get("/books/12345566");
        const status = res.statusCode;
        expect(res.text).toMatch("There is no book with");
        expect(status).toBe(404);
    })
})

describe("post request for /books", async () => {
    test("post a new book", async () => {
        const res = await request(app).post("/books").send({
            "isbn": "999999999",
            "amazon_url": "http://a.co/eobPtX2",
            "author": "daniel",
            "language": "english",
            "pages": 69,
            "publisher": "publishing house",
            "title": "daniel's book",
            "year": 2010
        });
        const book = res.body.book;
        expect(book).toHaveProperty("pages", 69);
        expect(book).toHaveProperty("isbn", "999999999");
    });


    test("test incorrect schema", async () => {
        const res = await request(app).post("/books").send({
            "isbn": "7777777",
            "amazon_url": "http://a.co/eobPtX2",
            "author": "kimkim",
            "language": "Spanish",
            "pages": "44444",
            "publisher": "publishing house",
            "title": "kimkim's book",
            "year": 2010
        });
        expect(res.text).toMatch("pages is not of a type");
        expect(res.status).toBe(400);
    })
})

describe("PUT request for /books/:isbn", async () => {
    test("updating a book's isbn", async () => {
        const testisbn = "0691161518"
        const res = await request(app).put(`/books/${testisbn}`).send({
            "isbn": testisbn,
            "amazon_url": "http://a.co/eobPtX2",
            "author": "kimkim",
            "language": "Spanish",
            "pages": 44444,
            "publisher": "publishing house",
            "title": "kimkim's book",
            "year": 2010
        })

        const book = res.body.book
        expect(book).toHaveProperty("isbn", testisbn);
        expect(book).toHaveProperty("language", "Spanish");
        expect(book).toHaveProperty("pages", 44444);
    })

    test("isbn not in DB", async () => {
        const testisbn = "00000000"
        const res = await request(app).put(`/books/${testisbn}`).send({
            "isbn": testisbn,
            "amazon_url": "http://a.co/eobPtX2",
            "author": "kimkim",
            "language": "Spanish",
            "pages": 44444,
            "publisher": "publishing house",
            "title": "kimkim's book",
            "year": 2010
        })
        expect(res.status).toBe(404);
        expect(res.text).toMatch("is no book with an");
    })
})

describe("delete requst for /book/:isbn", async () => {
    test("delete book from db by isbn", async () => {
        const testisbn = "0691161518"
        const res = await request(app).delete(`/books/${testisbn}`);
        expect(res.body.message).toMatch("Book deleted")
        expect(res.statusCode).toBe(200)
    })
})