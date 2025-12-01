const bcrypt = require('bcryptjs');
const password = 'your-plain-password'; // ← change this
bcrypt.hash(password, 12).then(hash => {
  console.log('Hashed password:\n', hash);
});