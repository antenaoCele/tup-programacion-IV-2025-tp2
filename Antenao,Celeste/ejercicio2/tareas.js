import express from "express";
import { db } from "./db.js";
import { body, param, query, validationResult } from "express-validator";
const router = express.Router();


// ------------Validaciones------------
const validarFiltros = [
    query("nombre").isAlpha("es-ES").optional(),
    query("completada").optional()
        .isIn(["true", "false"])
        .withMessage("El valor de completada debe ser true o false"),

];


const validarId = param("id").isInt({ min: 1 });

const validarTareas = [
    body("nombre")
        .isString().withMessage("El nombre debe ser una cadena de texto")
        .notEmpty().withMessage("El nombre es obligatorio")
        .isLength({ min: 3, max: 50 }).withMessage("El nombre debe tener entre 3 y 50 caracteres"),


    body("completada")
        .isIn(["true", "false"]).withMessage("El campo debe ser verdadero o falso")
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
router.get('/', validarFiltros, verificarValidaciones, async (req, res) => {
    const filtros = [];
    const parametros = [];
    const { nombre, completada } = req.query;

    if (nombre) {
        filtros.push("nombre LIKE ?");
        parametros.push(`%${nombre}%`);
    }

    if (completada !== undefined) {
        const valorCompletada = completada === "true" ? 1 : 0;
        filtros.push("completada = ?");
        parametros.push(valorCompletada);
    }

    let sql = "SELECT * FROM tareas";
    if (filtros.length > 0) {
        sql += " WHERE " + filtros.join(" AND ");
    }

    const [rows] = await db.execute(sql, parametros);
    res.json({ success: true, data: rows });
});
// ------------GET------------


//GET POR ID 
router.get("/:id", validarId, verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);
    const [rows] = await db.execute("SELECT * FROM tareas WHERE id=?", [id]);

    if (rows.length === 0) {
        return res
            .status(404)
            .json({ success: false, message: "Tarea no encontrada" });
    }

    res.json({ success: true, data: rows[0] });
});


// POST para crear tarea
router.post("/", validarTareas, verificarValidaciones, async (req, res) => {
    const { nombre, completada } = req.body;

    const [existeNombre] = await db.execute("SELECT * FROM tareas WHERE LOWER(nombre)=LOWER(?)", [nombre]);

    if (existeNombre.length > 0) {
        return res.status(404).json({
            success: false,
            message: "Ya existe una tarea con ese nombre",
        });
    }

    const [result] = await db.execute(
        "INSERT INTO tareas (nombre, completada) VALUES (?,?)",
        [nombre, completada]
    );


    res.status(201).json({
        success: true,
        data: { id: result.insertId, nombre, completada },
    });
});

// PUT 
router.put("/:id", validarId, validarTareas, verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);

    const { nombre, completada } = req.body;

    await db.execute(
        "UPDATE tareas SET nombre=?, completada=? WHERE id=?",
        [nombre, completada, id]
    );


    const [existe] = await db.execute("SELECT id FROM tareas WHERE id=?", [id]);
    if (existe.length === 0) {
        return res.status(404).json({
            success: false,
            message: "No se encontró una tarea con ese id",
        });
    }

    res.json({
        success: true,
        data: { id, nombre, completada },
    });
});

// DELETE 
router.delete("/:id", validarId, verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);


    const [existe] = await db.execute("SELECT id FROM tareas WHERE id=?", [id]);
    if (existe.length === 0) {
        return res.status(404).json({
            success: false,
            message: "No se encontró una tarea con ese id",
        });
    }


    await db.execute("DELETE FROM tareas WHERE id=?", [id]);
    res.json({ success: true, data: id });
});


export default router;
