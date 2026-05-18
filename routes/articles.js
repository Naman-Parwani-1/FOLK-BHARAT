const express = require("express");

const router = express.Router();

const mysql = require("mysql2");

const multer = require("multer");

const { isLoggedIn, isOwner } = require("../middleware.js");

require("dotenv").config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

//MULTER MEMORY STORAGE
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage
});

//ALL ROUTE
router.get("/", (req, res) => {
    let q = `SELECT * FROM articles WHERE status = 'approved'`;
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
            res.render("articles/all.ejs", { articles });
        });
    }
    catch (err) {
        res.send("some error occurred");
    }
});

//CATEGORY ROUTE
router.get("/category/:id", (req, res) => {

    let { id } = req.params;

    let q = `
    
    SELECT articles.*, category.*
    
    FROM articles
    
    JOIN category
    
    ON articles.category_id = category.category_id
    
    WHERE category.category_id = ? AND status = 'approved'
    
    `;

    connection.query(q, [id], (err, results) => {

        if (err) {
            console.log(err);
            return res.send("Database Error");
        }

        const articles = results.map(article => {

            let image = "";

            if (article.image) {

                const base64Image =
                    article.image.toString("base64");

                image =
                    `data:image/jpeg;base64,${base64Image}`;
            }

            return {
                id: article.id,
                title: article.title,
                author: article.author,
                image,
                category_name: article.category_name
            };

        });

        res.render("articles/category.ejs", {
            articles,
            categoryName: articles[0]?.category_name
        });

    });

});

//STATES ROUTE
router.get("/states/:id", (req, res) => {

    let { id } = req.params;

    let q = `
    
    SELECT articles.*, category.*, states.*
    
    FROM articles
    
    JOIN category
    ON articles.category_id = category.category_id
    
    JOIN states
    ON articles.state_id = states.state_id
    
    WHERE states.state_id = ? AND status = 'approved'
    
    `;

    connection.query(q, [id], (err, results) => {

        if (err) {
            console.log(err);
            return res.send("Database Error");
        }

        const articles = results.map(article => {

            let image = "";

            if (article.image) {

                const base64Image =
                    article.image.toString("base64");

                image =
                    `data:image/jpeg;base64,${base64Image}`;
            }

            return {
                id: article.id,
                title: article.title,
                author: article.author,
                image,
                state_name: article.state_name
            };

        });

        res.render("articles/states.ejs", {
            articles,
            stateName: articles[0]?.state_name
        });

    });

});

//RANDOM ARTICLE ROUTE
router.get("/random", (req, res) => {

    let q = `
    
    SELECT 
        articles.*, 
        category.category_name,
        states.state_name
        
    FROM articles
    
    JOIN category
    ON articles.category_id = category.category_id
    
    JOIN states
    ON articles.state_id = states.state_id
    
    WHERE status = 'approved'

    ORDER BY RAND()
    
    LIMIT 1
    
    `;

    connection.query(q, (err, result) => {

        if (err) {
            console.log(err);
            return res.send("Database Error");
        }

        let article = result[0];

        res.render("articles/show.ejs", {
            article
        });

    });

});

//MAP ROUTE
router.get("/map", (req, res) => {

    res.render("articles/map.ejs");

});

//SEARCH ROUTE
router.get("/search", (req, res) => {

    const search = req.query.q;

    if (!search) {

        return res.render("articles/search.ejs", {
            articles: [],
            search: ""
        });

    }

    let q = `
    
    SELECT 
        a.id,
        a.title,
        a.content,
        a.image,
        a.city,
        a.author,
        c.category_name,
        s.state_name,
        u.username
        
    FROM articles a
    
    LEFT JOIN category c
    ON a.category_id = c.category_id
    
    LEFT JOIN states s
    ON a.state_id = s.state_id
    
    LEFT JOIN users u
    ON a.u_id = u.u_id
    
    WHERE
    (
        a.title LIKE ?
        OR a.content LIKE ?
        OR a.author LIKE ?
        OR a.city LIKE ?
        OR c.category_name LIKE ?
        OR s.state_name LIKE ?
        OR u.username LIKE ?
    )
    AND a.status = 'approved'
    
    ORDER BY a.id DESC
    
    LIMIT 10
    
    `;

    const keyword = `%${search}%`;

    connection.query(

        q,

        [
            keyword,
            keyword,
            keyword,
            keyword,
            keyword,
            keyword,
            keyword
        ],

        (err, results) => {

            if (err) {
                console.log(err);
                return res.send("Database Error");
            }

            const articles = results.map(article => {

                if (article.image) {

                    const base64Image =
                        article.image.toString("base64");

                    article.image =
                        `data:image/jpeg;base64,${base64Image}`;
                }

                return article;

            });

            res.render("articles/search.ejs", {
                articles,
                search
            });

        }

    );

});

