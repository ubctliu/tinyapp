const express = require("express");
const cookieSession = require("cookie-session");
const methodOverride = require('method-override');
const { getUserByEmail, generateRandomString, verifyPassword, urlsForUser } = require('./helpers');
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(methodOverride('_method'));
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

app.get("/", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    res.redirect("/urls");
  }

  res.redirect("/login");
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
  if (!urlDatabase[id]) {
    res.status(404).send("<h1>Error occurred. </h1> <p>Resource not found!</p>");
    return;
  }
  if (!userID) {
    res.status(401).send("<h1>Error occurred. </h1> <p>Must be logged in to view URLs!</p>");
    return;
  }
  if (userID !== urlDatabase[id].userID) {
    res.status(403).send("<h1>Error occurred. </h1> <p>This URL doesn't belong to you!</p>");
    return;
  }
  const templateVars = {
    user,
    id,
    longURL: urlDatabase[id].longURL,
    creationTime: urlDatabase[id].creationTime,
    visitorCount: urlDatabase[id].visitorCount ? urlDatabase[id].visitorCount : 0,
    visitorList: urlDatabase[id].visitorList ? urlDatabase[id].visitorList : []
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
    urls: urlsForUser(userID, urlDatabase)
  };
  res.render("urls_index", templateVars);
});

app.get("/u/:id", (req, res) => {
  const { id } = req.params;
  const userID = req.session.user_id;
  const date = new Date();

  if (!urlDatabase[id]) {
    res.status(404).send("<h1>Error occurred.</h1><p>Resource not found.</p>");
    return;
  }

  const longURL = urlDatabase[id].longURL;
  urlDatabase[id]["visitorCount"] = urlDatabase[id]["visitorCount"] ? urlDatabase[id]["visitorCount"] : 0;
  urlDatabase[id].visitorCount++;
  urlDatabase[id]["visitorList"] = urlDatabase[id]["visitorList"] ? urlDatabase[id]["visitorList"] : [];

  if (!urlDatabase[id].visitorList.includes(userID)) {
    urlDatabase[id].visitorList.push({ userID, date });
  }
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
  
  if (email === "" || password === "") {
    res.status(400).send("<h1>Error occurred!</h1><p>Fields cannot be blank.</p>");
    return;
  }

  if (getUserByEmail(email) !== undefined) {
    res.status(400).send("<h1>Error occurred!</h1><p>Email already in use!</p>");
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  users[id] = { id, email, hashedPassword };
  req.session.user_id = id;
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);
  if (user !== undefined) {
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

app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  const creationTime = new Date();
  if (!userID) {
    res.status(401).send("<h1>Error occurred!</h1><p>You must be logged in to shorten URLs! </p>");
    return;
  }
  const shortURL = generateRandomString();
  const { longURL } = req.body;

  urlDatabase[shortURL] = { // saves the longURL & shortURL
    longURL,
    userID,
    creationTime
  };
  
  res.redirect(`/urls/${shortURL}`);
});

app.delete("/urls/:id/delete", (req, res) => {
  const { id } = req.params;
  const userID = req.session.user_id;
  if (!urlDatabase[id]) {
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

app.put("/urls/:id", (req, res) => {
  const { id } = req.params;
  const { longURL } = req.body;
  const userID = req.session.user_id;
  if (!urlDatabase[id]) {
    res.status(404).send("<h1>Error occurred.</h1><p>Resource not found.</p>");
    return;
  }
  if (!userID) {
    res.status(401).send("<h1>Error occurred. </h1> <p>Must be logged in to edit URLs!</p>");
    return;
  }
  if (urlDatabase[id].userID !== userID) {
    res.status(403).send("<h1>Error occurred.</h1><p>URL doesn't belong to you!</p>");
    return;
  }
  urlDatabase[id].longURL = longURL;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
