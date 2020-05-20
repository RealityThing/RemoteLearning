let DB_URI;

if (process.env.NODE_ENV === 'production') {
  DB_URI = process.env.MONGODB_URI;
} else {
  DB_URI = 'mongodb://localhost:27017/remotelearning5';
}

module.exports = {
  port: process.env.PORT || 5000,
  database: DB_URI,
  secretOrKey: '#$k92jfdko!@#f2FL@$22'
};
