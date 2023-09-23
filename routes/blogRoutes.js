const express = require("express");
const router = express.Router();
const {authenticateAdmin} = require("../middlewares/authMid");
const blogController = require("../controllers/BlogController");

router.post("/",authenticateAdmin,blogController.createBlog);
router.get("/",blogController.getAllBlogs);
router.post("/:id/like",blogController.likeABlog);
router.post("/:id/dislike",blogController.dislikeABlog);
router.put("/:id",authenticateAdmin,blogController.editBlog);
router.get("/:id",blogController.getBlog);
router.delete("/:id",blogController.deleteABlog);


module.exports = router;