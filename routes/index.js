var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');
var fs = require('fs');
var member = require('../models/members.js');
var clubData = require('../models/club.js');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/timetable', function(req, res, next) {
    res.render('timetable');
});

router.get('/eventReg', function(req, res, next) {
    res.render('events');
});

router.get('/home',function(req,res,next){
    var email = req.cookies["email"];
    var authCheck = req.cookies["authCheck"];
    var admin = req.cookies["adminCheck"];

    if(!email || !authCheck){
        res.redirect('/login');
    }
    else{
        if(admin !== "8394179rhfijebgi27r39r") {
            member.findOne({email: email}, function (err, result) {
                if (!result) {
                    res.redirect('/login');
                }
                else {
                    if (result.authCheck === authCheck) {
                        console.log(result.timeTableUploaded);
                        res.render('home', {name: result.name, timeTable: result.timeTableUploaded});
                    }
                    else {
                        res.redirect('/login');
                    }
                }
            });
        }
        else{
            clubData.findOne({email: email}, function (err, result) {
                if (!result) {
                    res.redirect('/login');
                }
                else {
                    if (result.authCheck === authCheck) {
                        member.find({}, function (err, res1) {
                            var selected = [];
                            for(var i=0;i<res1.length;i++){
                                if(res1[i].clubs.indexOf(result._id)>-1){
                                    selected.push({name:res1[i].name, regNo:res1[i].regNo, email:res1[i].email});
                                }
                            }
                            console.log(selected);
                            res.render('adminHome', {club: result.club, members: selected});
                        });
                    }
                    else {
                        res.redirect('/login');
                    }
                }
            });
        }
    }
});

router.get('/login', function(req,res,next){
    res.render('login');
});

router.get('/adminSignup', function(req,res,next){
    res.render('adminSignup');
});

router.get('/verifyMail', function(req, res, next) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!re.test(req.query.email)) {
        res.json({code: '0', message: 'Incorrect Link!'});
    }
    else {
        member.findOne({email: req.query.email}, function (err, result) {
            if (err)
                console.log(err);

            if (!result) {
                res.json({code: '0', message: 'You have not yet registered!'});
            }
            else if(result.authComp){
                res.json({code: '0', message: 'Already Authorised'});
            }
            else {
                var re = /^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]+$/;
                if (re.test(req.query.code)) {
                    if (req.query.code !== result.authCode)
                        res.json({code: '0', message: 'Incorrect Hash Code/Hash Code expired'});
                    else {
                        console.log(result);
                        var myquery = {};
                        myquery._id = result._id;

                        var newValues = result;
                        newValues.authComp = true;
                        member.updateOne(myquery, newValues, function (err, res1) {
                            if (err){
                                console.log(err);
                            }
                            else {
                                console.log("Success");
                                res.redirect('/login');
                            }
                        });
                    }
                }
                else
                    res.send('Incorrect Hash Code');
                //res.json({code: '0', message: 'Incorrect HashCode!'});
            }
        });
    }
});

router.get('/auth/verifyMail', function(req, res, next) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!re.test(req.query.email)) {
        res.json({code: '0', message: 'Incorrect Link!'});
    }
    else {
        clubData.findOne({email: req.query.email}, function (err, result) {
            if (err)
                console.log(err);

            if (!result) {
                res.json({code: '0', message: 'You have not yet registered!'});
            }
            else if(result.authComp){
                res.json({code: '0', message: 'Already Authorised'});
            }
            else {
                var re = /^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]+$/;
                if (re.test(req.query.code)) {
                    if (req.query.code !== result.authCode)
                        res.json({code: '0', message: 'Incorrect Hash Code/Hash Code expired'});
                    else {
                        console.log(result);
                        var myquery = {};
                        myquery._id = result._id;

                        var newValues = result;
                        newValues.authComp = true;
                        clubData.updateOne(myquery, newValues, function (err, res1) {
                            if (err){
                                console.log(err);
                            }
                            else {
                                console.log("Success");
                                res.redirect('/login');
                            }
                        });
                    }
                }
                else
                    res.send('Incorrect Hash Code');
                //res.json({code: '0', message: 'Incorrect HashCode!'});
            }
        });
    }
});

