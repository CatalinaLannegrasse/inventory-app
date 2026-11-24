// routes/categoryRouter.js
const { Router } = require("express");
const categoryController = require("../controllers/categoryController");

const router = Router();

router.get("/", categoryController.listCategories);
router.get("/new", categoryController.newCategoryForm);
router.post("/", categoryController.createCategory);
router.get("/:id", categoryController.showCategory);
router.get("/:id/edit", categoryController.editCategoryForm);
router.post("/:id/update", categoryController.updateCategory);
router.post("/:id/delete", categoryController.deleteCategory);

module.exports = router;