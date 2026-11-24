// routes/brandRouter.js
const { Router } = require("express");
const brandController = require("../controllers/brandController");

const router = Router();

router.get("/", brandController.listBrands);
router.get("/new", brandController.newBrandForm);
router.post("/", brandController.createBrand);
router.post("/:id/delete", brandController.deleteBrand);

module.exports = router;