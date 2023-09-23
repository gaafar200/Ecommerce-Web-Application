const router = require("express").Router();
const categoryContoller = require("../controllers/categoryController");
 
router.post("/",categoryContoller.createCategory);
router.get("/brands",categoryContoller.getAllBrands);
router.get("/product",categoryContoller.getAllProductCategories);
router.get("/blog",categoryContoller.getAllBlogCategories);
router.put("/:id",categoryContoller.editCategory);

module.exports = router;