router.post('/signup',function(req,res,next){
    var name = req.body.name;
    var email = req.body.email;
    var regNo = req.body.regNo;
    var passwd = req.body.passwd;
    console.log(email)

    var Emailre = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var regNoRe = /^1[6,7,8][a-zA-Z]{3}[0-9]{4}$/;

    var errMsg = 'Errors in Input: ';
    var chk = false;
    // console.log(Emailre.test(email.toLowerCase()));
    if(!email || !Emailre.test(email.toLowerCase())) {
        errMsg += "\nInvalid Email Entered";
        chk = true;
    }
    if(!passwd || !(passwd.length >= 8 && passwd.length <= 16)){
        errMsg += "\nInvalid Password Entered (Between 8 and 16 characters needed)";
        chk = true;
    }

    if(!regNo || !regNoRe.test(regNo.toLowerCase())){
        errMsg += "\nInvalid Registration Number Entered";
        chk = true;
    }

    if(!name || name.length>40){
        errMsg += "\nPlease confine name length to within 40 characters";
        chk = true;
    }

    if(chk){
        res.json({code:1,message:errMsg});
    }
    else{
        var rand = Math.random().toString(36).slice(2);

        var data = new member({
            name : req.body.name,
            email : req.body.email,
            regNo : req.body.regNo,
            passwd : req.body.passwd,
            authCode: rand
        });
        data.save(function(err,done){
            if(err) {
                //To handle error when rString generated exists in the DB
                if (err && err.code === 11000) {
                    console.log({code: 1, message: 'Duplicate Entry, EMail ID is already registered'});
                    res.json({code: 1, message: 'Duplicate Entry, EMail ID is already registered'});
                }
                else if (err && err.code !== 66) {
                    console.log({code: 1, message: 'Something went wrong'});
                    res.json({code: 1, message: 'Something went wrong, please try again later'});
                }
            }
            else {
                console.log({code: 0, message: "SUCCESS"});
                res.json({code: 0, message: "SUCCESS"});
                var myobj = {
                    email: req.body.email,
                    hashcode: rand,
                    authcomp: false
                };

                var s = req.headers.host + "/verifyMail?code=" + myobj.hashcode + "&email=" + myobj.email;
                if (s.indexOf("http:") < 0) {
                    s = "http://" + s;
                }

                var data = "<h2 style='text-align:center'>ClubMate Login Verification</h2> <a href='https://google.com'></a>";
                data += "<p>Please follow this link to verify your EMail and start using our application: <a href='";
                data += s;
                data += "'>Verify EMail</a></p>";
                console.log(data);
                var smtpTransport = nodemailer.createTransport("smtps://enigma.ieeevit%40gmail.com:" + encodeURIComponent('enigmadev_2017') + "@smtp.gmail.com:465");
                var mailOptions = {
                    to: req.body.email,
                    from: 'enigma.ieeevit@gmail.com',
                    subject: 'ClubMate - EMail Verification',
                    html: data
                };
                smtpTransport.sendMail(mailOptions, function (err) {
                    if (err)
                        throw err;
                    else
                        console.log("Email Sent successfully !");
                });
            }
        });
        // Invoke the next step here however you like
        // Put all of the code here (not the best solution)
    }
});