//NEW ROUTE
router.get("/new", isLoggedIn, (req, res) => {

    let stateQuery = `SELECT * FROM states`;

    let categoryQuery = `SELECT * FROM category`;

    connection.query(stateQuery, (err, states) => {

        if (err) {
            console.log(err);
            return res.send("Database Error");
        }

        connection.query(categoryQuery, (err, categories) => {

            if (err) {
                console.log(err);
                return res.send("Database Error");
            }

            res.render("articles/new.ejs", {
                states,
                categories
            });

        });

    });

});

//CREATE ROUTE
router.post("/", isLoggedIn, upload.single("image"), (req, res) => {
    let status = "pending";
    if (req.user.role === "admin" || req.user.role === "author") {
        status = "approved";
    }
    let { title, author, content, city, state_id, category_id } = req.body;
    let u_id = req.user.u_id;
    const imageBuffer = req.file.buffer;
    let q = `INSERT INTO articles (title, author, content, image, city, state_id, category_id, u_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    try {
        connection.query(q, [title, author, content, imageBuffer, city, state_id, category_id, u_id, status], (err, result) => {
            if (err) {
                console.log(err);
                return res.send("Database Error");
            }
            res.redirect("/articles");
        });
    }
    catch (err) {
        res.send("something went wrong");
    }
});

// EDIT ROUTE
router.get("/:id/edit", isLoggedIn, isOwner, (req, res) => {
    let { id } = req.params;
    let q1 = `SELECT * FROM articles WHERE id = ${id}`;
    let q2 = `SELECT * FROM category`;
    let q3 = `SELECT * FROM states`;
    try {
        connection.query(q1, (err, articleResult) => {
            if (err) throw err;
            connection.query(q2, (err, categories) => {
                if (err) throw err;
                connection.query(q3, (err, states) => {
                    if (err) throw err;
                    let article = articleResult[0];
                    if (article.image) {
                        const base64Image = article.image.toString("base64");
                        article.image = `data:image/jpeg;base64,${base64Image}`;
                    }
                    res.render("articles/edit.ejs", { article, categories, states });
                });
            });
        });
    }
    catch (err) {
        console.log(err);
        res.send("Some error occurred");
    }
});

//UPDATE ROUTE 
router.put("/:id", isLoggedIn, isOwner, upload.single("image"), (req, res) => {
    let { id } = req.params;
    let status = "pending";

    if (req.user.role === "admin" || req.user.role === "author") {
        status = "approved";
    }
    let { title, author, content, city, state_id, category_id,} = req.body;
    let q1 = `SELECT image FROM articles WHERE id = '${id}'`;
    connection.query(q1, (err, result) => {
        if (err) throw err;
        let oldImage = result[0].image;
        let image = oldImage;
        if (req.file) {
            image = req.file.buffer;
        }
        let q2 = `UPDATE articles SET title = ?, author = ?, content = ?, image = ?, city = ?, state_id = ?, category_id = ?, status = ? WHERE id = ? `;
        connection.query(q2, [title, author, content, image, city, state_id, category_id, status, id], (err, result) => {
            if (err) throw err;
            res.redirect(`/articles/${id}`);
        }
        );
    });
});

//DELETE ROUTE
router.delete("/:id", isLoggedIn, isOwner, (req, res) => {
    let { id } = req.params;
    let q = `DELETE FROM articles WHERE id = ?`;
    try {
        connection.query(q, [id], (err, result) => {
            if (err) throw err;
            res.redirect("/articles");
        }
        );
    }
    catch (err) {
        res.send("something went wrong");
    }
});

//SHOW ROUTE
router.get("/:id", (req, res) => {

    let { id } = req.params;

    let q = `
    
    SELECT 
        articles.*,
        category.category_name,
        states.state_name,
        users.*
        
    FROM articles
    
    JOIN category
    ON articles.category_id = category.category_id
    
    JOIN states
    ON articles.state_id = states.state_id

    JOIN users
    ON articles.u_id = users.u_id
    
    WHERE articles.id = ? AND articles.status = 'approved'
    
    `;

    connection.query(q, [id], (err, result) => {

        if (err) {
            console.log(err);
            return res.send("Database Error");
        }

        let article = result[0];

        res.render("articles/show.ejs", { article });

    });

});

module.exports = router;