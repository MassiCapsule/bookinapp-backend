var mongoose = require('mongoose');

var booksSchema = mongoose.Schema({
    title: { type: String, required: true },
    cover: { type: String, required: true },
    bookid: { type: String, required: true },
   });
   
var BooksModel = mongoose.model('books', booksSchema);

module.exports = BooksModel;