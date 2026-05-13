const express = require("express");
const router = express.Router();

const mysql = require("mysql2");

const { isLoggedIn, isAdmin } = require("../middleware");

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "folkbharat",
    password: "Auto@4321",
});

//ADMIN DASHBOARD
router.get("/dashboard", isLoggedIn, isAdmin, (req, res) => {
    let totalArticlesQuery =
        `SELECT COUNT(*) AS totalArticles 
        FROM articles 
        WHERE status = 'approved'`;

    let pendingArticlesQuery =
        `SELECT COUNT(*) AS pendingArticles 
        FROM articles 
        WHERE status = 'pending'`;

    let rejectedArticlesQuery =
        `SELECT COUNT(*) AS rejectedArticles 
        FROM articles 
        WHERE status = 'rejected'`;

    let totalUsersQuery =
        `SELECT COUNT(*) AS totalUsers 
        FROM users`;

    let totalUserAccessQuery =
        `SELECT COUNT(*) AS totalUserAccess 
         FROM users 
         WHERE role = 'user'`;

    let totalAuthorsQuery =
        `SELECT COUNT(*) AS totalAuthors 
         FROM users 
         WHERE role = 'author'`;

    let totalAdminsQuery =
        `SELECT COUNT(*) AS totalAdmins 
         FROM users 
         WHERE role = 'admin'`;

    let pendingArticlesListQuery =
        `SELECT articles.*, users.username    
        FROM articles
        JOIN users
        ON articles.u_id = users.u_id
        WHERE articles.status = 'pending'
        ORDER BY articles.id DESC`;

    let usersQuery =
        `SELECT * 
        FROM users 
        ORDER BY u_id DESC`;

    connection.query(totalArticlesQuery, (err, totalArticlesResult) => {
        if (err) {
            console.log(err);
            return res.send("Database Error");
        }

        connection.query(pendingArticlesQuery, (err, pendingArticlesResult) => {
            if (err) {
                console.log(err);
                return res.send("Database Error");
            }

            connection.query(rejectedArticlesQuery, (err, rejectedArticlesResult) => {
                if (err) {
                    console.log(err);
                    return res.send("Database Error");
                }

                connection.query(totalUsersQuery, (err, totalUsersResult) => {
                    if (err) {
                        console.log(err);
                        return res.send("Database Error");
                    }

                    connection.query(totalAuthorsQuery, (err, totalAuthorsResult) => {
                        if (err) {
                            console.log(err);
                            return res.send("Database Error");
                        }

                        connection.query(totalAdminsQuery, (err, totalAdminsResult) => {
                            if (err) {
                                console.log(err);
                                return res.send("Database Error");
                            }

                            connection.query(pendingArticlesListQuery, (err, pendingArticles) => {
                                if (err) {
                                    console.log(err);
                                    return res.send("Database Error");
                                }

                                connection.query(usersQuery, (err, users) => {
                                    if (err) {
                                        console.log(err);
                                        return res.send("Database Error");
                                    }

                                    connection.query(totalUserAccessQuery, (err, totalUserAccessResult) => {
                                    if (err) {
                                        console.log(err);
                                        return res.send("Database Error");
                                    }

                                    res.render(
                                        "admin/dashboard.ejs",
                                        {
                                            totalArticles:
                                                totalArticlesResult[0].totalArticles,

                                            pendingArticlesCount:
                                                pendingArticlesResult[0].pendingArticles,

                                            rejectedArticlesCount:
                                                rejectedArticlesResult[0].rejectedArticles,

                                            totalUsersCount:
                                                totalUsersResult[0].totalUsers,

                                            totalAuthorsCount:
                                                totalAuthorsResult[0].totalAuthors,

                                            totalAdminsCount:
                                                totalAdminsResult[0].totalAdmins,

                                            totalUserAccessCount:
                                                totalUserAccessResult[0].totalUserAccess,

                                            pendingArticles,

                                            users
                                        }
                                    );

                                });

                                });

                            });

                        });

                    });

                });

            });

        });

    });

});

//APPROVE ROUTE
router.put("/articles/:id/approve", isLoggedIn, isAdmin, (req, res) => {
        let { id } = req.params;
        let q = `UPDATE articles
            SET status = 'approved'
            WHERE id = ?`;
        connection.query(q, [id], (err, result) => {
            if(err){
                console.log(err);
                return res.send("Database Error");
            }
            req.flash("success", "Article Approved Successfully");
            res.redirect("/admin/dashboard");
        });
});

//REJECT ROUTE
router.put("/articles/:id/reject", isLoggedIn, isAdmin, (req, res) => {
    let { id } = req.params;
    let q = `UPDATE articles
        SET status = 'rejected'
        WHERE id = ?`;
    connection.query(q, [id], (err, result) => {
        if(err){
            console.log(err);
            return res.send("Database Error");
        }
        req.flash("success", "Article Rejected");
        res.redirect("/admin/dashboard");
    });
});

//UPDATE USER ROLE ROUTE
router.post("/users/:id/role", isLoggedIn, isAdmin, (req, res) => {
    let { id } = req.params;
    let { role } = req.body;
    let q = `UPDATE users
        SET role = ?
        WHERE u_id = ?`;
    connection.query(q, [role, id], (err, result) => {
        if(err){
            console.log(err);
            return res.send("Database Error");
        }
        req.flash("success", "User Role Updated");
        res.redirect("/admin/dashboard");
    });
});

module.exports = router;