const express = require("express");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080
const GENERATE_RANDOM_STRING_LENGTH = 6;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['top secret key'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ48lW"
  }
};

const users = {};

// Generates a random 6 digit alpha-numeric string
const generateRandomString = () => {
  const randomURL = Math.random().toString(36).slice(2);
  return randomURL.length > GENERATE_RANDOM_STRING_LENGTH ? randomURL.substring(0, GENERATE_RANDOM_STRING_LENGTH) : randomURL;
};

// Takes a email string and returns either an user object if found or null if not
const getUserByEmail = (email) => {
  for (const user in users) {
    if (Object.prototype.hasOwnProperty.call(users[user], "email") && users[user].email === email) {
      return users[user];
    }
  }

  return null;
};

// Takes a user object and a password string, returning true if password is correct and false otherwise
const verifyPassword = (user, password) => {
  if (user !== null) {
    if (bcrypt.compareSync(password, user.hashedPassword)) {
      return true;
    }
  }
  return false;
};

// Takes an id string and returns an object containing all URL objects owned by that id
const urlsForUser = (id) => {
  let ownedURLS = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      ownedURLS[url] = urlDatabase[url];
    }
  }
  return ownedURLS;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.redirect("/login");
    return;
  }
  const user = users[userID];
  const templateVars = {
    user
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const { id } = req.params;
  const userID = req.session.user_id;
  const user = users[userID];
  const templateVars = {
    user,
    id,
    longURL: urlDatabase[id].longURL
  };
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.status(401).send("<h1>Error occurred. </h1> <p>Must be logged in to view URLs!</p>");
    return;
  }
  const user = users[userID];
  const templateVars = {
    user,
    urls: urlsForUser(userID)
  };
  res.render("urls_index", templateVars);
});

app.get("/u/:id", (req, res) => {
  const { id } = req.params;
  const userID = req.session.user_id;
  if (!Object.prototype.hasOwnProperty.call(urlDatabase, id)) {
    res.status(404).send("<h1>Error occurred.</h1><p>Resource not found.</p>");
    return;
  }
  if (!userID) {
    res.status(401).send("<h1>Error occurred. </h1> <p>Must be logged in to view URLs!</p>");
    return;
  }
  if (urlDatabase[id].userID !== userID) {
    res.status(401).send("<h1>Error occurred.</h1><p>URL doesn't belong to you!</p>");
    return;
  }
  const longURL = urlDatabase[id].longURL;
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    res.redirect("/urls");
  }
  const user = users[userID];
  const templateVars = {
    user
  };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    res.redirect("/urls");
  }
  const user = users[userID];
  const templateVars = {
    user
  };
  res.render("login", templateVars);
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  if (email === "" || id === "") {
    res.status(400).send("<h1>Error occurred!</h1><p>Fields cannot be blank.</p>");
    return;
  }

  if (getUserByEmail(email) !== null) {
    res.status(400).send("<h1>Error occurred!</h1><p>Email already in use!</p>");
    return;
  }
  
  users[id] = { id, email, hashedPassword };
  req.session.user_id = id;
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email);
  if (user !== null) {
    if (verifyPassword(user, password)) {
      req.session.user_id = user.id;
      res.redirect('/urls');
      return;
    } else {
      res.status(401).send("<h1>Error occurred!</h1><p>Incorrect password!</p>");
      return;
    }
  }
  res.status(400).send("<h1>Error occurred!</h1><p>No account found with that email.</p>");
  return;
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login');
});


app.post("/urls/:id/delete", (req, res) => {
  const { id } = req.params;
  const userID = req.session.user_id;
  if (!Object.prototype.hasOwnProperty.call(urlDatabase, id)) {
    res.status(404).send("<h1>Error occurred.</h1><p>Resource not found.</p>");
    return;
  }
  if (!userID) {
    res.status(401).send("<h1>Error occurred. </h1> <p>Must be logged in to delete URLs!</p>");
    return;
  }
  if (urlDatabase[id].userID !== userID) {
    res.status(401).send("<h1>Error occurred.</h1><p>URL doesn't belong to you!</p>");
    return;
  }
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const { id } = req.params;
  const { longURL } = req.body;
  const userID = req.session.user_id;
  if (!Object.prototype.hasOwnProperty.call(urlDatabase, id)) {
    res.status(404).send("<h1>Error occurred.</h1><p>Resource not found.</p>");
    return;
  }
  if (!userID) {
    res.status(401).send("<h1>Error occurred. </h1> <p>Must be logged in to edit URLs!</p>");
    return;
  }
  if (urlDatabase[id].userID !== userID) {
    res.status(401).send("<h1>Error occurred.</h1><p>URL doesn't belong to you!</p>");
    return;
  }
  urlDatabase[id].longURL = longURL;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.status(401).send("<h1>Error occurred!</h1><p>You must be logged in to shorten URLs! </p>");
    return;
  }
  const shortURL = generateRandomString();
  const { longURL } = req.body;

  urlDatabase[shortURL] = { // saves the longURL & shortURL
    longURL: longURL,
    userID
  };
  
  res.redirect(`/urls/${shortURL}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
