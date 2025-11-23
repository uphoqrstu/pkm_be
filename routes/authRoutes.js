const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

console.log(authController); // cek output!

router.post("/login", authController.login);
router.post("/change-password", authController.changePassword);

module.exports = router;
