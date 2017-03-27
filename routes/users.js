var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/utilisateurs', function(req, res, next) {
	return new Promise(
        function(resolve, reject) {
            Utilisateur.findAll().then(function (user){
                if(user==null)
                {
                    reject(objError());
                }else{
                    var userSimpleConnexion = user.toObject();
                    userSimpleConnexion.resultat=true;
                    resolve(userSimpleConnexion);
                }
                //console.log("user seconde " + user);
            });
        }
    ).then(function(userSmpleConnexion){
        sendResponseData(userSmpleConnexion, res);
    }).catch(function(err){
        console.log('error Simple connexion  '+ err);
        errorLogin(res);
    });

 
});



module.exports = router;
