const express = require("express");
const userController = require("../controllers/UserController");
const router = express.Router();
const {authenticateAdmin} = require("../middlewares/authMid");

router.get("/logout",userController.logout);
router.get("/user",authenticateAdmin,userController.getAllUsers);
router.put("/user",userController.EditMyData);
router.get("/user/profile",userController.profile);
router.post("/user/change-password",userController.changePassword);
router.get("/user/:id",authenticateAdmin,userController.getUserData);
router.put("/user/:id",authenticateAdmin,userController.editUserData);
router.delete("/user/:id",authenticateAdmin,userController.deleteUser);
router.get("/user/block/:id",authenticateAdmin,userController.blockUser);
router.get("/user/unblock/:id",authenticateAdmin,userController.unblockUser);

module.exports = router;