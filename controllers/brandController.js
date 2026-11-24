const pool = require("../db/pool");

async function listBrands(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT b.*, COUNT(i.id)::int AS item_count
      FROM brands b
      LEFT JOIN items i ON i.brand_id = b.id
      GROUP BY b.id
      ORDER BY b.name ASC
    `);
    res.render("brands/index", { title: "Brands", brands: rows });
  } catch (err) {
    next(err);
  }
}

function newBrandForm(req, res) {
  res.render("brands/new", { title: "New Brand", errors: [], formData: {} });
}

async function createBrand(req, res, next) {
  const name = (req.body.name || "").trim();
  const website = (req.body.website || "").trim() || null;

  if (!name) {
    return res.status(400).render("brands/new", {
      title: "New Brand",
      errors: [{ msg: "Brand name is required." }],
      formData: { name, website },
    });
  }

  try {
    await pool.query(
      "INSERT INTO brands (name, website) VALUES ($1, $2)",
      [name, website]
    );
    res.redirect("/brands");
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).render("brands/new", {
        title: "New Brand",
        errors: [{ msg: "A brand with that name already exists." }],
        formData: { name, website },
      });
    }
    next(err);
  }
}

async function deleteBrand(req, res, next) {
  const brandId = Number(req.params.id);
  try {
    await pool.query("DELETE FROM brands WHERE id = $1", [brandId]);
    res.redirect("/brands");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listBrands,
  newBrandForm,
  createBrand,
  deleteBrand,
};