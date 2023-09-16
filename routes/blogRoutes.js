const express = require("express");
const router = express.Router();
const {authenticateAdmin} = require("../middlewares/authMid");
const blogController = require("../controllers/BlogController");

router.post("/",authenticateAdmin,blogController.createBlog);
router.put("/:id",authenticateAdmin,blogController.editBlog);

module.exports = router;