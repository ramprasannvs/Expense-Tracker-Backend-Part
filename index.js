const express = require("express");
const app = express();
const bodyParser = require("body-parser");
require("dotenv").config();


const cors = require("cors");

require('./Models/db')

const AuthRouter = require("./Routes/AuthRouter");
const ExpenseRouter = require("./Routes/ExpenseRouter");
const ensureAuthenticated = require("./Middlewares/Auth");

const PORT = process.env.PORT || 8081;

app.use(bodyParser.json());
app.use(cors());


app.get("/", (req, res) => {
    res.send("PONG");
});

app.use("/auth", AuthRouter);
app.use("/expenses", ensureAuthenticated, ExpenseRouter);

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
