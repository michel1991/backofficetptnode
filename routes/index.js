var express = require('express');
var Promise = require('bluebird');
var router = express.Router();
var mongoose = require('mongoose');
var mongoose = Promise.promisifyAll(mongoose);
const Utilisateur = require('../modelsMongo/Utilisateur');
const Device = require('../modelsMongo/Device');
const Preference = require('../modelsMongo/Preference');
const Lampadaire = require('../modelsMongo/LifiLampadaire');

try {
    mongoose.connect('mongodb://127.0.0.1:27017/projectLifi');
}catch(err) {
    mongoose.createConnection('mongodb://127.0.0.1:27017/projectLifi');
}

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('index', { title: 'Express' });
    res.render('backOffice', { title: 'Back office' });
});

/**
 * login de l'utilisateur
 */
router.get('/eloginbak', function(req,res){
    var username = req.query.username;
    var password = req.query.password;
    var lampadaireID = req.query.lampadaire;
    if(typeof lampadaireID !='undefined' && lampadaireID.length>0)
    {
        if((typeof username !='undefined' && username.length>0) && (typeof password !='undefined' && password.length>0))
        {
            var userToFind={
                username:username,
                password:password
            };
            connexion(lampadaireID, res, userToFind);
        }else{
            errorLogin(res);
        }
    }else{
        errorLogin(res);
    }
});
/**
 *
 * @param idLampadaire
 * @param res l'object response de node js
 * @param userToFind utilisateur à rechercher en bd
 * @returns {Promise}
 */
var connexion = function(idLampadaire, res, userToFind){
    var userResultat={resultat:false};
    findLampadaire(idLampadaire, userToFind).then(findUser).then(updateUserInfo).then(function(resultat){
        //console.log("la fin " + resultat);
        sendResponseData(resultat,res);
    }).catch(function(err){
        console.log('error '+ err);
        errorLogin(res);
    });
};

/**
 * fonction utilisée pour enchainer les promesse fun pour moi mais très utile pour vouss
 * @param idLampandaire l'id du lampandaire à rechercher celui qui déclenchera un evenement
 * @param userToFind l'utilisateur à rechercher pour biensure voir s'il peut ou pas se connecter à la smart home
 */
var findLampadaire = function(idLampandaire, userToFind) {
    return new Promise(
        function(resolve, reject) {
            var lampadaire={}
            var userResultat={resultat:false};
            Lampadaire.findOne({serialID: idLampandaire }).then(function(lampadairesResultats){
                //console.log("recupération du lampandaire " + lampadairesResultats);
                if(lampadairesResultats==null)
                {
                    reject(userResultat);
                }
                else if((typeof lampadairesResultats!='undefined') && (typeof lampadairesResultats.serialID !='undefined'))
                {
                   // console.log("recupération du lampandaire " + lampadairesResultats);
                    resolve({lamp:lampadairesResultats, user:userToFind});
                }
            });
        }
    );
};
/**
 * fonction utilisée pour chaîner les promesses
 * permettant également de rechercher un utilisateur en utilisant une promesse
 * @param result l'utilisateur à rechercher
 */
var findUser= function(result) {
    return new Promise(
        function(resolve, reject) {
            //console.log("lampadaire seconde " + result.lamp + " user " + result.user);
            var userResultat={resultat:false};
            if(typeof  result.lamp.serialID !='undefined')
            {
                Utilisateur.findOne({username: result.user.username, password: result.user.password}).then(function (user){
                    if(user==null)
                    {
                        reject(userResultat);
                    }else{
                        userResultat.resultat=true;
                        userResultat.username=user.username;
                        userResultat.password=user.password;
                        userResultat._id=user._id;
                        resolve(userResultat);
                    }

                    //console.log("user seconde " + user);
                });
            }

        }
    );
};

/**
 * fonction utilisée pour mettre à jour l'etat de connexion de l'utilisateur connecter=true
 * pas connecter = false
 * @param userResultat
 */
