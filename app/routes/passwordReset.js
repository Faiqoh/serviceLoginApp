const db = require("../models");
const User = db.user;
const Token = db.token;
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const Joi = require("joi");
const express = require("express");
const router = express.Router();
var bcrypt = require("bcryptjs");

router.post("/", async (req, res) => {
    try {
        const user = await User.findOne({email: req.body.email});
        if (!user)
            return res.status(400).send("user with given email doesn't exist");

        let token = await Token.findOne({ userId: user._id });
        if (!token) {
            token = await new Token({
                userId: user._id,
                token: crypto.randomBytes(32).toString("hex"),
            }).save();
        }

        const link = 'You requested for a password reset, kindly use this link to reset your password '+`http://localhost:8081/resetPass/${user._id}`;
        await sendEmail(user.email, "Password reset", link);

        res.send({ message: "Password reset link sent to your email account!" });
    } catch (error) {
        res.send("An error occured");
        console.log(error);
    }
});

router.post("/reset/:id", async (req, res) => {
    try {

        const user = await User.findById(req.params.id);
        // console.log(req.params.id);
        if (!user) return res.status(400).send("invalid link or expired");

        const token = await Token.findOne({
            userId: user.id,
            // token: req.params.token,
        });

        if (!token) return res.status(400).send("Invalid link or expired");

        user.password = bcrypt.hashSync(req.body.password, 8);
        await user.save();
        await token.delete();

        res.send({ message: "Password reset successfully!" });
    } catch (error) {
        res.send("An error occured");
        console.log(error);
    }
});

module.exports = router;