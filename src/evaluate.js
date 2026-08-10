/**
 * PilahPilih — Batch Accuracy Evaluation Tool (dev-only)
 *
 * Runs the deployed Teachable Machine model against a labeled local test set
 * (three folders of images: Plastik / Kertas / Sisa Makanan) and reports
 * accuracy, per-class precision/recall/F1, and a 3x3 confusion matrix.
 *
 * Uses the same ModelManager loading path as the production app (src/main.js)
 * so results reflect the exact model served at /model/controllable/.
 *
 * NOTE: unlike the real-time UI (which only accepts predictions above a 0.95
 * confidence threshold and otherwise falls back to "uncertain"), evaluation
 * uses pure argmax so every test image yields a prediction and contributes
 * to the confusion matrix.
 */
import { ModelManager } from './model-manager.js';

const MODEL_URL = '/model/controllable/';
const CLASSES = ['Plastik', 'Kertas', 'Sisa Makanan'];

const model = new ModelManager(MODEL_URL);

const els = {
    status: document.getElementById('status'),
    runBtn: document.getElementById('btn-run'),
    inputs: {
        'Plastik': document.getElementById('input-plastik'),
        'Kertas': document.getElementById('input-kertas'),
        'Sisa Makanan': document.getElementById('input-organik'),
    },
    counts: {
        'Plastik': document.getElementById('count-plastik'),
        'Kertas': document.getElementById('count-kertas'),
        'Sisa Makanan': document.getElementById('count-organik'),
    },
    progress: document.getElementById('progress'),
    results: document.getElementById('results'),
    summary: document.getElementById('summary'),
    confusionMatrix: document.getElementById('confusion-matrix'),
    metricsTable: document.getElementById('metrics-table'),
    misclassified: document.getElementById('misclassified'),
    exportCsvBtn: document.getElementById('btn-export-csv'),
    exportJsonBtn: document.getElementById('btn-export-json'),
};

let lastRun = null; // holds the most recent evaluation result for export

function setStatus(text) {
    els.status.textContent = text;
}

function updateSelectedCounts() {
    let total = 0;
    for (const cls of CLASSES) {
        const n = els.inputs[cls].files.length;
        els.counts[cls].textContent = `${n} gambar dipilih`;
        total += n;
    }
    els.runBtn.disabled = total === 0 || !model.isModelReady;
}

for (const cls of CLASSES) {
    els.inputs[cls].addEventListener('change', updateSelectedCounts);
}

/**
 * Decodes a File into an <img> element ready for aiModel.predict().
 * Uses HTMLImageElement (not ImageBitmap) since this project runs on
 * tfjs@1.3.1, which predates ImageBitmap support in tf.browser.fromPixels.
 */
async function loadImageFile(file) {
    const url = URL.createObjectURL(file);
    try {
        const img = new Image();
        img.src = url;
        await img.decode();
        return img;
    } finally {
        URL.revokeObjectURL(url);
    }
}

function argmax(predictions) {
    let best = predictions[0];
    for (const p of predictions) {
        if (p.probability > best.probability) best = p;
    }
    return best;
}

function buildEmptyMatrix() {
    return CLASSES.map(() => CLASSES.map(() => 0));
}

async function runEvaluation() {
    els.runBtn.disabled = true;
    els.results.hidden = true;
    els.progress.hidden = false;

    const confusion = buildEmptyMatrix(); // confusion[actualIdx][predictedIdx]
    const perImage = [];

    const jobs = [];
    for (const cls of CLASSES) {
        for (const file of els.inputs[cls].files) {
            jobs.push({ actual: cls, file });
        }
    }

    const total = jobs.length;
    let done = 0;
    let errors = 0;

    for (const job of jobs) {
        els.progress.textContent = `Memproses ${done + 1}/${total}: ${job.file.name}...`;
        try {
            const img = await loadImageFile(job.file);
            const predictions = await model.aiModel.predict(img);
            const best = argmax(predictions);

            const actualIdx = CLASSES.indexOf(job.actual);
            const predictedIdx = CLASSES.indexOf(best.className);

            if (predictedIdx === -1) {
                throw new Error(`Model mengembalikan kelas tak dikenal: "${best.className}"`);
            }

            confusion[actualIdx][predictedIdx] += 1;
            perImage.push({
                filename: job.file.name,
                actual: job.actual,
                predicted: best.className,
                confidence: best.probability,
                correct: best.className === job.actual,
            });
        } catch (e) {
            errors++;
            console.error(`Gagal memproses ${job.file.name}:`, e);
            perImage.push({
                filename: job.file.name,
                actual: job.actual,
                predicted: null,
                confidence: null,
                correct: false,
                error: String(e.message || e),
            });
        }
        done++;
    }

    const metrics = computeMetrics(confusion);
    lastRun = {
        generatedAt: new Date().toISOString(),
        model: {
            url: MODEL_URL,
            labels: CLASSES,
            aiModelLabels: model.aiModel.getClassLabels ? model.aiModel.getClassLabels() : undefined,
        },
        totalImages: total,
        errors,
        confusion,
        classes: CLASSES,
        metrics,
        perImage,
    };

    renderResults(lastRun);

    els.progress.hidden = true;
    els.runBtn.disabled = false;
    setStatus(errors > 0
        ? `Evaluasi selesai dengan ${errors} gambar gagal diproses (lihat console).`
        : 'Evaluasi selesai.');
}

