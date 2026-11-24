const pool = require("../db/pool");
const { isValidAdminPassword } = require("../utils/adminAuth");

async function getFormLookups() {
  const [categoriesRes, brandsRes] = await Promise.all([
    pool.query("SELECT id, name FROM categories ORDER BY name ASC"),
    pool.query("SELECT id, name FROM brands ORDER BY name ASC"),
  ]);
  return { categories: categoriesRes.rows, brands: brandsRes.rows };
}

async function listItems(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT i.*, c.name AS category_name, b.name AS brand_name
      FROM items i
      JOIN categories c ON c.id = i.category_id
      LEFT JOIN brands b ON b.id = i.brand_id
      ORDER BY i.name ASC
    `);
    res.render("items/index", { title: "All Items", items: rows });
  } catch (err) {
    next(err);
  }
}

async function newItemForm(req, res, next) {
  try {
    const { categories, brands } = await getFormLookups();
    res.render("items/new", {
      title: "Add Tech Item",
      categories,
      brands,
      errors: [],
      formData: {},
      selectedCategory: req.query.category_id || "",
    });
  } catch (err) {
    next(err);
  }
}

async function createItem(req, res, next) {
  const sku = (req.body.sku || "").trim().toUpperCase();
  const name = (req.body.name || "").trim();
  const description = (req.body.description || "").trim() || null;
  const price = Number(req.body.price);
  const quantity = Number.parseInt(req.body.quantity, 10);
  const categoryId = Number.parseInt(req.body.category_id, 10);
  const brandId = req.body.brand_id ? Number.parseInt(req.body.brand_id, 10) : null;

  const errors = [];
  if (!sku) errors.push({ msg: "SKU is required." });
  if (!name) errors.push({ msg: "Item name is required." });
  if (Number.isNaN(price) || price < 0) errors.push({ msg: "Price must be 0 or greater." });
  if (Number.isNaN(quantity) || quantity < 0) errors.push({ msg: "Quantity must be an integer 0 or greater." });
  if (Number.isNaN(categoryId) || categoryId <= 0) errors.push({ msg: "Please select a valid category." });

  if (errors.length > 0) {
    const { categories, brands } = await getFormLookups();
    return res.status(400).render("items/new", {
      title: "Add Tech Item",
      categories,
      brands,
      errors,
      formData: req.body,
    });
  }

  try {
    await pool.query(
      `INSERT INTO items (sku, name, description, price, quantity, category_id, brand_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [sku, name, description, price, quantity, categoryId, brandId]
    );
    res.redirect("/items");
  } catch (err) {
    if (err.code === "23505") {
      const { categories, brands } = await getFormLookups();
      return res.status(400).render("items/new", {
        title: "Add Tech Item",
        categories,
        brands,
        errors: [{ msg: "An item with that SKU already exists." }],
        formData: req.body,
      });
    }
    next(err);
  }
}

