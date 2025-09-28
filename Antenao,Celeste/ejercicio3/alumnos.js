import express from "express";
import { db } from "./db.js";
import { body, param, query, validationResult } from "express-validator";
const router = express.Router();


// ------------Validaciones------------

const validarId = param("id").isInt({ min: 1 });

const validarAlumno = [
    body("nombre")
        .isString().withMessage("El nombre debe ser una cadena de texto")
        .notEmpty().withMessage("El nombre es obligatorio"),

    body("id_materias")
        .isInt({ min: 1 }).withMessage("Debe ser un id de materia válido"),
    body("id_materias")
        .isInt({ min: 1 }).withMessage("La materia debe ser un número entero")
        .custom(async (value) => {
            const [rows] = await db.execute(
                "SELECT id FROM materias WHERE id = ?",
                [value]
            );
            if (rows.length === 0) {
                throw new Error("La materia no existe");
            }
            return true;
        }),

    body("nota1")
        .isFloat({ min: 0, max: 10 }),
    body("nota2")
        .isFloat({ min: 0, max: 10 }),
    body("nota3")
        .isFloat({ min: 0, max: 10 }),
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
    let sql =
        "SELECT a.id, a.nombre, a.nota1, a.nota2, a.nota3, m.nombre AS materia " +
        "FROM alumnos a " +
        "JOIN materias m ON a.id_materias = m.id " +
        " ORDER BY a.nombre";

    const [rows] = await db.execute(sql);
    res.json({ success: true, data: rows });
});
// ------------GET------------


//GET POR ID 
router.get("/:id", validarId, verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);
    const [rows] = await db.execute("SELECT * FROM alumnos WHERE id=?", [id]);

    if (rows.length === 0) {
        return res
            .status(404)
            .json({ success: false, message: "Alumno no encontrado" });
    }

    res.json({ success: true, data: rows[0] });
});


// POST para crear alumno
router.post("/", validarAlumno, verificarValidaciones, async (req, res) => {
    const { nombre, nota1, nota2, nota3, id_materias } = req.body;

    const [existeAlumno] = await db.execute("SELECT id FROM alumnos WHERE LOWER(nombre)=LOWER(?) AND id_materias=?", [nombre, id_materias]);


    if (existeAlumno.length > 0) {
        return res.status(404).json({
            success: false,
            message: "Alumno ya existente",
        });
    }

    const [result] = await db.execute(
        "INSERT INTO alumnos (nombre, nota1, nota2, nota3, id_materias) VALUES (?,?,?,?,?)",
        [nombre, nota1, nota2, nota3, id_materias]
    );


    res.status(201).json({
        success: true,
        data: { id: result.insertId, nombre, nota1, nota2, nota3, id_materias },
    });
});

// PUT 
router.put("/:id", validarId, validarAlumno, verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);

    const { nombre, nota1, nota2, nota3, id_materias } = req.body;


    const [existe] = await db.execute("SELECT id FROM alumnos WHERE id=?", [id]);
    if (existe.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Alumno no existente",
        });
    }


    const [existeAlumno] = await db.execute("SELECT id FROM alumnos WHERE LOWER(nombre) = LOWER(?) AND id_materias = ? AND id != ?", [nombre, id_materias, id]);


    if (existeAlumno.length > 0) {
        return res.status(404).json({
            success: false,
            message: "Alumno ya existente",
        });
    }

    await db.execute(
        "UPDATE alumnos SET nombre=?, nota1=?, nota2=?, nota3=?, id_materias=? WHERE id=?",
        [nombre, nota1, nota2, nota3, id_materias, id]
    );

    res.json({
        success: true,
        data: { id, nombre, nota1, nota2, nota3, id_materias },
    });
});

// DELETE 
router.delete("/:id", validarId, verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);


    const [existe] = await db.execute("SELECT id FROM alumnos WHERE id=?", [id]);
    if (existe.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Alumno no encontrado",
        });
    }


    await db.execute("DELETE FROM alumnos WHERE id=?", [id]);
    res.json({ success: true, data: id });
});


export default router;
