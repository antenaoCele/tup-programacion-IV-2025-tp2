import express from "express";
import { db } from "./db.js";
import { body, param, query, validationResult } from "express-validator";
const router = express.Router();


// ----------------------------Validaciones----------------------------

const validarId = param("id").isInt({ min: 1 });

const validarRectangulo = [
    body("base").isFloat({ min: 0.1 })
        .withMessage("La base debe ser mayor que cero"),
    body("altura").isFloat({ min: 0.1 })
        .withMessage("La altura debe ser mayor que cero"),
];

const verificarValidaciones = (req, res, next) => {
    const validacion = validationResult(req);
    if (!validacion.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Falla de validacion",
            errores: validacion.array(),
        });
    }
    next();
};


// ----------------------------Validaciones----------------------------


// ---------------------------------GET--------------------------------
router.get("/", async (req, res) => {

    const [rows] = await db.execute("SELECT * FROM rectangulos");
    res.json({ success: true, data: rows });
});
// ---------------------------------GET--------------------------------


//GET POR ID 
router.get("/:id", validarId, verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);
    const [rows] = await db.execute("SELECT * FROM rectangulos WHERE id=?", [id]);

    if (rows.length === 0) {
        return res
            .status(404)
            .json({ success: false, message: "Rectangulo no encontrado" });
    }

    res.json({ success: true, data: rows[0] });
});


// POST para crear rectangulo
router.post("/", validarRectangulo, verificarValidaciones, async (req, res) => {
    const { base, altura } = req.body;

    const superficie = base * altura;
    const perimetro = (2 * base) + (2 * altura);

    const [result] = await db.execute(
        "INSERT INTO rectangulos (base, altura, superficie, perimetro) VALUES (?,?,?,?)",
        [base, altura, superficie, perimetro]
    );
    res.status(201).json({
        success: true,
        data: { id: result.insertId, base, altura, superficie, perimetro },
    });
});

// PUT 
router.put("/:id", validarId, validarRectangulo, verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);

    const { base, altura } = req.body;
    const superficie = base * altura;
    const perimetro = (2 * base) + (2 * altura);


    const [existe] = await db.execute("SELECT id FROM rectangulos WHERE id=?", [id]);
    if (existe.length === 0) {
        return res.status(404).json({
            success: false,
            message: "No se encontró un rectángulo con ese id",
        });
    }

    await db.execute(
        "UPDATE rectangulos SET base=?, altura=?, superficie=?, perimetro=? WHERE id=?",
        [base, altura, superficie, perimetro, id]
    );



    res.json({
        success: true,
        data: { id, base, altura, superficie, perimetro },
    });
});

// DELETE 
router.delete("/:id", validarId, verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);

    const [existe] = await db.execute("SELECT id FROM rectangulos WHERE id=?", [id]);
    if (existe.length === 0) {
        return res.status(404).json({
            success: false,
            message: "No se encontró un rectángulo con ese id",
        });
    }

    await db.execute("DELETE FROM rectangulos WHERE id=?", [id]);
    res.json({ success: true, data: id });
});


export default router;