var updateUserInfo= function(userResultat) {
    return new Promise(
        function(resolve, reject) {
            if(typeof  userResultat.password!='undefined')
            {
                var userId = new mongoose.mongo.ObjectId(userResultat._id);
                var queryFind = {'_id':userId };
                var userResultatRejet={resultat:false};
                Utilisateur.findOneAndUpdate(queryFind, {isConnect:true}, {upsert:false}, function(err, userEnd)
                {
                    if (err)
                    {
                        reject(userResultatRejet);
                    } else{
                        //errorLogin(res);
                        if(userEnd==null)
                        {
                            reject(userEnd);
                        }else{
                            //userEnd.resultat=true;
                            var userEndFinal = userEnd.toObject();
                            userEndFinal.resultat=true;
                           // console.log("user end " + userEnd);
                            resolve(userEndFinal);
                        }
                    }
                });
            }
        }
    );
};


/**
 * fonction utilitaire pour dire que la requete de l'utilisateur ne renvoie aucun objet
 * @param res objet response de node js
 */
var errorLogin = function(res)
{
    var userResultat={resultat:false};
    res.send(userResultat, {
        'Content-Type': 'application/json'
    }, 500);
};

/**
 * fonction utilitaire pour dire que la requete de l'utilisateur ne renvoie aucun objet
 * et donc l'objet req.body et req.query n'existent pas
 * @param res objet response de node js
 */
var errorLoginQuery = function(res)
{
    var userResultat={
        resultat:false,
        errMsg:"Object Body et Query node non pris en compte vérifier vos paramètres"
    };
    res.send(userResultat, {
        'Content-Type': 'application/json'
    }, 500);
};

/**
 * objet error pour une meilleure gestion des erreurs
 * @returns {{resultat: boolean}}
 */
var objError = function()
{
    return {
        resultat:false
    };
};

/**
 *
 * @param data object à renvoyer
 * @param res l'object response de node js
 */
var sendResponseData = function(data,res)
{
    res.send(data, {
        'Content-Type': 'application/json'
    }, 200);
};

/**
 * création d'un utilisateur qui déclenchera une règle
 * object json
 * {
 *    firstName:String,
 *    mail:String,
 *    username:String,
 *    password:String
 * }
 */
router.post('/user', function(req, res, next) {

    var obGetParam= getObForRequest(req);
    if(obGetParam==null)
    {
        errorLoginQuery(res);
    }else{
        var firstName = obGetParam.firstName,
        mail=obGetParam.mail,
        username=obGetParam.username,
        password= obGetParam.password,
        imei = obGetParam.imei,
        idLamp= obGetParam.idLamp;

        if((typeof username !='undefined' && username.length>0) && (typeof password !='undefined' && password.length>0)
        && (typeof mail !='undefined' &&  mail.length>0)   && (typeof firstName !='undefined' &&  firstName.length>0))
        {
            var userToInsert = {
                firstName: firstName,
                mail:mail,
                username:username,
                password:password,
                imei:imei,
                idLamp: idLamp
            };
            const util = new Utilisateur(userToInsert);
            util.save().then(function(userReallySave){
                if(userReallySave==null)
                {
                    errorLogin(res);
                }else{
                    var userFinal = userReallySave.toObject();
                    userFinal.resultat=true;
                    sendResponseData(userFinal, res);
                    //sendResponseData(userReallySave, res);
                }
            });
        } else {
            errorLogin(res);
        }
    }

});
/**
 * création du lampadaire ici seulement
 * object json envoyé
 * {
 *    idLamp:String
 * }
 */
router.post('/createLampadaire', function(req, res, next) {

    var idLampadaire = req.query.idLamp;
    //console.log("idLamp " + idLampadaire + " query "+ req.query.idLamp);
    if((typeof idLampadaire !='undefined' && idLampadaire.length>0))
    {
        var LampadaireToInsert = {
            serialID: idLampadaire
        };
        const lampandaire = new Lampadaire(LampadaireToInsert);
        lampandaire.save().then(function(lampReallySave){
            if(lampReallySave==null)
            {
                errorLogin(res);
            }else{
                var lampFinal = lampReallySave.toObject();
                lampFinal.resultat=true;
                sendResponseData(lampFinal, res);
                //sendResponseData(lampReallySave, res);
            }
        });
    } else {
        errorLogin(res);
    }
});

