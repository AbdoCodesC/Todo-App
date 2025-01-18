import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
import env from "dotenv";
env.config();

const router = express.Router();
const saltRounds = +process.env.ROUNDS;
console.log(saltRounds);

// register a new user (/auth/register)
router.post("/register", (req, res) => {
  const { username, password } = req.body;
  // encrypt the password
  const hashedPassword = bcrypt.hashSync(password, saltRounds);
  // Save the new user and hashed password
  try {
    const insertUser = db.prepare(
      `INSERT INTO users (username, password) VALUES (?, ?)`
    );
    const result = insertUser.run(username, hashedPassword);
    // now that we have a new user, we need to add a default todo for them
    const defaultTodo = "Hello:), Add your first todo!";
    const insertTodo = db.prepare(
      `INSERT INTO todos (user_id, task) VALUES (?, ?)`
    );
    insertTodo.run(parseInt(result.lastInsertRowid), defaultTodo);

    // Create a token
    const token = jwt.sign(
      { id: parseInt(result.lastInsertRowid) },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );
    res.status(201).json({ token });
  } catch (err) {
    console.log(err.message);
    res.sendStatus(503);
  }
});

// register a user (/auth/login)
router.post("/login", (req, res) => {
  try {
    const { username, password } = req.body;
    const getUser = db.prepare("SELECT * FROM users WHERE username = ?");
    const user = getUser.get(username);
    // if no user found, return
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    // if password does not match, return
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).send({ message: "Invalid password" });
    }
    // successful authentication
    console.log(user);
    const token = jwt.sign({ id: parseInt(user.id) }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    res.status(200).json({ token });
  } catch (err) {
    res.status("503").json({ error: err.message });
  }
});

export default router;
