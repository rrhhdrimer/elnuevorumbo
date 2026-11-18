/**
 * TEO El Nuevo Rumbo · Registro central de participación.
 *
 * Se pega en la hoja de cálculo (Extensiones > Apps Script) y se publica como
 * app web: "Ejecutar como: yo" y "Quién tiene acceso: Cualquier usuario".
 *
 * Guarda una fila por DNI. No guarda intentos, historial de notas ni respuestas.
 * Calcula la nota a partir de las respuestas recibidas y conserva la mayor.
 */

var SHEET_NAME = 'Participantes';
var HEADERS = ['DNI', 'Nombre', 'Momentos completados', 'Estado del reto', 'Mejor nota', 'Primera finalización de la historia (hora de Lima)'];
var ANSWER_KEY = ['B', 'C', 'A', 'B', 'C'];
var POINTS = 4;
var TIMEZONE = 'America/Lima';

function doGet() {
  return json_({ ok: true, service: 'TEO El Nuevo Rumbo' });
}

function doPost(e) {
  var op;
  try {
    op = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'JSON no válido' });
  }

  var dni = String(op.dni || '');
  var name = cleanName_(op.name);
  var moments = Math.floor(Number(op.moments));
  var id = String(op.id || '').slice(0, 80);

  if (!/^\d{8}$/.test(dni)) return json_({ ok: false, id: id, error: 'DNI no válido' });
  if (!name) return json_({ ok: false, id: id, error: 'Nombre vacío' });
  if (!(moments >= 0 && moments <= 6)) return json_({ ok: false, id: id, error: 'Momentos no válidos' });

  var score = null;
  if (op.answers != null) {
    if (!isValidAnswers_(op.answers)) return json_({ ok: false, id: id, error: 'Respuestas no válidas' });
    // Solo se acepta un reto si la historia está completa.
    if (moments < 6) return json_({ ok: false, id: id, error: 'Historia incompleta' });
    score = scoreOf_(op.answers);
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
  } catch (err) {
    return json_({ ok: false, id: id, error: 'Ocupado, reintentar' });
  }

  try {
    var sheet = getSheet_();
    var row = findRow_(sheet, dni);
    var current = row
      ? sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0]
      : [dni, name, 0, '', '', ''];

    var prevMoments = Number(current[2]) || 0;
    var prevBest = current[4] === '' || current[4] == null ? null : Number(current[4]);
    var newMoments = Math.max(prevMoments, moments);
    var newBest = score == null ? prevBest : Math.max(prevBest == null ? 0 : prevBest, score);
    var firstDone = current[5];
    if (!firstDone && newMoments === 6) {
      firstDone = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm');
    }

    var values = [[dni, name, newMoments, statusOf_(newBest), newBest == null ? '' : newBest, firstDone || '']];
    if (!row) row = sheet.getLastRow() + 1;
    sheet.getRange(row, 1).setNumberFormat('@'); // DNI como texto para conservar ceros iniciales
    sheet.getRange(row, 1, 1, HEADERS.length).setValues(values);
    SpreadsheetApp.flush();

    return json_({ ok: true, id: id, best: newBest, moments: newMoments });
  } finally {
    lock.releaseLock();
  }
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.getRange('A:A').setNumberFormat('@');
  }
  return sheet;
}

function findRow_(sheet, dni) {
  var last = sheet.getLastRow();
  if (last < 2) return null;
  var cell = sheet
    .getRange(2, 1, last - 1, 1)
    .createTextFinder(dni)
    .matchEntireCell(true)
    .findNext();
  return cell ? cell.getRow() : null;
}

function isValidAnswers_(answers) {
  if (!Array.isArray(answers) || answers.length !== ANSWER_KEY.length) return false;
  for (var i = 0; i < answers.length; i++) {
    if (['A', 'B', 'C'].indexOf(answers[i]) === -1) return false;
  }
  return true;
}

function scoreOf_(answers) {
  var total = 0;
  for (var i = 0; i < ANSWER_KEY.length; i++) if (answers[i] === ANSWER_KEY[i]) total += POINTS;
  return total;
}

function statusOf_(best) {
  if (best == null) return 'pendiente';
  if (best === 20) return 'completado con 20';
  if (best >= 16) return 'aprobado';
  return 'no aprobado';
}

// Evita que un nombre se interprete como fórmula en la hoja.
function cleanName_(name) {
  var s = String(name || '').replace(/\s+/g, ' ').trim().slice(0, 100);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
