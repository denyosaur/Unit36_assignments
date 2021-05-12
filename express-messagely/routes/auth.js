const Router = require("express").Router;
const router = new Router();
const jwt = require("jsonwebtoken");

const { SECRET_KEY } = require("../config")
const ExpressError = require("../expressError");

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post("/login", async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const auth = await User.authenticate(username, password);

        if (!auth) {
            throw new ExpressError("Incorrect Username/Password", 404);
        } else {
            let token = jwt.sign(username, SECRET_KEY);
            User.updateLoginTimestamp(username);
            return res.json({ token });
        }
    }
    catch (err) {
        return next(err);
    }
})

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post("/register", async (req, res, next) => {
    try {
        const { username, password, first_name, last_name, phone } = req.body;
        const registered = await User.register(username, password, first_name, last_name, phone);
        let token = jwt.sign({ registered }, SECRET_KEY);

        User.updateLoginTimestamp(username);
        return res.json({ token });
    }
    catch (err) {
        return next(err);
    }
})

module.exports = router;