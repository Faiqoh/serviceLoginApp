const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;
const Token = db.token;
const path = require('path');
var async = require('async');
const crypto = require("crypto");

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = (req, res) => {
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8)
  });

  const token = new Token({
    userId: user._id,
    token: crypto.randomBytes(32).toString("hex")
  });

  token.save((err, token) =>{
    if (err) {
      res.status(500).send({ message: err });
      return;
    }
  }); 

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (req.body.roles) {
      Role.find(
        {
          name: { $in: req.body.roles }
        },
        (err, roles) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          user.roles = roles.map(role => role._id);
          user.save(err => {
            if (err) {
              res.status(500).send({ message: err });
              return;
            }

            res.send({ message: "User was registered successfully!" });
          });
        }
      );
    } else {
      Role.findOne({ name: "user" }, (err, role) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        user.roles = [role._id];
        user.save(err => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          res.send({ message: "User was registered successfully!" });
        });
      });
    }
  });
};

exports.signin = (req, res) => {
  User.findOne({
    email: req.body.email
  })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 86400 // 24 hours
      });

      var authorities = [];

      for (let i = 0; i < user.roles.length; i++) {
        authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
      }
      res.status(200).send({
        id: user._id,
        username: user.username,
        email: user.email,
        roles: authorities,
        accessToken: token
      });
    });
};

exports.changePassword = (req, res) => {
  User.findByIdAndUpdate({_id : req.params.id}, {password:
    bcrypt.hashSync(req.body.password, 8)
  }).then(result=>res.send({message: "Password has been changed!" }))
};

// exports.forgot_password = (req, res) => {
//   async.waterfall([
//     function(done) {
//       User.findOne({
//         email: req.body.email
//       }).exec(function(err, user) {
//         if (user) {
//           done(err, user);
//         } else {
//           done('User not found.');
//         }
//       });
//     },
//     function(user, done) {
//       // create a unique token
//        var tokenObject = {
//            email: user.email,
//            id: user._id
//        };
//        var secret = user._id + '_' + user.email + '_' + new Date().getTime();
//        var token = jwt.sign(tokenObject, secret);
//        done(err, user, token);
//     },
//     function(user, token, done) {
//       User.findByIdAndUpdate({ _id: user._id }, { reset_password_token: token, reset_password_expires: Date.now() + 86400000 }, { new: true }).exec(function(err, new_user) {
//         done(err, token, new_user);
//       });
//     },
//     function(token, user, done) {
//       var data = {
//         to: user.email,
//         from: email,
//         template: 'forgot-password-email',
//         subject: 'Password help has arrived!',
//         context: {
//           url: 'http://localhost:8080/api/auth/reset_password?token=' + token,
//           name: user.fullName.split(' ')[0]
//         }
//       };

//       smtpTransport.sendMail(data, function(err) {
//         if (!err) {
//           return res.json({ message: 'Kindly check your email for further instructions' });
//         } else {
//           return done(err);
//         }
//       });
//     }
//   ], function(err) {
//     return res.status(422).json({ message: err });
//   });
// };


// exports.reset_password = function(req, res, next) {
//   User.findOne({
//     reset_password_token: req.body.token,
//     reset_password_expires: {
//       $gt: Date.now()
//     }
//   }).exec(function(err, user) {
//     if (!err && user) {
//       if (req.body.newPassword === req.body.verifyPassword) {
//         user.hash_password = bcrypt.hashSync(req.body.newPassword, 10);
//         user.reset_password_token = undefined;
//         user.reset_password_expires = undefined;
//         user.save(function(err) {
//           if (err) {
//             return res.status(422).send({
//               message: err
//             });
//           } else {
//             var data = {
//               to: user.email,
//               from: email,
//               template: 'reset-password-email',
//               subject: 'Password Reset Confirmation',
//               context: {
//                 name: user.fullName.split(' ')[0]
//               }
//             };

//             smtpTransport.sendMail(data, function(err) {
//               if (!err) {
//                 return res.json({ message: 'Password reset' });
//               } else {
//                 return done(err);
//               }
//             });
//           }
//         });
//       } else {
//         return res.status(422).send({
//           message: 'Passwords do not match'
//         });
//       }
//     } else {
//       return res.status(400).send({
//         message: 'Password reset token is invalid or has expired.'
//       });
//     }
//   });
// };