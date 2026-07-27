// --- Scientific Notation Converter ---
// หมายเหตุ: ฟังก์ชัน countSigFigs() และ formatSciNotation() มาจากไฟล์ sig-figs.js
// (ต้องโหลดไฟล์ sig-figs.js ก่อนไฟล์นี้ใน index.html)

// สลับกลุ่มฟิลด์อินพุตตามโหมดที่เลือก
function toggleSciNotInputs() {
    const modeEl = document.getElementById('sciNotMode');
    const inputGroup = document.getElementById('group-scinot-input');
    const addsubOpGroup = document.getElementById('group-scinot-addsub-op');
    const muldivOpGroup = document.getElementById('group-scinot-muldiv-op');
    const abGroup = document.getElementById('group-scinot-ab');
    if (!modeEl || !inputGroup || !addsubOpGroup || !muldivOpGroup || !abGroup) return;

    const mode = modeEl.value;

    inputGroup.style.display = (mode === 'convert') ? 'block' : 'none';
    addsubOpGroup.style.display = (mode === 'addsub') ? 'block' : 'none';
    muldivOpGroup.style.display = (mode === 'muldiv') ? 'block' : 'none';
    abGroup.style.display = (mode === 'convert') ? 'none' : 'grid';

    const resultBox = document.getElementById('scinotResultBox');
    const errorBox = document.getElementById('scinotErrorBox');
    if (resultBox) resultBox.style.display = 'none';
    if (errorBox) errorBox.style.display = 'none';
}

document.addEventListener("DOMContentLoaded", toggleSciNotInputs);

// --- แปลงข้อความตัวเลข (มาตรฐานหรือ sci notation) เป็นค่าตัวเลขจริง พร้อมตรวจสอบรูปแบบ ---
function parseNumberInput(raw) {
    const str = raw.trim();
    if (str === '') throw new Error("Please enter a number 💕");

    if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(str)) {
        throw new Error("Please enter a valid number format (e.g., 12500 or 1.25e4) 💕");
    }

    const num = parseFloat(str);
    if (isNaN(num) || !isFinite(num)) {
        throw new Error("Please enter a valid, finite number 💕");
    }
    return num;
}

// --- ตรวจสอบว่าเป็นเลขทศนิยมธรรมดา (ไม่มีเลขยกกำลัง e/E) สำหรับโหมดคำนวณบวก/ลบ/คูณ/หาร ---
// จำกัดไว้เฉพาะทศนิยมธรรมดา เพราะการนับ "ตำแหน่งทศนิยม" ตามกฎเลขนัยสำคัญต้องอิงจากรูปแบบที่ผู้ใช้พิมพ์จริง
function validatePlainDecimal(raw) {
    const str = raw.trim();
    if (str === '') {
        throw new Error("Please fill in both numbers 💕");
    }
    if (/[eE]/.test(str)) {
        throw new Error("For this mode, please enter plain decimal numbers without exponents (e.g., 12.4) 💕");
    }
    // ใช้ตัวตรวจสอบเดียวกับ parseNumberInput เพื่อความถูกต้องของรูปแบบ
    parseNumberInput(str);
}

// --- นับจำนวนตำแหน่งทศนิยมจากข้อความดั้งเดิมที่ผู้ใช้พิมพ์ (ไม่ใช้ parseFloat เพราะจะทำให้เลขศูนย์ท้ายหายไป) ---
function countDecimalPlaces(raw) {
    const str = raw.trim();
    if (str.includes('.')) {
        return str.split('.')[1].length;
    }
    return 0;
}

// --- แปลงเลขยกกำลัง (เช่น "1.25e+4") ให้กลับเป็นทศนิยมเต็มรูปแบบ โดยไม่ตัดเลขนัยสำคัญทิ้ง ---
function expandExponential(num) {
    const exp = num.toExponential();
    const match = exp.match(/^(-?)(\d)(?:\.(\d+))?e([+-]\d+)$/i);
    if (!match) return String(num);

    const sign = match[1];
    const intDigit = match[2];
    const fracDigits = match[3] || '';
    const exponent = parseInt(match[4], 10);
    const digits = intDigit + fracDigits;

    let result;
    if (exponent >= 0) {
        if (exponent >= fracDigits.length) {
            result = digits + '0'.repeat(exponent - fracDigits.length);
        } else {
            const pointPos = 1 + exponent;
            result = digits.slice(0, pointPos) + '.' + digits.slice(pointPos);
        }
    } else {
        result = '0.' + '0'.repeat(-exponent - 1) + digits;
    }

    return sign + result;
}

// --- แปลงตัวเลขให้เป็น Standard Notation (ทศนิยมปกติที่อ่านง่าย) ---
function toStandardNotation(num) {
    if (num === 0) return "0";
    const str = num.toString();
    // JS จะเปลี่ยนตัวเลขที่เล็กหรือใหญ่มากให้เป็น exponential เองโดยอัตโนมัติ (เช่น 1e+21, 5e-8)
    // จึงต้องขยายกลับเป็นทศนิยมเต็มด้วยฟังก์ชันด้านบน
    if (str.includes('e') || str.includes('E')) {
        return expandExponential(num);
    }
    return str;
}

// --- แปลงตัวเลขให้เป็น Scientific Notation แบบมาตรฐาน (mantissa หนึ่งหลักหน้าจุดทศนิยม) ---
function toScientificNotation(num) {
    if (num === 0) return "0 × 10⁰";
    return formatSciNotation(num.toExponential());
}