async function showItem(req, res, next) {
  const itemId = Number(req.params.id);
  try {
    const { rows } = await pool.query(
      `SELECT i.*, c.name AS category_name, b.name AS brand_name
       FROM items i
       JOIN categories c ON c.id = i.category_id
       LEFT JOIN brands b ON b.id = i.brand_id
       WHERE i.id = $1`,
      [itemId]
    );
    if (rows.length === 0) {
      return res.status(404).render("error", { title: "Not Found", message: "Item not found." });
    }
    res.render("items/show", { title: rows[0].name, item: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function editItemForm(req, res, next) {
  const itemId = Number(req.params.id);
  try {
    const [itemRes, lookups] = await Promise.all([
      pool.query("SELECT * FROM items WHERE id = $1", [itemId]),
      getFormLookups(),
    ]);
    if (itemRes.rows.length === 0) {
      return res.status(404).render("error", { title: "Not Found", message: "Item not found." });
    }
    res.render("items/edit", {
      title: "Edit Item",
      item: itemRes.rows[0],
      categories: lookups.categories,
      brands: lookups.brands,
      errors: [],
    });
  } catch (err) {
    next(err);
  }
}

async function updateItem(req, res, next) {
  const itemId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(itemId) || itemId <= 0) {
    return res.status(400).render("error", { title: "Invalid ID", message: "Invalid item ID." });
  }

  const sku = (req.body.sku || "").trim().toUpperCase();
  const name = (req.body.name || "").trim();
  const description = (req.body.description || "").trim() || null;
  const price = Number(req.body.price);
  const quantity = Number.parseInt(req.body.quantity, 10);
  const categoryId = Number.parseInt(req.body.category_id, 10);
  const brandId = req.body.brand_id ? Number.parseInt(req.body.brand_id, 10) : null;

  const errors = [];
  if (!sku) errors.push({ msg: "SKU is required." });
  if (!name) errors.push({ msg: "Item name is required." });
  if (Number.isNaN(price) || price < 0) errors.push({ msg: "Price must be 0 or greater." });
  if (Number.isNaN(quantity) || quantity < 0) errors.push({ msg: "Quantity must be an integer 0 or greater." });
  if (Number.isNaN(categoryId) || categoryId <= 0) errors.push({ msg: "Please select a valid category." });

  if (errors.length > 0) {
    const { categories, brands } = await getFormLookups();
    return res.status(400).render("items/edit", {
      title: "Edit Item",
      item: { id: itemId, sku, name, description, price, quantity, category_id: categoryId, brand_id: brandId },
      categories,
      brands,
      errors,
    });
  }

  if (!isValidAdminPassword(req.body.adminPassword)) {
    const { categories, brands } = await getFormLookups();
    return res.status(403).render("items/edit", {
      title: "Edit Item",
      item: {
        id: itemId,
        sku,
        name,
        description,
        price: Number.isNaN(price) ? 0 : price,
        quantity: Number.isNaN(quantity) ? 0 : quantity,
        category_id: categoryId,
        brand_id: brandId,
      },
      categories,
      brands,
      errors: [{ msg: "Invalid admin password. Item was not updated." }],
    });
  }

  try {
    const result = await pool.query(
      `UPDATE items
       SET sku = $1, name = $2, description = $3, price = $4, quantity = $5,
           category_id = $6, brand_id = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING id`,
      [sku, name, description, price, quantity, categoryId, brandId, itemId]
    );

    if (result.rowCount === 0) {
      return res.status(404).render("error", { title: "Not Found", message: "Item not found." });
    }

    res.redirect(`/items/${itemId}`);
  } catch (err) {
    if (err.code === "23505") {
      const { categories, brands } = await getFormLookups();
      return res.status(400).render("items/edit", {
        title: "Edit Item",
        item: { id: itemId, sku, name, description, price, quantity, category_id: categoryId, brand_id: brandId },
        categories,
        brands,
        errors: [{ msg: "Another item already uses that SKU." }],
      });
    }
    next(err);
  }
}

async function deleteItem(req, res, next) {
  const itemId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(itemId) || itemId <= 0) {
    return res.status(400).render("error", { title: "Invalid ID", message: "Invalid item ID." });
  }

  if (!isValidAdminPassword(req.body.adminPassword)) {
    const { rows } = await pool.query(
      `SELECT i.*, c.name AS category_name, b.name AS brand_name
       FROM items i
       JOIN categories c ON c.id = i.category_id
       LEFT JOIN brands b ON b.id = i.brand_id
       WHERE i.id = $1`,
      [itemId]
    );

    if (rows.length === 0) {
      return res.status(404).render("error", { title: "Not Found", message: "Item not found." });
    }

    return res.status(403).render("items/show", {
      title: rows[0].name,
      item: rows[0],
      error: "Invalid admin password. Item was not deleted.",
    });
  }

  try {
    await pool.query("DELETE FROM items WHERE id = $1", [itemId]);
    res.redirect("/items");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listItems,
  newItemForm,
  createItem,
  showItem,
  editItemForm,
  updateItem,
  deleteItem,
};