/**
 * Computes overall accuracy plus per-class precision/recall/F1/support
 * from a 3x3 confusion matrix (rows = actual, cols = predicted).
 */
function computeMetrics(confusion) {
    const n = CLASSES.length;
    let totalCorrect = 0;
    let totalCount = 0;

    const perClass = CLASSES.map((cls, i) => {
        let tp = confusion[i][i];
        let fn = 0;
        let fp = 0;
        let support = 0;

        for (let c = 0; c < n; c++) support += confusion[i][c];
        for (let c = 0; c < n; c++) if (c !== i) fn += confusion[i][c];
        for (let r = 0; r < n; r++) if (r !== i) fp += confusion[r][i];

        const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
        const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
        const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

        totalCorrect += tp;
        totalCount += support;

        return { className: cls, support, precision, recall, f1 };
    });

    const accuracy = totalCount > 0 ? totalCorrect / totalCount : 0;

    const macroAvg = {
        precision: average(perClass.map(c => c.precision)),
        recall: average(perClass.map(c => c.recall)),
        f1: average(perClass.map(c => c.f1)),
        support: totalCount,
    };

    const weightedAvg = {
        precision: weightedAverage(perClass, c => c.precision),
        recall: weightedAverage(perClass, c => c.recall),
        f1: weightedAverage(perClass, c => c.f1),
        support: totalCount,
    };

    return { accuracy, totalCorrect, totalCount, perClass, macroAvg, weightedAvg };
}

