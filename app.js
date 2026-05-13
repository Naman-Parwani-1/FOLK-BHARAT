const express = require("express");
const app = express();
const session = require("express-session");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const mysql = require("mysql2");
const multer = require("multer");
const articleRoutes = require("./routes/articles");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
require("dotenv").config();

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.engine("ejs", ejsMate);

app.use(express.urlencoded({ extended: true }));

app.use(methodOverride("_method"));

app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    touchAfter: 24 * 3600
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.use("/articles", articleRoutes);
app.use("/users", userRoutes);
app.use("/admin", adminRoutes);

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "folkbharat",
    password: "Auto@4321",
});

//MULTER MEMORY STORAGE
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage
});

//PASSPORT SETUP
passport.use(
    new LocalStrategy(
        (username, password, done) => {
            let q = `SELECT * FROM users WHERE username = ?`;
            connection.query(
                q, [username], async (err, results) => {
                    if (err) {
                        return done(err);
                    }
                    if (results.length === 0) {
                        return done(
                            null,
                            false,
                            {
                                message: "Invalid username or password"
                            }
                        );
                    }
                    const user = results[0];
                    const validPassword =
                        await bcrypt.compare(
                            password,
                            user.password
                        );
                    if (validPassword) {
                        return done(null, user);
                    }
                    else {
                        return done(
                            null,
                            false,
                            {
                                message:
                                    "Invalid username or password"
                            }
                        );
                    }
                }
            );
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.u_id);
});

passport.deserializeUser((id, done) => {
    let q = `SELECT * FROM users WHERE u_id = ?`;
    connection.query(q, [id], (err, results) => {
        if (err) {
            return done(err);
        }
        done(null, results[0]);
    });
});

//INDEX ROUTE
app.get("/", (req, res) => {
    let q = `SELECT * FROM articles`;
    try {
        connection.query(q, (err, results) => {
            if (err) throw err;
            const articles = results.map(article => {
                let image = "";
                if (article.image) {
                    const base64Image = article.image.toString("base64");
                    image = `data:image/jpeg;base64,${base64Image}`;
                }
                return {
                    id: article.id,
                    title: article.title,
                    author: article.author,
                    image
                };
            });
            res.render("articles/index.ejs", { articles });
        });
    }
    catch (err) {
        res.send("some error occurred");
    }
});

app.listen(8080, () => {
    console.log("Server is running on port 8080");
});