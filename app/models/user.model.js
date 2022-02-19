const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    username : {
        type : String,
        required : true
    },
    email : {
      type : String,
      required : true
    },
    password : {
        type : String,
        required : true
    },
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role"
      }
    ],
    // token: {
    //   type: String,
    //   required: true,
    // }
  })
);
module.exports = User;