router.post('/adminSignup',function(req,res,next){
    var name = req.body.name;
    var email = req.body.email;
    var club = req.body.club;
    var passwd = req.body.passwd;
    var members = req.body.members;
    console.log(email);

    var Emailre = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var membersRe = /^[1-9][0-9]{1}$/;

    var errMsg = 'Errors in Input: ';
    var chk = false;
    // console.log(Emailre.test(email.toLowerCase()));
    if(!email || !Emailre.test(email.toLowerCase())) {
        errMsg += "\nInvalid Email Entered";
        chk = true;
    }
    if(!passwd || !(passwd.length >= 8 && passwd.length <= 16)){
        errMsg += "\nInvalid Password Entered (Between 8 and 16 characters needed)";
        chk = true;
    }

    if(!members || !membersRe.test(members)){
        errMsg += "\nInvalid Registration Number Entered";
        chk = true;
    }

    if(!name || name.length>40){
        errMsg += "\nPlease confine name length to within 40 characters";
        chk = true;
    }

    if(!club || club.length>40){
        errMsg += "\nPlease confine Club length to within 40 characters";
        chk = true;
    }

    if(chk){
        res.json({code:1,message:errMsg});
    }
    else{
        var rand = Math.random().toString(36).slice(2);

        var data = new clubData({
            name : req.body.name,
            email : req.body.email,
            memebers : req.body.members,
            passwd : req.body.passwd,
            authCode: rand,
            club: club
        });
        data.save(function(err,done){
            if(err) {
                //To handle error when rString generated exists in the DB
                if (err && err.code === 11000) {
                    console.log({code: 1, message: 'Duplicate Entry, EMail ID is already registered'});
                    res.json({code: 1, message: 'Duplicate Entry, EMail ID is already registered'});
                }
                else if (err && err.code !== 66) {
                    console.log({code: 1, message: 'Something went wrong'});
                    res.json({code: 1, message: 'Something went wrong, please try again later'});
                }
            }
            else {
                console.log({code: 0, message: "SUCCESS"});
                res.json({code: 0, message: "SUCCESS"});
                var myobj = {
                    email: req.body.email,
                    hashcode: rand,
                    authcomp: false
                };

                var s = req.headers.host + "/auth/verifyMail?code=" + myobj.hashcode + "&email=" + myobj.email;
                if (s.indexOf("http:") < 0) {
                    s = "http://" + s;
                }

                var data = "<h2 style='text-align:center'>ClubMate Login Verification</h2> <a href='https://google.com'></a>";
                data += "<p>Please follow this link to verify your EMail and start using our application: <a href='";
                data += s;
                data += "'>Verify EMail</a></p>";
                console.log(data);
                var smtpTransport = nodemailer.createTransport("smtps://enigma.ieeevit%40gmail.com:" + encodeURIComponent('enigmadev_2017') + "@smtp.gmail.com:465");
                var mailOptions = {
                    to: req.body.email,
                    from: 'enigma.ieeevit@gmail.com',
                    subject: 'ClubMate - EMail Verification',
                    html: data
                };
                smtpTransport.sendMail(mailOptions, function (err) {
                    if (err)
                        throw err;
                    else
                        console.log("Email Sent successfully !");
                });
            }
        });
        // Invoke the next step here however you like
        // Put all of the code here (not the best solution)
    }
});

router.post('/login',function(req,res,next){
    var email = req.body.email;
    var passwd = req.body.passwd;
    var admin = req.body.admin;

    var Emailre = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    var errMsg = 'Errors in Input: ';
    var chk = false;
    // console.log(Emailre.test(email.toLowerCase()));
    if(!email || !Emailre.test(email.toLowerCase())) {
        errMsg += "\nInvalid Email Entered";
        chk = true;
    }
    if(!passwd || !(passwd.length >= 8 && passwd.length <= 16)){
        errMsg += "\nInvalid Password Entered (Between 8 and 16 characters needed)";
        chk = true;
    }

    if(chk){
        res.json({code:1,message:errMsg});
    }
    else {
        console.log("HEREE");
        console.log(admin);
        console.log("WE ARE");
        if (!admin) {
            member.findOne({email: email}, function (err, obj) {
                if (err) {
                    console.log(err);
                }
                else {
                    if (!obj) {
                        res.json({code: 1, message: "You have not registered with us yet, please sign up first!"});
                    }
                    else {
                        if (obj.authComp) {
                            if (obj.passwd === passwd) {
                                res.cookie("email", email, {
                                    maxAge: 86400000 // for 1 day
                                });
                                var rand = Math.random().toString(36).slice(2);
                                res.cookie("authCheck", rand, {
                                    maxAge: 86400000 // for 1 day
                                });
                                var myquery = {};
                                myquery._id = obj._id;

                                var newValues = obj;
                                newValues.authCheck = rand;
                                member.updateOne(myquery, newValues, function (err, res1) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    else {
                                        console.log("Success, added cookie saved value");
                                        res.json({code: 0, message: "Success, redirecting you to home page!"});
                                    }
                                });
                            }
                            else {
                                res.json({code: 1, message: "Entered Login Credentials are Incorrect!"});
                            }
                        }
                        else {
                            res.json({code: 1, message: "Please verify your EMail"});
                        }
                    }
                }
            });
            // Invoke the next step here however you like
            // Put all of the code here (not the best solution)
        }
        else{
            clubData.findOne({email: email}, function (err, obj) {
                if (err) {
                    console.log(err);
                }
                else {
                    if (!obj) {
                        res.json({code: 1, message: "You have not registered with us yet, please sign up first!"});
                    }
                    else {
                        if (obj.authComp) {
                            if (obj.passwd === passwd) {
                                res.cookie("email", email, {
                                    maxAge: 86400000 // for 1 day
                                });
                                var rand = Math.random().toString(36).slice(2);
                                res.cookie("authCheck", rand, {
                                    maxAge: 86400000 // for 1 day
                                });

                                res.cookie("adminCheck", "8394179rhfijebgi27r39r", {
                                    maxAge: 86400000 // for 1 day
                                });
                                var myquery = {};
                                myquery._id = obj._id;

                                var newValues = obj;
                                newValues.authCheck = rand;
                                clubData.updateOne(myquery, newValues, function (err, res1) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    else {
                                        console.log("Success, added cookie saved value");
                                        res.json({code: 0, message: "Success, redirecting you to home page!"});
                                    }
                                });
                            }
                            else {
                                res.json({code: 1, message: "Entered Login Credentials are Incorrect!"});
                            }
                        }
                        else {
                            res.json({code: 1, message: "Please verify your EMail"});
                        }
                    }
                }
            });
        }
    }
});

