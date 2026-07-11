const bcrypt = require('bcryptjs');

const passwords = {
  admin: 'Admin@123',
  lab: '123456',
  operator: '123456'
};

const rounds = 10;

Object.entries(passwords).forEach(([username, password]) => {
  const hash = bcrypt.hashSync(password, rounds);
  console.log(`${username}: '${hash}'`);
});
