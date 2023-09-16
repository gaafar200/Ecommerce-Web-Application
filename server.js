const express = require("express");
const userRouter = require("./routes/userRouter");
const fileUpload = require('express-fileupload');
const productRouter = require("./routes/ProductRouter");
const blogRouter = require("./routes/blogRoutes");
const cookieParser = require("cookie-parser");
const AuthRouter = require("./routes/AuthRoutes");
const imageRouter = require("./routes/fileRoutes");
const {authenticateUser} = require("./middlewares/authMid");
require("dotenv").config();
const app = express();
const dbConnect = require("./config/dbConnect");
dbConnect();
const PORT = process.env.PORT || 3000;
app.use(express.static('uploads'));
app.use(fileUpload());
app.use(express.json());
app.use(cookieParser());
app.use(AuthRouter);
app.use(imageRouter);
app.use(authenticateUser);
app.use(userRouter);
app.use("/product",productRouter);
app.use("/blog",blogRouter);
app.listen(PORT,()=>{
    console.log(`Server is listening on port ${PORT}`);
})