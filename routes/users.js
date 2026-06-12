const express = require("express");

const router = express.Router();

const mysql = require("mysql2");

const bcrypt = require("bcrypt");

const passport = require("passport");

const { saveRedirectUrl } = require("../middleware.js")

const { isLoggedIn } = require("../middleware");

require("dotenv").config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

//SIGNUP PAGE ROUTE
router.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
});

//SIGNUP ROUTE
router.post("/signup", async (req, res) => {
    let { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    let q = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
    try {
        connection.query(q, [username, email, hashedPassword], (err, result) => {
            if (err) {
                console.log(err);
                return res.send("Signup failed");
            }
            let user = { u_id: result.insertId, username, email };
            req.login(user, (err) => {
                if (err) {
                    console.log(err);
                    return res.send("Login Error");
                }
                req.flash("success", "Welcome to FolkBharat!");
                res.redirect("/articles");
            });
        });
    }
    catch (err) {
        res.send("Something went wrong"
        );
    }
});

//LOGIN PAGE ROUTE
router.get("/login", (req, res) => {
    delete req.session.redirectUrl;
    res.render("users/login.ejs");
});

//LOGIN ROUTE
router.post(
    "/login",
    saveRedirectUrl,
    passport.authenticate("local", {
        failureRedirect: "/users/login",
        failureFlash: true
    }),
    (req, res) => {
        req.flash("success", "Welcome back!");

        const redirectUrl = res.locals.redirectUrl || "/";
        res.redirect(redirectUrl);
    }
);

//LOGOUT ROUTE
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "Logged you out!");
        res.redirect("/users/login");
    });
});

//PROFILE PAGE
router.get("/profile", isLoggedIn, (req, res) => {
    let userId = req.user.u_id;
    let userQuery = `SELECT *
        FROM users
        WHERE u_id = ?`;
    let articlesQuery = `SELECT *
        FROM articles
        WHERE u_id = ?
        ORDER BY id DESC`;
    connection.query(userQuery, [userId], (err, userResult) => {
        if(err){
            console.log(err);
            return res.send("Database Error");
        }
        connection.query(
            articlesQuery,
            [userId],
            (err, articlesResult) => {
                if(err){
                    console.log(err);
                    return res.send("Database Error");
                }
                const articles =
                    articlesResult.map(article => {
                        let image = "";
                        if(article.image){
                            const base64Image = article.image.toString("base64");
                            image = `data:image/jpeg;base64,${base64Image}`;
                        }
                        return {
                            ...article,
                            image
                        };
                });
                res.render(
                    "users/profile.ejs",
                    {
                        user: userResult[0],
                        articles
                    }
                );
        });
    });
});

module.exports = router;