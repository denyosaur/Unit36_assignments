const Router = require("express").Router;
const router = new Router();
const db = require("../db");

const ExpressError = require("../expressError");
const User = require("../models/user");
const Message = require("../models/message");

const { authenticateJWT, ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, (req, res, next) => {
    try {
        const id = req.params.id;
        const msg = Message.get(id);
        const currUser = req.user.username;

        if (msg.to_user.username !== currUser && msg.from_user.username !== currUser) {
            throw new ExpressError("Cannot read this message", 401);
        }
        return res.json({ "message": msg });
    }
    catch (err) {
        return next(err);
    }
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureCorrectUser, (req, res, next) => {
    try {
        const { to_username, body } = req.body;
        const currUser = req.user.username;
        const msg = Message.create({ currUser, to_username, body });

        return res.json({ "message": msg });
    }
    catch (err) {
        return next(err);
    }
})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

module.exports = User;