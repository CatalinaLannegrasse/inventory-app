// routes/itemRouter.js
const { Router } = require("express");
const itemController = require("../controllers/itemController");

const router = Router();

router.get("/", itemController.listItems);
router.get("/new", itemController.newItemForm);
router.post("/", itemController.createItem);
router.get("/:id", itemController.showItem);
router.get("/:id/edit", itemController.editItemForm);
router.post("/:id/update", itemController.updateItem);
router.post("/:id/delete", itemController.deleteItem);

module.exports = router;