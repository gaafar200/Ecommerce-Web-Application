const express = require("express");
const userRouter = require("./routes/userRouter");
const productRouter = require("./routes/ProductRouter");
const cookieParser = require("cookie-parser");
const AuthRouter = require("./routes/AuthRoutes");
const {authenticateUser} = require("./middlewares/authMid");
require("dotenv").config();
const app = express();
const dbConnect = require("./config/dbConnect");
dbConnect();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cookieParser());
app.use(AuthRouter);
app.use(authenticateUser);
app.use(userRouter);
app.use("/product",productRouter);
app.listen(PORT,()=>{
    console.log(`Server is listening on port ${PORT}`);
})