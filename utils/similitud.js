const transformerPromise = import('@xenova/transformers');

let extractorInstance = null;

async function loadModelOnce() {
  if (!extractorInstance) {
    const transformer = await transformerPromise;
    Object.assign(transformer.env, {
      localModelPath: 'src/models/Xenova',
      allowRemoteModels: false
    });

    extractorInstance = await transformer.pipeline(
      'feature-extraction',
      'paraphrase-multilingual-MiniLM-L12-v2'
    );
  }
  return extractorInstance;
}

const equivalencias = {
    sistema: ["software", "aplicación", "herramienta", "plataforma", "entorno"],
    gestión: ["administración", "control", "organización", "seguimiento", "monitoreo"],
    empresa: ["negocio", "compañía", "emprendimiento", "institución", "organización"],
    documentos: ["archivos", "expedientes", "documentación", "registros"],
    facturación: ["emitir recibos", "boletaje", "cobros", "transacciones", "pagos"],
    clientes: ["usuarios", "consumidores", "beneficiarios", "interesados"],
    chatbot: ["asistente virtual", "bot de atención", "agente conversacional"],
    virtual: ["online", "en línea", "a distancia", "remoto"],
    "enseñanza a distancia": ["clases en línea", "educación remota", "educación a distancia", "formación virtual"],
    académica: ["educativa", "escolar", "formativa", "de enseñanza"],
    mensajería: ["whatsapp", "telegram", "messenger", "app de mensajería", "chat"],
    "atención al cliente": ["soporte técnico", "servicio al cliente", "asistencia", "servicio al usuario", "ayuda"],
    aprendizaje: ["formación", "enseñanza", "proceso educativo", "capacitación"],
    matemáticas: ["cálculo", "habilidades numéricas", "aritmética", "resolución de problemas"],
    red: ["LAN", "infraestructura de red", "interconexión", "conectividad"],
    biblioteca: ["centro de recursos", "espacio académico", "repositorio de libros"],
    seguridad: ["vigilancia", "monitoreo", "protección", "control de acceso"],
    información: ["datos", "documentación", "registro", "contenido"],
    registro: ["inscripción", "entrada de datos", "formulario"],
    respaldo: ["copia de seguridad", "backup", "almacenamiento alterno"],
    digital: ["electrónico", "virtual", "online", "cibernético"],
  // ... (continúa con todas las equivalencias)
};

const compiledPatterns = [];
for (const [base, synonyms] of Object.entries(equivalencias)) {
  for (const synonym of synonyms) {
    compiledPatterns.push({
      regex: new RegExp(`\\b${synonym}\\b`, "gi"),
      base,
    });
  }
}

function normalizarTexto(texto) {
  let resultado = texto.trim();
  for (const { regex, base } of compiledPatterns) {
    resultado = resultado.replace(regex, base);
  }
  return resultado.toLowerCase();
}

function cosineSimilarity(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] ** 2;
    normB += vecB[i] ** 2;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function tensorToMatrix(tensor) {
  const [batch, tokens, features] = tensor.dims;
  const data = tensor.data;
  const matrix = [];

  for (let i = 0; i < tokens; i++) {
    const start = i * features;
    matrix.push(Array.from(data.slice(start, start + features)));
  }

  return matrix;
}

function averageEmbeddings(matrix) {
  const avg = new Array(matrix[0].length).fill(0);
  matrix.forEach(row => row.forEach((val, j) => avg[j] += val));
  return avg.map(v => v / matrix.length);
}

module.exports = {
  loadModelOnce,
  normalizarTexto,
  cosineSimilarity,
  tensorToMatrix,
  averageEmbeddings
};
