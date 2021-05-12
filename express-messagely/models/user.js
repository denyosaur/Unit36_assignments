/** User class for message.ly */
const db = require("../db");
const bcrypt = require("bcrypt");
const workFactor = require("../config");
const ExpressError = require("../expressError");


/** User of the site. */

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */
  static async register({ username, password, first_name, last_name, phone }) {
    try {
      const hasedPw = await bcrypt.hash(password, workFactor);
      const time = new Date();

      const res = db.query(`
      INSERT INTO users (username, password, first_name, last_name, phone, join_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING username, password, first_name, last_name, phone
      `, [username, hasedPw, first_name, last_name, phone, time]);
      let newUser = res.rows[0];

      return newUser;
    }
    catch (err) {
      return next(err);
    }

  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    try {
      const res = await db.query(`SELECT password FROM users WHERE username=$1`, [username]);
      const resPW = res.rows[0];

      if (!resPW) {
        throw new ExpressError("Invalid Username/Password", 400);
      };

      const authentic = await bcrypt.compare(password, resPW.password);
      return authentic;
    }
    catch (err) {
      return next(err);
    }
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const date = new Date();
    const res = await db.query(`
    UPDATE users 
    SET last_login_at=$1 
    WHERE username=$2`, [date, username]);

    if (!res.rows[0]) {
      throw new ExpressError("User doesn't exist", 404);
    };
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    try {
      const res = await db.query(`SELECT username, first_name, last_name, phone FROM users`);
      const allUsers = res.rows;
      return allUsers;
    }
    catch (err) {
      return next(err);
    }
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    try {
      const res = await db.query(`
      SELECT username, first_name, last_name, phone, join_at, last_login_at
      FROM users 
      WHERE username=$1
      `, [username]);

      const userInfo = res.rows[0];

      if (!userInfo) {
        throw new ExpressError("User does not exist", 404);
      }

      return res.send(userInfo);
    }
    catch (err) {
      return next(err);
    }
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    try {
      const res = await db.query(`
        SELECT m.id, m.to_username, u.first_name, u.last_name, u.phone, m.body, m.sent_at, m.read_at
        FROM messages AS m
        JOIN users AS u ON m.to_username = u.username
        WHERE from_username=$1
      `, [username]);

      let userMsgs = res.rows.map(ele => ({
        "id": m.id,
        "to_user": {
          "username": m.to_username,
          "first_name": u.first_name,
          "last_name": u.last_nam,
          "phone": u.phone
        },
        "body": m.body,
        "sent_at": m.sent_at,
        "read_at": m.read_at
      }));

      return userMsgs;
    }
    catch (err) {
      return next(err);
    }
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    try {
      const res = await db.query(`
        SELECT m.id, m.from_username, u.first_name, u.last_name, u.phone, m.body, m.sent_at, m.read_at
        FROM messages AS m
        JOIN users AS u ON m.from_username = u.username
        WHERE from_username=$1
      `, [username]);

      let userMsgs = res.rows.map(ele => ({
        "id": m.id,
        "from_user": {
          "username": m.from_username,
          "first_name": u.first_name,
          "last_name": u.last_nam,
          "phone": u.phone
        },
        "body": m.body,
        "sent_at": m.sent_at,
        "read_at": m.read_at
      }));

      return userMsgs;
    }
    catch (err) {
      return next(err);
    }
  }
}


module.exports = User;