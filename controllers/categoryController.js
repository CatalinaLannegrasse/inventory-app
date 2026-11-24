const pool = require("../db/pool");
const { isValidAdminPassword } = require("../utils/adminAuth");

async function listCategories(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, COUNT(i.id)::int AS item_count
      FROM categories c
      LEFT JOIN items i ON i.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);
    res.render("categories/index", { title: "Categories", categories: rows });
  } catch (err) {
    next(err);
  }
}

function newCategoryForm(req, res) {
  res.render("categories/new", { title: "New Category", errors: [], formData: {} });
}

async function createCategory(req, res, next) {
  const name = (req.body.name || "").trim();
  const description = (req.body.description || "").trim() || null;

  if (!name) {
    return res.status(400).render("categories/new", {
      title: "New Category",
      errors: [{ msg: "Category name is required." }],
      formData: { name, description },
    });
  }

  try {
    await pool.query(
      "INSERT INTO categories (name, description) VALUES ($1, $2)",
      [name, description]
    );
    res.redirect("/categories");
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).render("categories/new", {
        title: "New Category",
        errors: [{ msg: "A category with that name already exists." }],
        formData: { name, description },
      });
    }
    next(err);
  }
}

async function showCategory(req, res, next) {
  const categoryId = Number(req.params.id);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return res.status(400).render("error", { title: "Invalid ID", message: "Invalid category ID." });
  }

  try {
    const catResult = await pool.query("SELECT * FROM categories WHERE id = $1", [categoryId]);
    if (catResult.rows.length === 0) {
      return res.status(404).render("error", { title: "Not Found", message: "Category not found." });
    }

    const itemsResult = await pool.query(
      `SELECT i.*, b.name AS brand_name
       FROM items i
       LEFT JOIN brands b ON b.id = i.brand_id
       WHERE i.category_id = $1
       ORDER BY i.name ASC`,
      [categoryId]
    );

    res.render("categories/show", {
      title: catResult.rows[0].name,
      category: catResult.rows[0],
      items: itemsResult.rows,
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

async function editCategoryForm(req, res, next) {
  const categoryId = Number(req.params.id);
  try {
    const { rows } = await pool.query("SELECT * FROM categories WHERE id = $1", [categoryId]);
    if (rows.length === 0) {
      return res.status(404).render("error", { title: "Not Found", message: "Category not found." });
    }
    res.render("categories/edit", { title: "Edit Category", category: rows[0], errors: [] });
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  const categoryId = Number(req.params.id);
  const name = (req.body.name || "").trim();
  const description = (req.body.description || "").trim() || null;

  if (!isValidAdminPassword(req.body.adminPassword)) {
    return res.status(403).render("categories/edit", {
      title: "Edit Category",
      category: { id: categoryId, name: name || "", description },
      errors: [{ msg: "Invalid admin password. Changes were not saved." }],
    });
  }

  if (!name) {
    return res.status(400).render("categories/edit", {
      title: "Edit Category",
      category: { id: categoryId, name, description },
      errors: [{ msg: "Category name is required." }],
    });
  }

  try {
    await pool.query(
      "UPDATE categories SET name = $1, description = $2 WHERE id = $3",
      [name, description, categoryId]
    );
    res.redirect(`/categories/${categoryId}`);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).render("categories/edit", {
        title: "Edit Category",
        category: { id: categoryId, name, description },
        errors: [{ msg: "A category with that name already exists." }],
      });
    }
    next(err);
  }
}

// controllers/categoryController.js
async function deleteCategory(req, res, next) {
  const categoryId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(categoryId) || categoryId <= 0) {
    return res.status(400).render("error", { title: "Invalid ID", message: "Invalid category ID." });
  }

  if (!isValidAdminPassword(req.body.adminPassword)) {
    const [catResult, itemsResult, allCatsResult] = await Promise.all([
      pool.query("SELECT * FROM categories WHERE id = $1", [categoryId]),
      pool.query("SELECT * FROM items WHERE category_id = $1 ORDER BY name ASC", [categoryId]),
      pool.query("SELECT id, name FROM categories WHERE id <> $1 ORDER BY name ASC", [categoryId]),
    ]);

    if (catResult.rows.length === 0) {
      return res.status(404).render("error", { title: "Not Found", message: "Category not found." });
    }

    return res.status(403).render("categories/show", {
      title: catResult.rows[0].name,
      category: catResult.rows[0],
      items: itemsResult.rows,
      otherCategories: allCatsResult.rows,
      error: "Invalid admin password. Category was not deleted.",
    });
  }

  try {
    const result = await pool.query("DELETE FROM categories WHERE id = $1", [categoryId]);
    if (result.rowCount === 0) {
      return res.status(404).render("error", { title: "Not Found", message: "Category not found." });
    }
    res.redirect("/categories");
    } catch (err) {
        // 23001 = restrict_violation (ON DELETE RESTRICT), 23503 = foreign_key_violation
        if (err.code === "23001" || err.code === "23503") {
          const [catResult, itemsResult, allCatsResult] = await Promise.all([
            pool.query("SELECT * FROM categories WHERE id = $1", [categoryId]),
            pool.query("SELECT * FROM items WHERE category_id = $1 ORDER BY name ASC", [categoryId]),
            pool.query("SELECT id, name FROM categories WHERE id <> $1 ORDER BY name ASC", [categoryId]),
          ]);

          const category = catResult.rows[0];
          return res.status(409).render("categories/show", {
            title: category ? category.name : "Category",
            category,
            items: itemsResult.rows,
            otherCategories: allCatsResult.rows,
            error: `Cannot delete "${category ? category.name : "this category"}" because ${itemsResult.rows.length} item(s) are still assigned to it. Move or delete those items first.`,
          });
        }
        next(err);
      }
    }

module.exports = {
  listCategories,
  newCategoryForm,
  createCategory,
  showCategory,
  editCategoryForm,
  updateCategory,
  deleteCategory,
};