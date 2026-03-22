/**
 * Sözleşme Dedektifi — Gemini REST API (tarayıcı)
 * Modeller sayfadaki açılır listeden seçilir (v1beta + generateContent).
 */
/** Ücretsiz kotada genelde daha az sorun: Flash-Lite. */
const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_API_VERSION = 'v1beta';
const MAX_CHARS = 32000;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const API_KEY_STORAGE = 'sozlesme_dedektifi_gemini_key_session';
const MODEL_STORAGE = 'sozlesme_dedektifi_model_session';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const $ = (id) => document.getElementById(id);

const apiKeyInput = $('api-key');
const modelSelect = $('model-select');
const contractText = $('contract-text');
const contractFileInput = $('contract-file');
const filePreviewWrap = $('file-preview-wrap');
const filePreviewImg = $('file-preview-img');
const filePreviewPdf = $('file-preview-pdf');
const filePreviewName = $('file-preview-name');
const filePreviewMeta = $('file-preview-meta');
const fileRemoveBtn = $('file-remove-btn');
const analyzeBtn = $('analyze-btn');
const analyzeBtnLabel = $('analyze-btn-label');
const resetBtn = $('reset-btn');
const charCount = $('char-count');
const loadingPanel = $('loading-panel');
const loadingDetail = $('loading-detail');
const formError = $('form-error');
const formErrorText = $('form-error-text');
const resultsSection = $('results');
const resultOzet = $('result-ozet');
const resultRiskler = $('result-riskler');
const resultSade = $('result-sade');

let previewObjectUrl = null;

function getAllowedModelValues() {
  if (!modelSelect) return new Set();
  return new Set(
    Array.from(modelSelect.options)
      .map((o) => o.value)
      .filter(Boolean)
  );
}

function getSelectedModelId() {
  const v = modelSelect?.value?.trim();
  if (v && getAllowedModelValues().has(v)) return v;
  return DEFAULT_MODEL;
}

function loadSessionSettings() {
  try {
    const k = sessionStorage.getItem(API_KEY_STORAGE);
    if (k) apiKeyInput.value = k;
  } catch {
    /* ignore */
  }
  try {
    const m = sessionStorage.getItem(MODEL_STORAGE);
    const allowed = getAllowedModelValues();
    if (m && allowed.has(m) && modelSelect) modelSelect.value = m;
  } catch {
    /* ignore */
  }
}

function saveApiKeyToSession() {
  try {
    const v = apiKeyInput.value.trim();
    if (v) sessionStorage.setItem(API_KEY_STORAGE, v);
    else sessionStorage.removeItem(API_KEY_STORAGE);
  } catch {
    /* ignore */
  }
}

function saveModelToSession() {
  try {
    const m = getSelectedModelId();
    if (m) sessionStorage.setItem(MODEL_STORAGE, m);
  } catch {
    /* ignore */
  }
}

function revokePreviewUrl() {
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }
}

function clearFileSelection() {
  revokePreviewUrl();
  if (contractFileInput) contractFileInput.value = '';
  if (filePreviewImg) {
    filePreviewImg.src = '';
    filePreviewImg.classList.add('hidden');
  }
  if (filePreviewPdf) filePreviewPdf.classList.add('hidden');
  if (filePreviewWrap) filePreviewWrap.classList.add('hidden');
  if (filePreviewName) filePreviewName.textContent = '';
  if (filePreviewMeta) filePreviewMeta.textContent = '';
  updateAnalyzeState();
}

function inferMimeFromName(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return '';
}

