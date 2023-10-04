const express = require("express");
const router = express.Router();
const productController = require("../controllers/ProductController");
const {authenticateAdmin} = require("../middlewares/authMid");
router.post("/",authenticateAdmin,productController.createProduct);
router.post("/rate/:id",productController.rateAProduct);
router.get("/",productController.getAllProducts); 
router.get("/:id",productController.getSpecificProduct);
router.put("/:id",authenticateAdmin,productController.updateProduct);
router.delete("/:id",authenticateAdmin,productController.deleteProduct);


module.exports = router;
