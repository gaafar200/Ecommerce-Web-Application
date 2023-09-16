const express = require("express");
const router = express.Router();
const imageController = require("../controllers/fileController");
const fileMidlleware = require("../middlewares/fileMidllewares");

router.post("/upload-image",
fileMidlleware.filesUploadedSuccessfully("image"),
fileMidlleware.fileSizeLimiter("image"),
fileMidlleware.limitAllowedFileTypes("image",['.jpg','.jpeg','.png']),
fileMidlleware.numberOfUploadedFileLimiter("image",1),
imageController.uploadImage);

module.exports = router;