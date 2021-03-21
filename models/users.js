var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    token: String,
    email: String,
    password: String,
    libraryName: String,
    wishlist: [{type:mongoose.Schema.Types.ObjectId, ref:'books'}],
   });
   
var UsersModel = mongoose.model('users', userSchema);

module.exports = UsersModel;