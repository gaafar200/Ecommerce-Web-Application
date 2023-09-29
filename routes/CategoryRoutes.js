const router = require("express").Router();
const categoryContoller = require("../controllers/categoryController");
const {authenticateAdmin} = require("../middlewares/authMid");
 
router.post("/",categoryContoller.createCategory);
router.get("/brands",categoryContoller.getAllBrands);
router.get("/products",categoryContoller.getAllProductCategories);
router.get("/blogs",categoryContoller.getAllBlogCategories);
router.get("/:id",categoryContoller.getACategorty);
router.delete("/:id",authenticateAdmin,categoryContoller.deleteACategory);
router.put("/:id",categoryContoller.editCategory);


module.exports = router;