/**
 * creation d'un device ou item dans node
 * object json envoyé
 * {
 *   serialNumber:String,
 *   nameDevice:  String ,
 *   itemBindingOpenHab: String,
 *   typeDevice:String on partira avec le type{ temp=temperature, pse=prise}
 *
 * }
 */
router.post('/createDevice', function(req, res, next) {
    var serialNumber= req.query.serialNumber, nameDeviceS=req.query.nameDevice,
        itemBindingOpenHabS=req.query.itemBindingOpenHab, typeDeviceS=req.query.typeDevice;
    if((typeof serialNumber !='undefined' && serialNumber.length>0)
     && (typeof typeDeviceS !='undefined' && typeDeviceS.length>0))
    {
        var DeviceToInsert = {
            serialNumber: serialNumber,
            nameDevice:nameDeviceS,
            itemBindingOpenHab:itemBindingOpenHabS,
            typeDevice:typeDeviceS
        };
        const device = new Device(DeviceToInsert);
        device.save().then(function(deviceReallySave){
            if(deviceReallySave==null)
            {
                errorLogin(res);
            }else{
                var deviceFinal = deviceReallySave.toObject();
                deviceFinal.resultat=true;
                sendResponseData(deviceFinal, res);
                //sendResponseData(lampReallySave, res);
            }
        });
    } else {
        errorLogin(res);
    }
});

/**
 * creation d'une configuration ie une préférence
 * bon je pouvais factoriser le code mais la flemme désole pour la répétition
 * object json envoyé
 * {
 *   namePreference:String,
 *  idUtil:  String ,
 *   itemBindingOpenHab: String,
 *    idDevice:idDu device à confi
 *
 * }
 */
router.post('/createPreference', function(req, res, next) {
    var namePreferenceS= req.query.namePreference, idUtilS=req.query.idUtil,
        idDeviceInitS=req.query.idDevice;
    if((typeof namePreferenceS !='undefined' && namePreferenceS.length>0)
      && (typeof idDeviceInitS !='undefined' && idDeviceInitS.length>0) )
    {
       /*
          on va rechercher le device à configurer
       */
       //console.log("arrivée");
        var DeviceToInsert = {
            namePreference: namePreferenceS,
            idUtil:idUtilS
            //idDeviceInit:idDeviceInitS
        };
        rechercheUserById(idUtilS, idDeviceInitS).then(rechercheDevice).then(function(resultat){
            return new Promise(
                function(resolve, reject)
            {
                var deviceToConfig =resultat.dvce;
                var utilToConfig =resultat.user;
                var typeDevice = (deviceToConfig.typeDevice).toString();
                var deviceIdInitMongoose = new mongoose.mongo.ObjectId(deviceToConfig ._id);
                var utilIdMongoose = new mongoose.mongo.ObjectId(utilToConfig._id);

                // device temperature
                switch (typeDevice)
                {
                    case "temp":
                        var tempMin =req.query.tempMin;
                        var tempMax= req.query.tempMax;
                        if((typeof tempMin !='undefined' && (tempMin).toString().length>0)
                            && (typeof tempMax !='undefined' && (tempMax).toString().length>0))
                        {
                            var propertiesTemp ={
                                tempMin: parseInt(tempMin),
                                tempMax: parseInt(tempMax)
                            };
                            var pref = {
                                namePreference: DeviceToInsert.namePreference,
                                idUtil:utilIdMongoose,
                                dateCreated: new Date(),
                                deviceInitEvent:{
                                    idDevice:deviceIdInitMongoose,
                                    properties:propertiesTemp
                                }
                            };
                            console.log("temp object preference " +pref);
                            const preferenceOb = new Preference(pref);
                            preferenceOb.save().then(function(prefReallySave)
                            {
                                //console.log("prefer really" + prefReallySave);
                                 if(prefReallySave==null)
                                 {
                                     reject(objError());
                                 }else{
                                     var prefFinal = prefReallySave.toObject();
                                     //prefReallySave.resultat=true;
                                     prefFinal.resultat=true;
                                     //console.log("la fin " + resultat.dvce + " user " + prefFinal);
                                     resolve(prefFinal);
                                 }

                            });
                        }
                    break; // fin du premier  break pour la temperature

                    case "pse":
                        var stateWish =req.query.stateWish;
                        if(typeof stateWish !='undefined' && (stateWish).toString().length>0)
                        {
                            var propertiesTemp ={
                                stateWish: stateWish

                            };
                            var pref = {
                                namePreference: DeviceToInsert.namePreference,
                                idUtil:utilIdMongoose,
                                dateCreated: new Date(),
                                deviceInitEvent:{
                                    idDevice:deviceIdInitMongoose,
                                    properties:propertiesTemp
                                }
                            };
                            const preferenceObPrse = new Preference(pref);
                            preferenceObPrse.save().then(function(prefReallySave)
                            {
                                if(prefReallySave==null)
                                {
                                    reject(objError());
                                }else{
                                    var prefFinal = prefReallySave.toObject();
                                    prefFinal.resultat=true;
                                    resolve(prefFinal);
                                }

                            });
                        }

                    break;//fin du case de la prise du device type prise = pse
                    default:
                        reject(objError());
                }

            });
        }).then(function(resultat){
            sendResponseData(resultat, res);
        }).catch(function(err){
            console.log('error catch'+ err);
            errorLogin(res);
        });


    }else{
        errorLogin(res);
    }
});