// --- จัดรูปแบบตัวเลขดิบก่อนปัดเศษให้อ่านง่าย (ตัด floating point error ที่ยาวเกินจำเป็นออก) ---
function fmtRawResult(num) {
    return parseFloat(num.toPrecision(12)).toString();
}

// --- ฟังก์ชันหลักในการคำนวณของหน้านี้ (แปลงรูปแบบ / บวกลบ / คูณหาร) ---
function calculateSciNot() {
    const modeEl = document.getElementById('sciNotMode');
    const resultBox = document.getElementById('scinotResultBox');
    const errorBox = document.getElementById('scinotErrorBox');
    const formulaTitle = document.getElementById('scinotFormulaTitle');
    const stepsDiv = document.getElementById('scinotSteps');
    const resultValue = document.getElementById('scinotResultValue');

    if (!modeEl || !resultBox || !errorBox || !stepsDiv || !resultValue) return;

    resultBox.style.display = 'none';
    errorBox.style.display = 'none';

    const mode = modeEl.value;

    try {
        if (mode === 'convert') {
            const inputEl = document.getElementById('scinotInput');
            const raw = inputEl ? inputEl.value : '';
            const num = parseNumberInput(raw);

            const standard = toStandardNotation(num);
            const scientific = toScientificNotation(num);

            if (formulaTitle) formulaTitle.innerText = "📝 Notation Conversion";
            stepsDiv.innerHTML = `
                <strong>Input:</strong> ${raw.trim()}<br><br>
                <strong>Standard Notation:</strong> ${standard}<br>
                <strong>Scientific Notation:</strong> ${scientific}
            `;
            resultValue.innerText = scientific;

        } else if (mode === 'addsub') {
            const rawA = document.getElementById('scinotA').value || '';
            const rawB = document.getElementById('scinotB').value || '';
            const opEl = document.querySelector('input[name="sciAddSubOp"]:checked');

            validatePlainDecimal(rawA);
            validatePlainDecimal(rawB);

            const a = parseNumberInput(rawA);
            const b = parseNumberInput(rawB);
            const op = opEl ? opEl.value : 'add';

            const rawResult = (op === 'add') ? (a + b) : (a - b);
            const decA = countDecimalPlaces(rawA);
            const decB = countDecimalPlaces(rawB);
            const minDec = Math.min(decA, decB);
            const rounded = rawResult.toFixed(minDec);

            if (formulaTitle) formulaTitle.innerText = (op === 'add') ? "📝 Addition (Sig Fig Rule)" : "📝 Subtraction (Sig Fig Rule)";
            stepsDiv.innerHTML = `
                <strong>Rule:</strong> The result keeps the same number of decimal places as the input with the fewest decimal places.<br><br>
                &bull; ${rawA.trim()} (${decA} decimal place${decA === 1 ? '' : 's'}) ${op === 'add' ? '+' : '−'} ${rawB.trim()} (${decB} decimal place${decB === 1 ? '' : 's'}) = ${fmtRawResult(rawResult)}<br>
                &bull; Fewest decimal places = ${minDec}<br>
                &bull; Rounded answer = <strong>${rounded}</strong>
            `;
            resultValue.innerText = rounded;

        } else if (mode === 'muldiv') {
            const rawA = document.getElementById('scinotA').value || '';
            const rawB = document.getElementById('scinotB').value || '';
            const opEl = document.querySelector('input[name="sciMulDivOp"]:checked');

            validatePlainDecimal(rawA);
            validatePlainDecimal(rawB);

            const a = parseNumberInput(rawA);
            const b = parseNumberInput(rawB);
            const op = opEl ? opEl.value : 'mul';

            if (op === 'div' && b === 0) {
                return showSciNotError("Cannot divide by zero 💕");
            }

            const rawResult = (op === 'mul') ? (a * b) : (a / b);
            const sigA = countSigFigs(rawA).sigDigits;
            const sigB = countSigFigs(rawB).sigDigits;
            const minSig = Math.min(sigA, sigB);

            const roundedStr = (rawResult === 0) ? "0" : rawResult.toPrecision(minSig);
            const rounded = formatSciNotation(roundedStr);

            if (formulaTitle) formulaTitle.innerText = (op === 'mul') ? "📝 Multiplication (Sig Fig Rule)" : "📝 Division (Sig Fig Rule)";
            stepsDiv.innerHTML = `
                <strong>Rule:</strong> The result keeps the same number of significant figures as the input with the fewest significant figures.<br><br>
                &bull; ${rawA.trim()} (${sigA} sig fig${sigA === 1 ? '' : 's'}) ${op === 'mul' ? '×' : '÷'} ${rawB.trim()} (${sigB} sig fig${sigB === 1 ? '' : 's'}) = ${fmtRawResult(rawResult)}<br>
                &bull; Fewest sig figs = ${minSig}<br>
                &bull; Rounded answer = <strong>${rounded}</strong>
            `;
            resultValue.innerText = rounded;
        }

        resultBox.style.display = 'block';

    } catch (error) {
        showSciNotError(error.message);
    }
}

function showSciNotError(message) {
    const errorBox = document.getElementById('scinotErrorBox');
    if (errorBox) {
        errorBox.innerText = message;
        errorBox.style.display = 'block';
    }
}