const express = require("express");
const userController = require("../controllers/UserController");
const router = express.Router();
router.post("/register",userController.register);
router.post("/login",userController.login);
router.post("/forget-password",userController.forgetPasswordEmail);
router.post("/reset-password/:id",userController.resetPassword);

module.exports = router;