function average(arr) {
    return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function weightedAverage(perClass, getter) {
    const totalSupport = perClass.reduce((a, c) => a + c.support, 0);
    if (totalSupport === 0) return 0;
    return perClass.reduce((a, c) => a + getter(c) * c.support, 0) / totalSupport;
}

function pct(x) {
    return `${(x * 100).toFixed(2)}%`;
}

function renderResults(run) {
    els.results.hidden = false;

    els.summary.innerHTML = `
        <p><strong>Total gambar diuji:</strong> ${run.totalImages}${run.errors ? ` (${run.errors} gagal diproses)` : ''}</p>
        <p><strong>Akurasi keseluruhan:</strong> ${pct(run.metrics.accuracy)} (${run.metrics.totalCorrect}/${run.metrics.totalCount} benar)</p>
        <p><strong>Model:</strong> ${MODEL_URL} — label: ${run.model.labels.join(', ')}</p>
    `;

    const header = `<tr><th>Actual \\ Predicted</th>${CLASSES.map(c => `<th>${c}</th>`).join('')}<th>Total</th></tr>`;
    const rows = CLASSES.map((cls, i) => {
        const rowSum = run.confusion[i].reduce((a, b) => a + b, 0);
        const cells = run.confusion[i].map((v, j) =>
            `<td class="${i === j ? 'cm-diag' : ''}">${v}</td>`
        ).join('');
        return `<tr><th>${cls}</th>${cells}<td>${rowSum}</td></tr>`;
    }).join('');
    els.confusionMatrix.innerHTML = `<table>${header}${rows}</table>`;

    const m = run.metrics;
    const metricRow = (label, p, r, f1, support) =>
        `<tr><td>${label}</td><td>${pct(p)}</td><td>${pct(r)}</td><td>${pct(f1)}</td><td>${support}</td></tr>`;
    els.metricsTable.innerHTML = `
        <table>
            <tr><th>Kelas</th><th>Precision</th><th>Recall</th><th>F1-score</th><th>Support</th></tr>
            ${m.perClass.map(c => metricRow(c.className, c.precision, c.recall, c.f1, c.support)).join('')}
            <tr class="cm-divider"><td colspan="5"></td></tr>
            ${metricRow('Macro avg', m.macroAvg.precision, m.macroAvg.recall, m.macroAvg.f1, m.macroAvg.support)}
            ${metricRow('Weighted avg', m.weightedAvg.precision, m.weightedAvg.recall, m.weightedAvg.f1, m.weightedAvg.support)}
        </table>
    `;

    const wrong = run.perImage.filter(p => !p.correct);
    if (wrong.length === 0) {
        els.misclassified.innerHTML = '<p>Tidak ada gambar yang salah klasifikasi.</p>';
    } else {
        const rows2 = wrong.map(p => `
            <tr>
                <td>${p.filename}</td>
                <td>${p.actual}</td>
                <td>${p.predicted ?? `(error: ${p.error})`}</td>
                <td>${p.confidence != null ? pct(p.confidence) : '-'}</td>
            </tr>
        `).join('');
        els.misclassified.innerHTML = `
            <table>
                <tr><th>File</th><th>Actual</th><th>Predicted</th><th>Confidence</th></tr>
                ${rows2}
            </table>
        `;
    }
}

function toCsv(run) {
    const lines = [];
    lines.push('# Confusion Matrix (rows=actual, cols=predicted)');
    lines.push(['Actual \\ Predicted', ...CLASSES, 'Total'].join(','));
    CLASSES.forEach((cls, i) => {
        const rowSum = run.confusion[i].reduce((a, b) => a + b, 0);
        lines.push([cls, ...run.confusion[i], rowSum].join(','));
    });
    lines.push('');
    lines.push('# Per-class metrics');
    lines.push(['class', 'precision', 'recall', 'f1', 'support'].join(','));
    run.metrics.perClass.forEach(c => {
        lines.push([c.className, c.precision.toFixed(4), c.recall.toFixed(4), c.f1.toFixed(4), c.support].join(','));
    });
    lines.push(['macro avg', run.metrics.macroAvg.precision.toFixed(4), run.metrics.macroAvg.recall.toFixed(4), run.metrics.macroAvg.f1.toFixed(4), run.metrics.macroAvg.support].join(','));
    lines.push(['weighted avg', run.metrics.weightedAvg.precision.toFixed(4), run.metrics.weightedAvg.recall.toFixed(4), run.metrics.weightedAvg.f1.toFixed(4), run.metrics.weightedAvg.support].join(','));
    lines.push('');
    lines.push(`# Overall accuracy,${run.metrics.accuracy.toFixed(4)}`);
    lines.push('');
    lines.push('# Per-image predictions');
    lines.push(['filename', 'actual', 'predicted', 'confidence', 'correct'].join(','));
    run.perImage.forEach(p => {
        lines.push([
            csvEscape(p.filename),
            p.actual,
            p.predicted ?? '',
            p.confidence != null ? p.confidence.toFixed(4) : '',
            p.correct,
        ].join(','));
    });
    return lines.join('\n');
}

function csvEscape(s) {
    if (s == null) return '';
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

els.exportCsvBtn.addEventListener('click', () => {
    if (!lastRun) return;
    download(`pilahpilih-eval-${Date.now()}.csv`, toCsv(lastRun), 'text/csv');
});

els.exportJsonBtn.addEventListener('click', () => {
    if (!lastRun) return;
    download(`pilahpilih-eval-${Date.now()}.json`, JSON.stringify(lastRun, null, 2), 'application/json');
});

els.runBtn.addEventListener('click', () => {
    runEvaluation().catch(e => {
        console.error(e);
        setStatus(`Evaluasi gagal: ${e.message || e}`);
        els.progress.hidden = true;
        els.runBtn.disabled = false;
    });
});

setStatus('Memuat model AI...');
model.loadModel(() => {
    setStatus('Model siap. Pilih gambar test untuk tiap kelas, lalu jalankan evaluasi.');
    updateSelectedCounts();
});
