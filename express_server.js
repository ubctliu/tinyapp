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

// Generates a random 6 digit alpha-numeric string
const generateRandomString = () => {
  const randomURL = Math.random().toString(36).slice(2);
  return randomURL.length > GENERATE_RANDOM_STRING_LENGTH ? randomURL.substring(0, GENERATE_RANDOM_STRING_LENGTH) : randomURL;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls/new", (req, res) => {
  const username = req.cookies ? req.cookies["username"] : undefined;
  const templateVars = {
    username: username
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const username = req.cookies ? req.cookies["username"] : undefined;
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: username
  };
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  const username = req.cookies ? req.cookies["username"] : undefined;
  const templateVars = {
    urls: urlDatabase,
    username: username
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

app.post("/register", (req, res) => {
  res.redirect('/urls');
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
  res.clearCookie('username');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});