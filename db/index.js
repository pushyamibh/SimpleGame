"use strict";
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const database = mongoose.createConnection(process.env.MONGODB_URI);

mongoose.connection.on("connected", function () {
  console.log("Mongoose default connection open");
});

module.exports = database;