function normalizeMime(file) {
  let mime = (file.type || '').trim().toLowerCase();
  if (!mime || mime === 'application/octet-stream') {
    mime = inferMimeFromName(file.name);
  }
  return mime;
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function onFileSelected() {
  hideError();
  const file = contractFileInput?.files?.[0];
  if (!file) {
    clearFileSelection();
    return;
  }

  const mime = normalizeMime(file);
  if (!mime || !ALLOWED_MIME.has(mime)) {
    showError('Desteklenen türler: JPG, PNG, WebP, GIF veya PDF.');
    clearFileSelection();
    return;
  }

  if (file.size > MAX_FILE_BYTES) {
    showError(`Dosya çok büyük. En fazla ${formatBytes(MAX_FILE_BYTES)} yükleyebilirsiniz.`);
    clearFileSelection();
    return;
  }

  revokePreviewUrl();
  filePreviewName.textContent = file.name;
  filePreviewMeta.textContent = `${mime} · ${formatBytes(file.size)}`;

  if (mime === 'application/pdf') {
    filePreviewImg.classList.add('hidden');
    filePreviewImg.src = '';
    filePreviewPdf.classList.remove('hidden');
  } else {
    filePreviewPdf.classList.add('hidden');
    previewObjectUrl = URL.createObjectURL(file);
    filePreviewImg.src = previewObjectUrl;
    filePreviewImg.classList.remove('hidden');
  }

  filePreviewWrap.classList.remove('hidden');
  updateAnalyzeState();
}

function updateAnalyzeState() {
  const len = contractText.value.length;
  if (charCount) charCount.textContent = `${len} / ${MAX_CHARS} karakter`;
  const busy = loadingPanel.getAttribute('aria-busy') === 'true';
  const hasText = len > 0;
  const hasFile = Boolean(contractFileInput?.files?.length);
  analyzeBtn.disabled = busy || (!hasText && !hasFile);
}

const LOADING_DETAIL_DEFAULT = 'Sözleşme metni okunuyor, lütfen bekleyin…';
const ANALYZE_LABEL_IDLE = 'Analiz Et';
const ANALYZE_LABEL_BUSY = 'Dedektif inceliyor…';

function setLoading(on, detailText) {
  loadingPanel.classList.toggle('hidden', !on);
  loadingPanel.setAttribute('aria-busy', on ? 'true' : 'false');
  if (loadingDetail) {
    if (on && detailText) loadingDetail.textContent = detailText;
    if (!on) loadingDetail.textContent = LOADING_DETAIL_DEFAULT;
  }
  if (analyzeBtnLabel) {
    analyzeBtnLabel.textContent = on ? ANALYZE_LABEL_BUSY : ANALYZE_LABEL_IDLE;
  }
  contractText.disabled = on;
  if (contractFileInput) contractFileInput.disabled = on;
  if (fileRemoveBtn) fileRemoveBtn.disabled = on;
  if (modelSelect) modelSelect.disabled = on;
  updateAnalyzeState();
}

function hideError() {
  formError.classList.add('hidden');
  if (formErrorText) formErrorText.textContent = '';
}

function showError(msg) {
  if (formErrorText) formErrorText.textContent = msg;
  formError.classList.remove('hidden');
}

function clearResults() {
  resultOzet.textContent = '';
  resultRiskler.innerHTML = '';
  resultSade.textContent = '';
  resultsSection.classList.add('hidden');
  hideError();
}

const SYSTEM_INSTRUCTION = `Sen "Sözleşme Dedektifi" adlı yardımcı bir analiz aracısın. Kullanıcı Türkçe veya yabancı bir sözleşme / gizlilik politikası / kullanım koşulu metni yapıştıracak veya fotoğraf/PDF yükleyecek.

Metni bir hukuk uzmanının dikkatiyle incele; ancak çıktıyı hiç hukuk terimi bilmeyen sıradan bir insanın rahatça anlayacağı sade Türkçe ile yaz.

Görevin:
1) "ozet": Yaklaşık iki cümlelik, net bir özet.
2) "kirmizi_bayraklar": Kullanıcı aleyhine veya dikkat gerektiren 3–5 madde (gerekirse biraz daha fazla); her madde kısa ve anlaşılır olsun.
3) "sade_aciklama": Metnin en önemli kısımlarını çok basit dille, paragraf olarak anlat.

Yanıtın YALNIZCA geçerli bir JSON nesnesi olsun; markdown veya açıklama metni ekleme. Şema:
{"ozet":"string","kirmizi_bayraklar":["string",...],"sade_aciklama":"string"}

Görsel veya PDF verildiyse önce OCR ile metni oku, sonra aynı şemada analiz et. Metin sözleşme gibi görünmüyorsa nazikçe analiz et veya kısa bir uyarı ekle.`;

const VISUAL_USER_PROMPT = `Bu fotoğraf bir kullanıcı sözleşmesi veya gizlilik politikasıdır. Lütfen bu görseli OCR ile oku, içindeki metni analiz et, kritik riskleri (kırmızı bayrakları) tespit et ve sadeleştirilmiş bir özet çıkar. PDF veya çok sayfalı belge ise metni sayfalardan oku ve aynı şekilde analiz et.

Yanıtını yalnızca sistem talimatında belirtilen JSON şemasına uygun tek bir JSON nesnesi olarak ver; başka metin ekleme.`;

function extractJsonFromText(text) {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1].trim() : trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('JSON bulunamadı');
  return JSON.parse(candidate.slice(start, end + 1));
}

