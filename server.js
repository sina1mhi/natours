const mongoose = require('mongoose');

// UNCAUGHT EXCEPTION HANDLER
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION ERROR: ', err.name, err.message);
  console.log('❌ SHUTTING DOWN THE APPLICATION ...');
  process.exit(1);
});

require('dotenv').config({ path: './config.env' });
const app = require('./app');

// DATABASE CONNECTION
mongoose
  .connect(process.env.DATABASE_LOCAL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log('✔ DATABASE CONNECTED SUCCESSFULLY!'));

// STARTING THE SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  console.log(`✔ SERVER IS RUNNING ON PORT ${port} / ENVIRONMENT: ${process.env.NODE_ENV}`)
);

// UNHANDLED REJECTION (PROMISES)
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION ERROR: ', err.name, err.message);
  console.log('❌ SHUTTING DOWN THE APPLICATION ...');
  server.close(() => process.exit(1));
});