/**
 * fonction utilisée pour rechercher un périphérique ou device selon son id provenant de mongo on
 * chaîne les promesses ici
 * @param idDevice  id du device génére par mongo
 */
var rechercheDevice= function(resultat) {

    return new Promise(
        function(resolve, reject) {
            //console.log("coucou "+ resultat.util);
            var deviceId = new mongoose.mongo.ObjectId(resultat.deviceId);
            //console.log("coucou " + deviceId);
            Device.findOne({_id: deviceId}).then(function(device){

                if(device==null)
                {
                    reject(objError());
                }else{

                    if(resultat.util!=null)
                    {
                        resolve({dvce:device, user:resultat.util});
                    }else{
                        resolve({dvce:device});
                    }
                }
               //
                //console.log("user seconde " + user);
            });

        }
    );

};

/**
 * fonction permettant à la fois de recherche un utilisateur par son id et utiliser pour parametrer une preference
 * en utilisant nos fameuses promesses
 * @param idUser id de l'utilisateur pour parametrer
 * @param idDevice id du devce à parametrer
 */
var rechercheUserById= function(idUser, idDevice) {
    return new Promise(
        function(resolve, reject) {
            var idUserToResearch = new mongoose.mongo.ObjectId(idUser);
            Utilisateur.findOne({_id: idUserToResearch}).then(function(user){

                if(user==null)
                {
                    reject(objError());
                }else{
                    if(idDevice!=null && typeof idDevice !='undefined')
                    {
                        resolve({util:user, deviceId:idDevice});
                    }else{
                        resolve({util:user});
                    }

                }
            });
        }
    );
};


/**
 *
 * @param idUser id de l'utilisateur côté mongo db
 * @param res object response de node
 */
var researchIntoPreferencesFirst = function(idUser, res){
    var idUtilToResearch= new mongoose.mongo.ObjectId(idUser);
    var data = [];
    Preference.find({idUtil: idUtilToResearch}).exec().then(function(preferences){
        // console.log("preferences " + preferences);
        if(preferences==null)
        {
            sendResponseData([], res);
        }else{
            return Promise.each(preferences, function(preferenceR){
                var device = preferenceR.deviceInitEvent;
                //console.log("device " + device);
                return Device.findOne({_id: mongoose.Types.ObjectId(device.idDevice)}).then(function (dvce){
                    var ob= {
                        namePreference:preferenceR.namePreference,
                        idPreference:preferenceR._id,
                        idDevice:dvce._id,
                        nameDevice: dvce.nameDevice,
                        serialNumber:dvce.serialNumber,
                        typeDevice:dvce.typeDevice,
                        temBindingOpenHab:dvce.temBindingOpenHab,
                        properties:device.properties
                    };
                    data.push(ob);
                });
            }).then(function(){
                /*console.log("end device "+ data);
                data.forEach(function(ob){
                    console.log(ob);
                });*/
                sendResponseData(data, res);
            });

            //resolve(data);
        }
    });
};

