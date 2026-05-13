const mysql = require('mysql2');

const articles = [
    {
        title: "The Rise of AI in Everyday Life",
        author: "Aman Sharma",
        content: "Artificial Intelligence is transforming how we interact with technology in our daily lives...",
        image: "https://example.com/images/ai.jpg",
        city: "Jaipur",
        state_id: 15,
        category_id: 1
    },
    {
        title: "Exploring the Beauty of Himachal",
        author: "Neha Verma",
        content: "Himachal Pradesh offers breathtaking views, serene landscapes, and adventurous trails...",
        image: "https://example.com/images/himachal.jpg",
        city: "Manali",
        state_id: 15,
        category_id: 2
    },
    {
        title: "Startup Culture in India",
        author: "Rahul Mehta",
        content: "India's startup ecosystem is growing rapidly with innovation across sectors...",
        image: "https://example.com/images/startup.jpg",
        city: "Bangalore",
        state_id: 15,
        category_id: 3
    },
    {
        title: "Healthy Living Tips for Students",
        author: "Priya Singh",
        content: "Maintaining a healthy lifestyle as a student requires balanced diet, exercise, and proper sleep...",
        image: "https://example.com/images/health.jpg",
        city: "Delhi",
        state_id: 15,
        category_id: 4
    }
];

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'folkbharat',
    password: 'Auto@4321'
});


articles.forEach(article => {
    const q = `
    INSERT INTO articles (title, author, image, content, city, state_id, category_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

    connection.query(
        q,
        [
            article.title,
            article.author,
            article.image,
            article.content,
            article.city,
            article.state_id,
            article.category_id
        ],
        (err, result) => {
            if (err) {
                console.log("Error inserting:", err);
            } else {
                console.log("Inserted:", result.insertId);
            }
        }
    );
});