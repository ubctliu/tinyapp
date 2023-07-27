const { assert } = require('chai');
const bcrypt = require("bcryptjs");

const { getUserByEmail, verifyPassword, urlsForUser } = require('../helpers.js');

const testURLDatabase = {
  "b9m7n2": {
    shortURL: "b9m7n2",
    longURL: "http://google.com",
    userID: "userRandomID"
  },
  "b9m7n3": {
    shortURL: "b9m7n3",
    longURL: "http://google.com",
    userID: "userRandomID"
  }
};

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    hashedPassword: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    hashedPassword: bcrypt.hashSync("dishwasher-funk", 10)
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.strictEqual(user, testUsers[expectedUserID]);
  });

  it('should return undefined for email not in users database', function() {
    const user = getUserByEmail("user1@example.com", testUsers);
    const expectedUserID = undefined;
    assert.strictEqual(user, expectedUserID);
  });
});

describe('verifyPassword', function() {
  it('should return true for a correct password', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const password = "purple-monkey-dinosaur";
    assert.isTrue(verifyPassword(user, password));
  });

  it('should return false for an incorrect password', function() {
    const user = getUserByEmail("user2@example.com", testUsers);
    const password = "purple-monkey-dinosaur";
    assert.isFalse(verifyPassword(user, password));
  });

  it('should return false for an empty password', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const password = "";
    assert.isFalse(verifyPassword(user, password));
  });

  it('should return false for an invalid user', function() {
    const user = getUserByEmail("user1@example.com", testUsers);
    const password = "";
    assert.isFalse(verifyPassword(user, password));
  });
});

describe('urlsForUser', function() {
  it('should return results for a user with urls', function() {
    const expectedReturn = {
      "b9m7n2": {
        shortURL: "b9m7n2",
        longURL: "http://google.com",
        userID: "userRandomID"
      },
      "b9m7n3": {
        shortURL: "b9m7n3",
        longURL: "http://google.com",
        userID: "userRandomID"
      }
    };
    const user = getUserByEmail("user@example.com", testUsers);
    assert.deepEqual(urlsForUser(user.id, testURLDatabase), expectedReturn);
  });

  it('should return no results for a user with no urls', function() {
    const expectedReturn = {};
    const user = getUserByEmail("user2@example.com", testUsers);
    assert.deepEqual(urlsForUser(user.id, testURLDatabase), expectedReturn);
  });

  it('should return no results for an invalid user', function() {
    const user = getUserByEmail("user1@example.com", testUsers);
    const expectedReturn = {};
    assert.deepEqual(urlsForUser(user, testURLDatabase), expectedReturn);
  });
});