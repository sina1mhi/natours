require('dotenv').config({ path: './config.env' });
const fs = require('fs');
const mongoose = require('mongoose');
const Tour = require('../../models/tourModel');

mongoose
  .connect(process.env.DATABASE_LOCAL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log('✔ DATABASE CONNECTED SUCCESSFULLY'));

// READING DEV-DATA
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));

// DELETE THE DOCUMENTS OF THE DB
const deleteDocs = async () => {
  try {
    await Tour.deleteMany();
    console.log('✔ DB DOCUMENTS WERE DELETED SUCCESSFULLY.');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// IMPORT THE DOCUMENTS INTO THE DB
const importDocs = async () => {
  try {
    await Tour.create(tours);
    console.log('✔ NEW DOCUMENTS WERE ADDEDD TO THE DATABASE SUCCESSFULLY.');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// SCRIPT FLAG CHECK
if (process.argv[2] === '--import') importDocs();
else if (process.argv[2] === '--delete') deleteDocs();
