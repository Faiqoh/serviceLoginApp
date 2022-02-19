const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Token = mongoose.model(
  "Token",
  new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "user",
    },
    token: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600,
    }
  })
);
module.exports = Token;