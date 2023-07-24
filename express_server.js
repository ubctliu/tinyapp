const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080
const GENERATE_RANDOM_STRING_LENGTH = 6;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};

// Generates a random 6 digit alpha-numeric string
const generateRandomString = () => {
  const randomURL = Math.random().toString(36).slice(2);
  return randomURL.length > GENERATE_RANDOM_STRING_LENGTH ? randomURL.substring(0, GENERATE_RANDOM_STRING_LENGTH) : randomURL;
};

const getUserByEmail = (email) => {
  for (const user in users) {
    if (Object.prototype.hasOwnProperty.call(users[user], "email") && users[user].email === email) {
      return users[user];
    }
  }

  return null;
};

const verifyPassword = (user, password) => {
  if (user !== null) {
    if (password === user.password) {
      return true;
    }
  }
  return false;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls/new", (req, res) => {
  const user = req.cookies ? users[req.cookies["user_id"]] : undefined;
  const templateVars = {
    user
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const user = req.cookies ? users[req.cookies["user_id"]] : undefined;
  const templateVars = {
    user,
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  const user = req.cookies ? users[req.cookies["user_id"]] : undefined;
  const templateVars = {
    user,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/register", (req, res) => {
  console.log(users);
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (email === "" || id === "") {
    res.status(400).send("Fields cannot be blank.");
    return;
  }

  if (getUserByEmail(email) !== null) {
    res.status(400).send("Email already in use!");
    return;
  }

  const cookie = id;
  users[id] = {id, email, password};
  res.cookie('user_id', cookie);
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email);
  if (verifyPassword(user, password)) {
    res.render('urls');
  } else {
    res.status(401).send("Incorrect email or password.");
    return;
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  res.redirect('/urls/');
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

  urlDatabase[shortURL] = longURL; // saves the longURL & shortURL

  res.redirect(`/urls/${shortURL}`);
});

app.post("/login", (req, res) => {
  const cookie = req.body.username;
  res.cookie('username', cookie);
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});