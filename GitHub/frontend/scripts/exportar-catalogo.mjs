// Exporta el catálogo (patrones, músculos, ejercicios y factores) desde MySQL
// a src/assets/catalogo.json, que la app carga en su base SQLite.
//
// Uso:  npm run catalogo
// Requiere MySQL encendido con la base gym_app ya migrada por el backend (Flyway).
// Variables opcionales: MYSQL_BIN, DB_NAME, DB_USER, DB_PASSWORD.
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const mysql =
  process.env.MYSQL_BIN ?? (existsSync('C:/xampp/mysql/bin/mysql.exe') ? 'C:/xampp/mysql/bin/mysql.exe' : 'mysql');
const db = process.env.DB_NAME ?? 'gym_app';
const args = ['-u', process.env.DB_USER ?? 'root', '--default-character-set=utf8mb4', '-B', db];
if (process.env.DB_PASSWORD) args.splice(2, 0, `-p${process.env.DB_PASSWORD}`);

const desescapar = (v) =>
  v === 'NULL' ? null : v.replace(/\\(.)/g, (_, c) => ({ n: '\n', t: '\t', 0: '\0', '\\': '\\' })[c] ?? c);

/** Ejecuta un SELECT y devuelve filas como objetos; `numericas` se convierten a número. */
function consulta(sql, numericas = []) {
  const salida = execFileSync(mysql, [...args, '-e', sql], { encoding: 'utf8' });
  const [cabecera, ...lineas] = salida.replace(/\r?\n$/, '').split(/\r?\n/);
  const columnas = cabecera.split('\t');
  return lineas.map((linea) => {
    const valores = linea.split('\t').map(desescapar);
    return Object.fromEntries(
      columnas.map((c, i) => [c, numericas.includes(c) && valores[i] !== null ? Number(valores[i]) : valores[i]]),
    );
  });
}

const catalogo = {
  version: Number(consulta('SELECT MAX(CAST(version AS UNSIGNED)) v FROM flyway_schema_history WHERE success = 1')[0].v),
  patrones: consulta(
    `SELECT id, codigo, nombre, articulacion, plano, descripcion_simple, descripcion_tecnica,
            imagen_url, video_url, orden FROM patron_articular ORDER BY orden`,
    ['orden'],
  ),
  musculos: consulta('SELECT id, codigo, nombre, region FROM musculo ORDER BY codigo'),
  patronMusculo: consulta(
    'SELECT patron_articular_id, musculo_id, rol FROM patron_musculo ORDER BY patron_articular_id, rol',
  ),
  ejercicios: consulta(
    `SELECT id, codigo, nombre, musculo_id, patron_articular_id, enfasis, equipo, notas
       FROM ejercicio WHERE usuario_id IS NULL AND deleted_at IS NULL ORDER BY codigo`,
  ),
  ejercicioMusculo: consulta(
    `SELECT em.ejercicio_id, em.musculo_id, em.factor FROM ejercicio_musculo em
       JOIN ejercicio e ON e.id = em.ejercicio_id WHERE e.usuario_id IS NULL
      ORDER BY em.ejercicio_id, em.factor DESC`,
    ['factor'],
  ),
};

const destino = join(raiz, 'src', 'assets', 'catalogo.json');
writeFileSync(destino, JSON.stringify(catalogo, null, 1) + '\n');
console.log(
  `catalogo.json v${catalogo.version}: ${catalogo.patrones.length} patrones, ${catalogo.musculos.length} músculos, ` +
    `${catalogo.ejercicios.length} ejercicios, ${catalogo.ejercicioMusculo.length} factores`,
);