/**
 * obtenir toutes les preferences d'un utilisateur
 */
router.get('/PreferencesUser', function(req, res, next) {
    var idUtilS = req.query.idUtil;
    if((typeof idUtilS !='undefined' && (idUtilS).toString().length>0))
    {
        researchIntoPreferencesFirst(idUtilS, res);
    }else{
        errorLogin(res);
    }

});
/**
 * Méthode utilisée pour mettre à jour une preference
 * @param idPrference
 * @param req object requete
 * @param res object responsse
 * @returns {Promise}
 */
var updatePreference = function(idPrference, req, res){
    return new Promise(
        function(resolve, reject)
        {
            var idPreferenceToResearchMongo= new mongoose.mongo.ObjectId(idPrference);
            Preference.findOne({_id:idPreferenceToResearchMongo}).then(function(preference)
            {
                console.log(preference);
                if(preference==null)
                {
                    //console.log("pref first null");
                    reject(objError());
                }else{
                    resolve(preference);
                }
            });
        }).then(function(resultatU){
        //console.log("deuxieme " + resultatU);
        return new Promise(
            function(resolve, reject)
            {
                var deviceInit = resultatU.deviceInitEvent;
                var idDevice = new mongoose.mongo.ObjectId(deviceInit.idDevice);
                //console.log("dvice id " + idDevice);
                Device.findOne({_id: idDevice}).then(function (dvce){
                    if(dvce==null)
                    {
                        //console.log("deuxieme null");
                        reject(objError());
                    }else{
                        resolve(dvce);
                    }
                });
            });
        }).then(function(resultatDevice)
         {
            //console.log("device update troisième  " + resultatDevice);
             return new Promise
             (
                 function(resolve, reject)
                 {
                     var typeDevice = (resultatDevice.typeDevice).toString();
                     //console.log("device type  " + typeDevice);
                     var idPref = new mongoose.mongo.ObjectId(idPrference);
                     var queryFind = {'_id':idPref};
                     switch (typeDevice)
                     {
                         case "temp":
                             var tempMin =req.query.tempMin;
                             var tempMax= req.query.tempMax;
                             if((typeof tempMin !='undefined' && (tempMin).toString().length>0)
                                 && (typeof tempMax !='undefined' && (tempMax).toString().length>0))
                             {
                                 var propertiesTemp ={
                                     tempMin: parseInt(tempMin),
                                     tempMax: parseInt(tempMax)
                                 };

                                 //console.log("temp min " + tempMin + " temp max "+ tempMax + " idp " +idPrference);
                                 //var queryUpdate ={$set: {'meta.favs': 56}}
                                 Preference.findOneAndUpdate(queryFind,
                                     {$set:
                                         {
                                             'deviceInitEvent.properties.tempMax':propertiesTemp.tempMax,
                                             'deviceInitEvent.properties.tempMin':propertiesTemp.tempMin
                                         }
                                     }, function(err, prefeceUpdate)
                                 {
                                     //console.log("update " + prefeceUpdate);
                                     if (err)
                                     {
                                         reject(objError());
                                     } else{
                                         if(prefeceUpdate==null)
                                         {
                                             reject(objError());
                                         }else{
                                             var prefeceUpdateFinal = prefeceUpdate.toObject();
                                             prefeceUpdateFinal.resultat=true;
                                             //console.log("final temp " + prefeceUpdateFinal);
                                             resolve(prefeceUpdateFinal);
                                         }
                                     }
                                 });

                             }
                             break;
                         case "pse":
                             var stateWish =req.query.stateWish;
                             if(typeof stateWish !='undefined' && (stateWish).toString().length>0)
                             {
                                 var propertiesTemp ={
                                     stateWish: stateWish
                                 };
                                 //var queryUpdate ={$set: {'meta.favs': 56}}
                                 Preference.findOneAndUpdate(queryFind,
                                     {$set:
                                         {
                                             'deviceInitEvent.properties.stateWish':propertiesTemp.stateWish
                                         }
                                     }, function(err, prefeceUpdate)
                                     {
                                         if (err)
                                         {
                                             reject(objError());
                                         } else{
                                             if(prefeceUpdate==null)
                                             {
                                                 reject(objError());
                                             }else{
                                                 var prefeceUpdateFinal = prefeceUpdate.toObject();
                                                 prefeceUpdateFinal.resultat=true;
                                                 console.log("final pse " + prefeceUpdateFinal);
                                                 resolve(prefeceUpdateFinal);
                                             }
                                         }
                                     });
                             }

                             break;//fin du case de la prise du device type prise = pse
                         default:
                             reject(objError());
                     }//fin du switch

                 });

         }).then(function(resultatToSend){
             //sendResponseData(resultatToSend, res);
           return new Promise(
            function(resolve, reject)
            {
                var idPreferenceToResearchMongoF= new mongoose.mongo.ObjectId(resultatToSend._id);
                Preference.findOne({_id:idPreferenceToResearchMongoF}).then(function(preference)
                {
                    //console.log(preference);
                    if(preference==null)
                    {
                        //console.log("FINAL REJECT pref null");
                        reject(objError());
                    }else{
                        var prefeceUpdateFinalLast = preference.toObject();
                        prefeceUpdateFinalLast.resultat=true;
                        resolve(prefeceUpdateFinalLast);
                    }
                });
            });
        }).then(function(data){
          sendResponseData(data, res);
         }).catch(function(err){
            console.log('error catch UPDATE PREF '+ err);
            errorLogin(res);
        });

    };


