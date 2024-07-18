const express = require('express')
const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const dbPath = path.join(__dirname, 'notes.db')
const jwt = require('jsonwebtoken')
let db = null

const initializeDbAndServer = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  })

  app.listen(3000, () => {
    console.log('Server Running at http://localhost:3000/')
  })
}

initializeDbAndServer()

// ... other API endpoints (register, login, etc.) ...
app.post('/register/', async (request, response) => {
  const {user_id, username, password, name, gender} = request.body

  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await db.get(selectUserQuery)

  if (dbUser === undefined) {
    if (password.length < 6) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const hashingPassword = await bcrypt.hash(password, 10)

      const addUserQuery = `
            INSERT INTO
               user (user_id , username , password , name , gender)
            VALUES
            (
              '${user_id}',
              '${username}',
              '${hashingPassword}',
              '${name}',
              '${gender}'
            );`

      await db.run(addUserQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//Login API

app.post('/login/', async (request, response) => {
  const {username, password} = request.body

  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const validatePassword = await bcrypt.compare(password, dbUser.password)

    if (validatePassword) {
      const jwtToken = await jwt.sign(dbUser, 'asdfghjkl')

      response.send({jwtToken})
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

const authenticateJwtToken = (request, response, next) => {
  let jwtToken

  const authHeader = request.headers['authorization']

  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }

  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'asdfghjkl', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        request.userId = payload.user_id
        next()
      }
    })
  }
}

// Posting Note (assuming note_id is auto-incrementing
app.post('/user/notes/', authenticateJwtToken, async (request, response) => {
  const {userId} = request
  const {title, description} = request.body

  const postNoteQuery = `
    INSERT INTO notes (user_id, title, description)
    VALUES (?, ?, ?);
  `

  try {
    await db.run(postNoteQuery, [userId, title, description])
    response.send('Created a Note')
  } catch (err) {
    console.error(err)
    response.status(500).send('Internal Server Error')
  }
})

// Get all notes of a user
app.get('/user/notes/', authenticateJwtToken, async (request, response) => {
  const { userId } = request;
  console.log(userId);

  try {
    const getNotesOfUser = `
      SELECT notes.title, notes.description, notes.note_id
      FROM notes
      INNER JOIN user ON user.user_id = notes.user_id
      WHERE notes.user_id = ?;
    `;

    const responseArray = await db.all(getNotesOfUser, [userId]);
    console.log(responseArray); // Log retrieved data
    response.send(responseArray);
  } catch (err) {
    console.error(err);
    response.status(500).send('Internal Server Error');
  }
});


module.exports = app

/*
const express = require('express')
const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const dbPath = path.join(__dirname, 'notes.db')
const jwt = require('jsonwebtoken')
let db = null

const initializeDbAndServer = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  })

  app.listen(3000, () => {
    console.log('Server Running at http://localhost:3000/')
  })
}

initializeDbAndServer()

//Register API
app.post('/register/', async (request, response) => {
  const {user_id, username, password, name, gender} = request.body

  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await db.get(selectUserQuery)

  if (dbUser === undefined) {
    if (password.length < 6) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const hashingPassword = await bcrypt.hash(password, 10)

      const addUserQuery = `
            INSERT INTO
               user (user_id , username , password , name , gender)
            VALUES
            (
              '${user_id}',
              '${username}',
              '${hashingPassword}',
              '${name}',
              '${gender}'
            );`

      await db.run(addUserQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//Login API

app.post('/login/', async (request, response) => {
  const {username, password} = request.body

  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const validatePassword = await bcrypt.compare(password, dbUser.password)

    if (validatePassword) {
      const jwtToken = await jwt.sign(dbUser, 'asdfghjkl')

      response.send({jwtToken})
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

const authenticateJwtToken = (request, response, next) => {
  let jwtToken

  const authHeader = request.headers['authorization']

  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }

  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'asdfghjkl', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        request.userId = payload.user_id
        next()
      }
    })
  }
}

//Posting Note

app.post('/user/notes/', authenticateJwtToken, async (request, response) => {
  const {userId} = request
  const {title, description} = request.body

  const postNoteQuery = `
    INSERT INTO notes (user_id, title, description)
    VALUES (?, ?, ?);
  `

  try {
    await db.run(postNoteQuery, [userId, title, description])
    response.send('Created a Note')
  } catch (err) {
    console.error(err)
    response.status(500).send('Internal Server Error')
  }
})

app.delete('/notes/:noteId', authenticateJwtToken, async (req, res) => {
  const {noteId} = req.params

  try {
    const deleteNoteQuery = `
      DELETE FROM notes
      WHERE note_id = ?;
    `

    await db.run(deleteNoteQuery, [noteId])
    if (db.changes === 0) {
      return res.status(404).send('Note not found')
    }

    res.send('Note Removed')
  } catch (err) {
    console.error(err)
    res.status(500).send('Internal Server Error')
  }
})

app.get('/user/notes/', authenticateJwtToken, async (request, response) => {
  const {userId} = request
  console.log(userId)
  try {
    const getNotesOfUser = `
      SELECT notes.title, notes.description, notes.note_id
      FROM notes
      INNER JOIN user ON user.user_id = notes.user_id
      WHERE notes.user_id = ?;
    `

    const responseArray = await db.all(getNotesOfUser, [userId])
    response.send(responseArray)
  } catch (err) {
    console.error(err)
    response.status(500).send('Internal Server Error')
  }
})



app.get('/user/notes/', authenticateJwtToken, async (request, response) => {
  const {userId} = request

  const getNotesOfUser = `
       SELECT
         notes.title , notes.description
       FROM
         (notes INNER JOIN user ON user.user_id = notes.user_id)
       WHERE notes.user_id = ${userId};
    `

  const responseArray = await db.all(getNotesOfUser)

  response.send(responseArray)
})
*/

module.exports = app
