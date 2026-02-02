const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');

const app = express();

app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));



const connection = mysql.createConnection({
    host: 'localhost',      // Database host
    user: 'root',           // Your database username
    password: 'root',   // Your Connection password
    database: 'projectdiary' // The name of the database
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database!');
});

app.use(express.json());

app.get('/', (req, res) => {
    console.log(req)
    res.status(200).json({ message: 'Sucessful' })
})

app.post('/registerUser', async (req, res) => {
    console.log(req.body);

    const { email, password } = req.body;

    // 1️⃣ Validation
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
    }

    try {
        // 2️⃣ Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Hashed Password:", hashedPassword);

        // 3️⃣ Insert into DB
        connection.query(
            "INSERT INTO Users (EmailID, HashedPassword) VALUES (?, ?)",
            [email, hashedPassword],
            (err, results) => {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: "Database error",
                        error: err.message
                    });
                }

                // 4️⃣ Success JSON response
                return res.status(200).json({
                    success: true,
                    message: " registered successfully"
                });
            }
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Error while hashing password"
        });
    }
});


app.post('/userLogin', async (req, res) => {
    console.log("User logged in: ", req.body);
    const { email, password } = req.body;
    console.log(req.body);

    // let hashedPassword="asasasasasas"
    // let hashedPassword = "$2b$10$gHIyn9AKUkhoULo5BVkz5ul/wuNoV/PLLFUFE9ELum2XFbWPfvp7e";
    let hashedPassword = '';
    let userID = ''
    connection.query(`select ID,HashedPassword from Users where EmailID='${email}'`, async (err, result) => {
        if (err) {
            res.status(500);
            return
        }
        // console.log("Line 63: ",result);
        hashedPassword = result[0].HashedPassword;
        userID = result[0].ID;
        let response = await bcrypt.compare(password, hashedPassword)
        if (response) {
            res.status(200).json({ userID: userID });
            return
        }
        else {
            res.status(500)
            return
        }
    })

    // console.log('Is same? ', response);
})


app.post('/newPost', async (req, res) => {

    const { postTitle, postDescription, userID } = req.body;
    console.log(postTitle, postDescription, userID )
    connection.query(`insert into Posts(UserID,postTitle,postDescription) values(${userID},"${postTitle}","${postDescription}")`, async (err, response) => {
        if (err) {
            res.status(500);
            return
        }
     res.status(200).send("Post saved successfully");
    

    })


})


// ✅ API to get posts of logged-in user
app.get('/getMyPosts', (req, res) => {
  const { userID } = req.query;

  if (!userID) {
    return res.status(400).send("UserID required");
  }

  const query = `
    SELECT ID, postTitle, postDescription
    FROM Posts
    WHERE UserID = ?
    ORDER BY ID DESC
  `;

  connection.query(query, [userID], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Database error");
    }
    res.status(200).json(result);
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});


app.get('/getPostById', (req, res) => {
    const { postID } = req.query;

    if (!postID) {
        return res.status(400).send("postID required");
    }

    const query = `
      SELECT postTitle, postDescription
      FROM Posts
      WHERE ID = ?
    `;

    connection.query(query, [postID], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database error");
        }

        if (result.length === 0) {
            return res.status(404).send("Post not found");
        }

        res.status(200).json(result[0]);
    });
});

app.listen(3000, () => {
    console.log('Server Started on port 3000!')
})