function renderResults(data) {
  resultOzet.textContent = data.ozet || '—';
  resultRiskler.innerHTML = '';
  const flags = Array.isArray(data.kirmizi_bayraklar)
    ? data.kirmizi_bayraklar
    : Array.isArray(data.riskler)
      ? data.riskler
      : [];
  const flagIcon =
    '<svg class="mt-0.5 h-5 w-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3v1.5m0 0V21m0-16.5h13.5a1.5 1.5 0 0 1 1.5 1.5v4.5a1.5 1.5 0 0 1-1.5 1.5H3z"/></svg>';
  const infoIcon =
    '<svg class="mt-0.5 h-5 w-5 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"/></svg>';

  if (flags.length === 0) {
    const li = document.createElement('li');
    li.className =
      'flex gap-3 rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2.5 text-slate-400';
    li.innerHTML = `${infoIcon}<span class="min-w-0 flex-1 leading-relaxed"></span>`;
    li.querySelector('span:last-child').textContent =
      'Belirgin bir kırmızı bayrak listelenmedi veya metin yetersiz.';
    resultRiskler.appendChild(li);
  } else {
    flags.forEach((item) => {
      const li = document.createElement('li');
      li.className =
        'flex gap-3 rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2.5 text-slate-200';
      li.innerHTML = `${flagIcon}<span class="min-w-0 flex-1 leading-relaxed"></span>`;
      li.querySelector('span:last-child').textContent = String(item);
      resultRiskler.appendChild(li);
    });
  }
  resultSade.textContent = data.sade_aciklama || data.sadelesmis || '—';
  resultsSection.classList.remove('hidden');
}

function formatApiQuotaMessage(raw) {
  if (!raw || typeof raw !== 'string') return raw;
  const lower = raw.toLowerCase();
  if (
    !lower.includes('quota') &&
    !lower.includes('resource_exhausted') &&
    !lower.includes('limit: 0')
  ) {
    return raw;
  }
  const retryMatch = raw.match(/retry in ([\d.]+)s/i);
  const waitSec = retryMatch ? Math.ceil(parseFloat(retryMatch[1], 10)) : null;
  let out =
    'Ücretsiz kota sınırı: Çok sık analiz veya günlük/dakikalık limit dolmuş olabilir. Bir süre bekleyip tekrar deneyin; metni kısaltmak veya büyük PDF yerine parça parça göndermek kotayı korur. ';
  out +=
    'Limit tablosu: https://ai.google.dev/gemini-api/docs/rate-limits — Kullanım özeti: https://ai.dev/rate-limit';
  if (waitSec && waitSec > 0) {
    out += ` Önerilen bekleme: yaklaşık ${waitSec} sn.`;
  }
  out +=
    ' Hâlâ “limit: 0” görürseniz sayfadaki model listesinden daha hafif bir Flash / Flash-Lite seçin.';
  return out;
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result;
      if (typeof res !== 'string') {
        reject(new Error('Dosya okunamadı.'));
        return;
      }
      const comma = res.indexOf(',');
      const b64 = comma >= 0 ? res.slice(comma + 1) : res;
      resolve(b64);
    };
    reader.onerror = () => reject(new Error('Dosya okunurken hata oluştu.'));
    reader.readAsDataURL(file);
  });
}

async function geminiGenerate(apiKey, modelId, body) {
  const url = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000);

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') {
      throw new Error('İstek zaman aşımına uğradı. Bağlantınızı kontrol edip tekrar deneyin.');
    }
    throw new Error('Ağ hatası: ' + (e.message || 'Bağlantı kurulamadı'));
  }
  clearTimeout(timeoutId);

  const raw = await res.text();
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error('Sunucudan geçersiz yanıt alındı.');
  }

  if (!res.ok) {
    const rawMsg =
      json?.error?.message ||
      json?.error?.status ||
      `API hatası (${res.status}). Tarayıcı konsolunu kontrol edin.`;
    throw new Error(formatApiQuotaMessage(rawMsg));
  }

  const parts = json?.candidates?.[0]?.content?.parts;
  const text = parts?.map((p) => p.text || '').join('') || '';
  if (!text.trim()) {
    throw new Error('Model boş yanıt döndü. Dosyayı küçültüp veya metin ekleyip tekrar deneyin.');
  }

  try {
    return extractJsonFromText(text);
  } catch (parseErr) {
    console.error('JSON ayrıştırma hatası. Ham model yanıtı:', text);
    throw new Error(
      'Yanıt JSON olarak çözülemedi. Tarayıcı konsolundaki hatayı ve ham yanıtı kontrol edin.'
    );
  }
}

