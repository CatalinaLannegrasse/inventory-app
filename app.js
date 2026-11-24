// app.js
const express = require("express");
const path = require("path");
require("dotenv").config();

const categoryRouter = require("./routes/categoryRouter");
const itemRouter = require("./routes/itemRouter");
const brandRouter = require("./routes/brandRouter");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.redirect("/categories");
});

app.use("/categories", categoryRouter);
app.use("/items", itemRouter);
app.use("/brands", brandRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).render("error", {
    title: "Page Not Found",
    message: "The page you're looking for doesn't exist.",
  });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).render("error", {
    title: "Server Error",
    message: "Something went wrong on our end.",
  });
});

app.listen(PORT, () => {
  console.log(`Inventory app listening on http://localhost:${PORT}`);
});