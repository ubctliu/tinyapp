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
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
  }
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
  const id = req.params.id;
  if (!Object.prototype.hasOwnProperty.call(urlDatabase, id)) {
    res.status(404).send("404 Error. Resource not found.");
    return;
  }
  const longURL = urlDatabase[id];
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  }
  const user = req.cookies ? users[req.cookies["user_id"]] : undefined;
  const templateVars = {
    user
  };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  }
  const user = req.cookies ? users[req.cookies["user_id"]] : undefined;
  const templateVars = {
    user
  };
  res.render("login", templateVars);
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
  if (user !== null) {
    if (verifyPassword(user, password)) {
      const cookie = user.id;
      res.cookie('user_id', cookie);
      res.redirect('/urls');
      return;
    } else {
      res.status(401).send("Incorrect password!");
      return;
    }
  }
  res.status(400).send("No account found with that email");
  return;
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
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
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.status(401).send("You must be logged in to shorten URLs!");
    return;
  }
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  
  urlDatabase[shortURL] = longURL; // saves the longURL & shortURL
  
  res.redirect(`/urls/${shortURL}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