/** v1 generateContent: systemInstruction ve generationConfig.responseMimeType desteklenmiyor; talimat metin içinde. */
function baseRequestBody(userParts) {
  return {
    contents: [{ role: 'user', parts: userParts }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
    },
  };
}

async function callGeminiText(apiKey, userText) {
  const fullText = `${SYSTEM_INSTRUCTION}\n\n---\n\nAşağıdaki sözleşme veya politika metnini analiz et:\n\n${userText}`;
  const body = baseRequestBody([{ text: fullText }]);
  return geminiGenerate(apiKey, getSelectedModelId(), body);
}

async function callGeminiVisual(apiKey, file, mimeType, extraText) {
  const base64 = await readFileAsBase64(file);
  let promptText = VISUAL_USER_PROMPT;
  const extra = (extraText || '').trim();
  if (extra) {
    promptText += `\n\nEk bağlam (kullanıcının metin kutusuna yazdığı not):\n${extra}`;
  }

  const textPart = `${SYSTEM_INSTRUCTION}\n\n---\n\n${promptText}`;
  const parts = [
    { text: textPart },
    {
      inlineData: {
        mimeType,
        data: base64,
      },
    },
  ];

  const body = baseRequestBody(parts);
  return geminiGenerate(apiKey, getSelectedModelId(), body);
}

async function onAnalyze() {
  hideError();
  saveApiKeyToSession();
  saveModelToSession();

  const key = apiKeyInput.value.trim();
  if (!key) {
    showError('Lütfen Google AI Studio’dan aldığınız Gemini API anahtarını girin.');
    return;
  }

  const text = contractText.value.trim();
  const file = contractFileInput?.files?.[0];

  if (!text && !file) {
    showError('Lütfen analiz edilecek metni yapıştırın veya bir fotoğraf/PDF yükleyin.');
    return;
  }

  if (text.length > MAX_CHARS) {
    showError(`Metin en fazla ${MAX_CHARS} karakter olabilir.`);
    return;
  }

  const useFile = Boolean(file);
  const loadingMsg = useFile
    ? 'Görsel veya PDF okunuyor; dedektif riskleri tarıyor…'
    : 'Metin inceleniyor; dedektif kırmızı bayrakları arıyor…';

  setLoading(true, loadingMsg);
  try {
    let data;
    if (useFile) {
      const mime = normalizeMime(file);
      if (!mime || !ALLOWED_MIME.has(mime)) {
        throw new Error('Geçersiz dosya türü.');
      }
      data = await callGeminiVisual(key, file, mime, text);
    } else {
      data = await callGeminiText(key, text);
    }
    renderResults(data);
  } catch (err) {
    console.error('Sözleşme Dedektifi hata:', err);
    showError(err.message || 'Beklenmeyen bir hata oluştu. Tarayıcı konsolundaki hatayı kontrol edin.');
  } finally {
    setLoading(false);
    updateAnalyzeState();
  }
}

function onReset() {
  clearResults();
  clearFileSelection();
  contractText.focus();
}

apiKeyInput.addEventListener('change', saveApiKeyToSession);
apiKeyInput.addEventListener('blur', saveApiKeyToSession);
if (modelSelect) {
  modelSelect.addEventListener('change', saveModelToSession);
}
contractText.addEventListener('input', updateAnalyzeState);
contractFileInput.addEventListener('change', onFileSelected);
fileRemoveBtn.addEventListener('click', () => {
  clearFileSelection();
  hideError();
});
analyzeBtn.addEventListener('click', onAnalyze);
resetBtn.addEventListener('click', onReset);

contractText.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.ctrlKey && !analyzeBtn.disabled) {
    e.preventDefault();
    onAnalyze();
  }
});

loadSessionSettings();
updateAnalyzeState();
