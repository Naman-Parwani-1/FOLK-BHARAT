const mysql = require("mysql2");
require("dotenv").config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

//LOGIN CHECK
module.exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must login first");
    res.redirect("/users/login");
}

//POST LOGIN PAGE
module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}

//OWNER CHECK
module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let q = `SELECT * FROM articles WHERE id = ?`;
    connection.query(q, [id], (err, results) => {
        if (err) {
            console.log(err);
            return res.send("Database Error");
        }
        let article = results[0];
        if (!article) {
            req.flash("error", "Article not found");
            return res.redirect("/");
        }
        if (req.user.role !== "admin" &&
            article.u_id != req.user.u_id) {
            req.flash("error", "You don't have permission");
            return res.redirect(`/articles/${id}`);
        }
        next();
    });
}

//ADMIN CHECK
module.exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        return next();
    }
    req.flash("error", "Admin access required");
    res.redirect("/");
}

//AUTHOR CHECK
module.exports.isAuthor = (req, res, next) => {
    if (
        req.user.role === "author" ||
        req.user.role === "admin"
    ) {
        return next();
    }
    req.flash("error", "Author access required");
    res.redirect("/");
}