/**
 *
 * connexion pour une simple connexion
 * conforme aux recommandations d'harris
 */
router.get("/login", function(req, res, next)
{
    var obGetParam= getObForRequest(req);
    if(obGetParam==null)
    {
        errorLoginQuery(res);
    }else{
        var username=obGetParam.username, password= obGetParam.password;
        if((typeof username !='undefined' && username.length>0) && (typeof password !='undefined' && password.length>0))
        {
            return new Promise(
                function(resolve, reject) {
                    Utilisateur.findOne({username: username, password:password}).then(function (user){
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

        }else{
            errorLogin(res);
        }
    }



});

var getObForRequest = function (req){
    var obGetParam= null;
    if(req.query!=null)
    {
        obGetParam = req.query;
    }else if(req.body!=null)
    {
        obGetParam = req.body;
    }
    return  obGetParam;
};

/**
 * Connexion avec l'imei et l'id du lampandaire
 */
router.get("/lifiConnexion", function(req, res, next)
{
    var obGetParam= getObForRequest(req);
    if(obGetParam==null)
    {
        errorLoginQuery(res);
    }else{
        var imei=req.obGetParam.imei, idLamp= req.obGetParam.idLamp;
        if((typeof imei !='undefined' && imei.length>0) && (typeof idLamp !='undefined' && idLamp.length>0))
        {
            return new Promise(
                function(resolve, reject) {
                    Utilisateur.findOne({imei: imei, idLamp:idLamp}).then(function (user){
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
                console.log('error lifi connexion  '+ err);
                errorLogin(res);
            });
        }else{
            errorLogin(res);
        }
    }


});

router.put('/updatePreference', function(req, res, next) {
    var idPreferenceMongo = req.query.idPreference;
    if((typeof idPreferenceMongo !='undefined' && (idPreferenceMongo).toString().length>0))
    {
        updatePreference(idPreferenceMongo, req, res);
        /*.then(function(resultat){
         console.log("id util " + resultat.idUtil + " p "+resultat);
         })*/
    }else{
        errorLogin(res);
    }
});
router.delete('/deletePref', function(req, res, next){
    var idPreferenceMongo = req.query.id_pref;
    if((typeof idPreferenceMongo !='undefined' && (idPreferenceMongo).toString().length>0))
    {
        var idPreferenceToResearchMongoF= new mongoose.mongo.ObjectId(idPreferenceMongo);
        Preference.findOneAndRemove({_id : idPreferenceToResearchMongoF}, function (err,pref){
            if (err)
            {
                errorLogin(res);
            }else{
                var rs = {
                    resultat:true
                }
                sendResponseData(rs, res);
            }
                res.send(err);
        });
    }else{
        errorLogin(res);
    }

    //console.log("pref " + idPreferenceMongo+ " other "+req.params.id_pref);
});

module.exports = router;
