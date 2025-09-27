import express from "express";
import { conectarDB } from "./db.js";
import tareasRouter from "./tareas.js";


conectarDB();

const app = express();
const port = 5000;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hola mundo!");
});

app.use("/tareas", tareasRouter);

app.listen(port, () => {
    console.log(`La aplicación esta funcionando en el puerto ${port}`);
});