router.post('/timeTableUpload',function(req,res,next){
    var email = req.cookies["email"];
    if(!email){
        res.redirect('/login');
    }
    else {
        member.findOne({email: email}, function (err, obj) {
            if (err) {
                console.log(err);
            }
            else {
                if (!obj) {
                    res.redirect('/login');
                }
                else {
                    var myquery = {};
                    myquery._id = obj._id;

                    var newValues = obj;
                    newValues.timeTableUploaded = true;
                    member.updateOne(myquery, newValues, function (err, res1) {
                        if (err){
                            console.log(err);
                        }
                        else {
                            console.log("Added Timetable");
                            res.redirect('/home');
                        }
                    });
                }
            }
        });
    }

});

router.post('/addClub',function(req,res,next){
    var email = req.cookies["email"];
    var clubID = req.body.clubID;
    console.log(clubID);
    if(!email){
        res.redirect('/login');
    }
    else if(!clubID || clubID === ""){
        res.json({code:1,message:"Invalid Club ID entered"})
    }
    else {
        member.findOne({email: email}, function (err, obj) {
            if (err) {
                console.log(err);
            }
            else {
                if (!obj) {
                    res.redirect('/login');
                }
                else {
                    var myquery = {};
                    myquery._id = obj._id;

                    var newValues = obj;
                    clubData.findOne({_id: clubID}, function (err1, obj1) {
                        if(err){
                            console.log(err);
                        }
                        else if(obj1){
                            newValues.clubs.push(clubID);
                            member.updateOne(myquery, newValues, function (err, res1) {
                                if (err){
                                    console.log(err);
                                }
                                else {
                                    console.log("Added Club");
                                    res.json({code:0,message:"Successfully added club"});
                                }
                            });
                        }
                        else{
                            res.json({code:1,message:"Entered Club ID has not yet been registered"});
                        }
                    });
                }
            }
        });
    }

});

router.post('/addEvent',function(req,res,next){
    var email = req.cookies["email"];
    var clubID = req.body.clubID;
    console.log(req.body.email);
    // console.log(clubID);
    // if(!email){
    //     res.redirect('/login');
    // }
    // else if(!clubID || clubID === ""){
    //     res.json({code:1,message:"Invalid Club ID entered"})
    // }
    // else {
    //     member.findOne({email: email}, function (err, obj) {
    //         if (err) {
    //             console.log(err);
    //         }
    //         else {
    //             if (!obj) {
    //                 res.redirect('/login');
    //             }
    //             else {
    //                 var myquery = {};
    //                 myquery._id = obj._id;
    //
    //                 var newValues = obj;
    //                 clubData.findOne({_id: clubID}, function (err1, obj1) {
    //                     if(err){
    //                         console.log(err);
    //                     }
    //                     else if(obj1){
    //                         newValues.clubs.push(clubID);
    //                         member.updateOne(myquery, newValues, function (err, res1) {
    //                             if (err){
    //                                 console.log(err);
    //                             }
    //                             else {
    //                                 console.log("Added Club");
    //                                 res.json({code:0,message:"Successfully added club"});
    //                             }
    //                         });
    //                     }
    //                     else{
    //                         res.json({code:1,message:"Entered Club ID has not yet been registered"});
    //                     }
    //                 });
    //             }
    //         }
    //     });
    // }

});



module.exports = router;
