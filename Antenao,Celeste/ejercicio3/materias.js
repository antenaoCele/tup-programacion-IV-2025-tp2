import express from "express";
import { db } from "./db.js";
import { body, param, query, validationResult } from "express-validator";
const router = express.Router();


// ------------Validaciones------------

const validarId = param("id").isInt({ min: 1 });

const validarMaterias = [
    body("nombre")
        .isString().withMessage("El nombre debe ser una cadena de texto")
        .notEmpty().withMessage("El nombre es obligatorio")
        .isLength({ min: 5, max: 50 }).withMessage("El nombre debe tener entre 5 y 50 caracteres"),

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
// ------------Validaciones------------


// ------------GET------------
router.get('/', async (req, res) => {

    const [rows] = await db.execute("SELECT * FROM materias");
    res.json({ success: true, data: rows });
});
// ------------GET------------


//GET POR ID 
router.get("/:id", validarId, verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);
    const [rows] = await db.execute("SELECT * FROM materias WHERE id=?", [id]);

    if (rows.length === 0) {
        return res
            .status(404)
            .json({ success: false, message: "Materia no encontrada" });
    }

    res.json({ success: true, data: rows[0] });
});


// POST para crear materia
router.post("/", validarMaterias, verificarValidaciones, async (req, res) => {
    const { nombre } = req.body;

    const [existeNombre] = await db.execute("SELECT * FROM materias WHERE LOWER(nombre)=LOWER(?)", [nombre]);

    if (existeNombre.length > 0) {
        return res.status(404).json({
            success: false,
            message: "Ya existe esta materia",
        });
    }

    const [result] = await db.execute(
        "INSERT INTO materias (nombre) VALUES (?)",
        [nombre]
    );


    res.status(201).json({
        success: true,
        data: { id: result.insertId, nombre },
    });
});

// PUT 
router.put("/:id", validarId, validarMaterias, verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);

    const { nombre } = req.body;

    await db.execute(
        "UPDATE materias SET nombre=? WHERE id=?",
        [nombre, id]
    );


    const [existe] = await db.execute("SELECT id FROM materias WHERE id=?", [id]);
    if (existe.length === 0) {
        return res.status(404).json({
            success: false,
            message: "No se encontro una materia con este id",
        });
    }

    res.json({
        success: true,
        data: { id, nombre },
    });
});

// DELETE 
router.delete("/:id", validarId, verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);


    const [existe] = await db.execute("SELECT id FROM materias WHERE id=?", [id]);
    if (existe.length === 0) {
        return res.status(404).json({
            success: false,
            message: "No se encontro una materia con este id",
        });
    }


    await db.execute("DELETE FROM materias WHERE id=?", [id]);
    res.json({ success: true, data: id });
});


export default router;
