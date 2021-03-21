var express = require('express');
var router = express.Router();
const uid2 = require('uid2');
var bcrypt = require('bcrypt');

// Import des models de la BDD
const UsersModel = require('../models/users');
const BooksModel = require('../models/books')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


/* --------------------------------------------------------------------------------------------------- */


/* POST : Signup */
router.post('/sign-up', async function (req, res, next) {
  /* Vérification que l'email n'est pas déjà en BDD */
  const checkExistingUserFromEmail = await UsersModel.findOne({
    email: req.body.email
  });

  /* Si Email déjà en BDD */
  if (checkExistingUserFromEmail) {
    res.json({result: false, message: "Il existe déjà un compte associé à cet email. Vous pouvez y accéder en vous connectant."})
  }

  /* Si tous les champs sont complétés, on appelle la fonction de sauvegarde en BDD */
  if (!req.body.libraryName || !req.body.email || !req.body.password) {
    res.json({result: false, message: "Veuillez remplir tous les champs pour créer un compte."})
  } else {
    const userSave = await saveNewUser(req);
    const userToken = userSave.token;
    res.json({result:true, userToken});
    }
});
  
/* Sauvegarde des infos en BDD avec génération d'un token et cryptage du mot de passe */
  async function saveNewUser(req) {
    const cost = 10;
    const hash = bcrypt.hashSync(req.body.password, cost);
    
    const user = new UsersModel({
      libraryName: req.body.libraryName,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
      token: uid2(32),
    });
    
  const userSave = await user.save();
  return userSave;
}


/* --------------------------------------------------------------------------------------------------- */


/* POST : SignIn */
router.post('/sign-in', async function(req, res, next) {

  /* Check que les champs sont bien complétés */
  if(req.body.signInEmail == ''|| req.body.signInPassword == '') {
    res.json({login: false, message: "Veuillez remplir tous les champs pour accéder à votre compte."})
  
  /* Si champs complétés, on vérifie que le compte exite + compare le mot de passe */
  } else {
    const user = await UsersModel.findOne({email: req.body.signInEmail});
    const password = req.body.signInPassword;

    if (user) {
      const userToken = user.token;
      if (bcrypt.compareSync(password, user.password)) {res.json({ login: true, userToken});}

    } else { 
    res.json({login: false, message: "Nous ne trouvons pas de compte associé à cet email et ce mot de passe, veuillez réessayer ou créer un compte." }); }
  }});


  /* --------------------------------------------------------------------------------------------------- */

  
  /* POST : Ajouter un livre à la wishList d'un utilisateur */
  router.post('/addtowishlist', async function(req, res, next) {
    let token = req.body.token;

      /* On vérifie si le livre existe déjà dans la collection Books */
      var bookToCheck = await BooksModel.findOne({
        bookid: req.body.bookid
      });

      /* Si le livre n'exite pas, alors on le créé et on l'enregiste en BDD */
      if (bookToCheck === null) {
        var newBook = new BooksModel({
          title : req.body.title,
          cover : req.body.cover,
          bookid : req.body.bookid,
        })
          
        var bookSave = await newBook.save()

        /* On recherche le user */
        var userCheck = await UsersModel.findOne({
          token: req.body.token
        });
    
        /* On vérifie si le livre n'est pas déjà présent dans la wishlist de l'utilisateur */
        var userCheckTab = [];
          for (let i = 0; i < userCheck.wishlist.length; i++) {
            if (JSON.stringify(userCheck.wishlist[i]) === JSON.stringify(bookSave._id)) {
              userCheckTab.push(userCheck)
            }
          }

        /* Si le livre n'est pas présent dans la wishlit, on l'ajoute */
        if (userCheckTab.length === 0) { 
          var user = await UsersModel.findOneAndUpdate({token: req.body.token},
            { $push: {wishlist: bookSave._id}});
            res.json({ result: true, message: "Livre n'est pas dans la wishlist" });

        } else {res.json({ result: false, message: "Livre déjà dans votre wishlist" });}
    
      /* Si le livre existe déjà dans la BDD, on recherche le user */
      } else {
        var userCheck2 = await UsersModel.findOne({token: req.body.token});

          /* On vérifie que le livre n'est pas dans sa wishList */
          var userCheckTab2 = [];
            for (let i = 0; i < userCheck2.wishlist.length; i++) {
              if (JSON.stringify(userCheck2.wishlist[i]) === JSON.stringify(bookToCheck._id)) {
              userCheckTab2.push(userCheck2)
              }
            }

              /* Si le livre n'est pas dans la wishList, on l'ajoute */
              if (userCheckTab2.length === 0) {
              var user2 = await UsersModel.findOneAndUpdate({token: token},
                { $push: {wishlist: bookToCheck._id}});
              } 
              else {res.json({ result: false, message: "Livre déjà dans votre wishlist" });}
      }
    
    res.json({result:true, message:"Tout s'est bien passé"})
  })


/*--------------------------------------------------------------------------------------------------- */


/* POST : Récupérer la wishList de l'utilisateur */
router.post('/getwishlist', async (req, res, next) => {

    /* On recherche le user via son token et on populate sa wishlist des ID des books */
    const user = await UsersModel.findOne({token: req.body.token}).populate('wishlist').exec()
    
    /* On cible la wishList du user */
    var userWishlist = user.wishlist;
    console.log('userWishlist', userWishlist);

  res.json({result: true, wishlist: userWishlist})
});


/*--------------------------------------------------------------------------------------------------- */


/* POST : Rechercher si ID du livre est dans la WishList pour mettre à jour l'état Like */
router.post('/checkwishlist', async (req, res, next) => {
  var token = req.body.token;
  var bookidFF = req.body.bookid;

  /* On recherche le livre dans la collection book */
  var bookToCheck = await BooksModel.findOne({
    bookid: bookidFF
  });

  /* Si le livre est présent en BDD */
  if (bookToCheck !== null) {
    var bookToCheckID = bookToCheck._id;
    
    /* On recherche le livre dans la wishlist de l'utilisateur */
    var userCheck = await UsersModel.findOne({token: token, wishlist: bookToCheckID})
      
      /* Si le livre existe alors on envoie true */
      if (userCheck !== null)
        { res.json({result: true});
      
        /* Si le livre existe alors on envoie false */
      } else {
          res.json({ result: false });
        }
  
  /* Si on ne trouve pas le livre dans la BDD, on envoie false */
  } else {res.json({ result: false });}
});


/* --------------------------------------------------------------------------------------------------- */


/* DELETE : Supprimer un livre de wishList  */
router.delete('/wishlist/delete/:token/:bookid', async (req, res) => {
  let token = req.params.token;
  let bookid = req.params.bookid;

  /* Cibler le livre à supprimer via le bookid du front */
  var findBooktoDelete = await BooksModel.findOne({
    bookid: bookid
  });

  bookToDelete = findBooktoDelete._id

  /* Cibler l'utilisateur qui fait la demande via son token et livre à supprimer*/
  var userCheck = await UsersModel.findOne({
    token: token, wishlist: bookToDelete
  })

  console.log ('userCheck', userCheck)

  /* Si l'utlisateur et le livre sont trouvé, on supprime le livre de sa wishList */
  if (userCheck !== null) {
    var user = await UsersModel.findOneAndUpdate({token: token}, 
      { 
      $pull: {wishlist: bookToDelete}
      }
    );

    res.json({result: true});

  } else {res.json({ result: false});}
});

module.exports = router;