// --- Significant Figures Calculator ---

// สลับฟิลด์อินพุตตามโหมดที่เลือก (นับเลขนัยสำคัญ หรือ ปัดตัวเลข)
function toggleSigFigInputs() {
    const modeEl = document.getElementById('sigfigMode');
    const nGroup = document.getElementById('group-sigfig-n');
    if (!modeEl || !nGroup) return;

    nGroup.style.display = (modeEl.value === 'round') ? 'block' : 'none';

    const resultBox = document.getElementById('sigfigResultBox');
    const errorBox = document.getElementById('sigfigErrorBox');
    if (resultBox) resultBox.style.display = 'none';
    if (errorBox) errorBox.style.display = 'none';
}

document.addEventListener("DOMContentLoaded", toggleSigFigInputs);

// --- แปลงเลขยกกำลังแบบ JS (เช่น 1.20e+4) ให้อ่านง่ายแบบ 1.20 × 10⁴ ---
function formatSciNotation(numStr) {
    const match = String(numStr).match(/^(-?[0-9.]+)e([+-]?\d+)$/i);
    if (!match) return numStr;

    const mantissa = match[1];
    const exp = parseInt(match[2], 10);
    const superscriptMap = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    const expDisplay = String(exp).split('').map(ch => superscriptMap[ch] ?? ch).join('');

    return `${mantissa} × 10${expDisplay}`;
}

// --- นับจำนวนเลขนัยสำคัญจากข้อความตัวเลขที่ผู้ใช้กรอก ---
// เก็บรูปแบบดั้งเดิมที่ผู้ใช้พิมพ์ไว้ (เช่น เลขศูนย์ต่อท้าย, จุดทศนิยม) เพราะ parseFloat จะทำให้ข้อมูลนี้หายไป
function countSigFigs(raw) {
    const str = raw.trim();
    if (str === '') {
        throw new Error("Please enter a number first 💕");
    }

    // แยกส่วน mantissa ออกจากเลขยกกำลัง ถ้ามี (เช่น 1.20e3 -> mantissa = 1.20)
    const sciMatch = str.match(/^([+-]?[0-9]*\.?[0-9]+)\s*[eE]\s*([+-]?[0-9]+)$/);
    let mantissa = sciMatch ? sciMatch[1] : str;
    mantissa = mantissa.replace(/^[+-]/, '');

    if (!/^[0-9]*\.?[0-9]*$/.test(mantissa) || mantissa === '' || mantissa === '.') {
        throw new Error("Please enter a valid number (e.g., 0.045, 120, 1.20e3) 💕");
    }

    const hasDecimalPoint = mantissa.includes('.');
    const digitsOnly = mantissa.replace('.', '');

    if (digitsOnly.length === 0) {
        throw new Error("Please enter a valid number 💕");
    }

    const digitArray = digitsOnly.split('');
    const firstNonZero = digitArray.findIndex(d => d !== '0');

    let sigDigits;
    let explanation;

    if (firstNonZero === -1) {
        // ตัวเลขเป็นศูนย์ล้วน เช่น "0", "0.00"
        if (hasDecimalPoint) {
            const decimalPart = mantissa.split('.')[1] || '';
            sigDigits = Math.max(decimalPart.length, 1);
            explanation = "All digits are zero, but the decimal point makes the trailing zero(s) significant.";
        } else {
            sigDigits = 1;
            explanation = "A value of zero with no decimal point is ambiguous, so it's treated as 1 significant figure.";
        }
    } else if (!hasDecimalPoint) {
        // ไม่มีจุดทศนิยม: เลขศูนย์ต่อท้ายถือว่ากำกวม จึงไม่นับ
        let lastNonZero = firstNonZero;
        for (let i = digitArray.length - 1; i >= 0; i--) {
            if (digitArray[i] !== '0') { lastNonZero = i; break; }
        }
        sigDigits = lastNonZero - firstNonZero + 1;
        explanation = "Leading zeros don't count, and trailing zeros without a decimal point are ambiguous (not counted here).";
    } else {
        // มีจุดทศนิยม: นับทุกหลักตั้งแต่เลขนัยสำคัญตัวแรกจนถึงตัวสุดท้าย (รวมเลขศูนย์ต่อท้ายด้วย)
        sigDigits = digitsOnly.length - firstNonZero;
        explanation = "Leading zeros don't count, but since a decimal point is present, trailing zeros ARE significant.";
    }

    return { sigDigits, explanation };
}

// --- ฟังก์ชันหลักในการคำนวณ (นับ หรือ ปัดเศษ) ---
function calculateSigFigs() {
    const modeEl = document.getElementById('sigfigMode');
    const inputEl = document.getElementById('sigfigInput');
    const resultBox = document.getElementById('sigfigResultBox');
    const errorBox = document.getElementById('sigfigErrorBox');
    const formulaTitle = document.getElementById('sigfigFormulaTitle');
    const stepsDiv = document.getElementById('sigfigSteps');
    const resultValue = document.getElementById('sigfigResultValue');

    if (!modeEl || !inputEl || !resultBox || !errorBox || !stepsDiv || !resultValue) return;

    resultBox.style.display = 'none';
    errorBox.style.display = 'none';

    const mode = modeEl.value;
    const raw = inputEl.value || '';

    try {
        if (mode === 'count') {
            const { sigDigits, explanation } = countSigFigs(raw);

            if (formulaTitle) formulaTitle.innerText = "📝 Significant Figures Count";
            stepsDiv.innerHTML = `
                <strong>Input:</strong> ${raw.trim()}<br><br>
                ${explanation}
            `;
            resultValue.innerText = `${sigDigits} sig fig${sigDigits === 1 ? '' : 's'}`;

        } else {
            const nInput = document.getElementById('sigfigN');
            const n = nInput ? parseInt(nInput.value, 10) : NaN;
            const num = parseFloat(raw);

            if (raw.trim() === '' || isNaN(num)) {
                return showSigFigError("Please enter a valid number 💕");
            }
            if (!isFinite(num)) {
                return showSigFigError("Please enter a finite number 💕");
            }
            if (isNaN(n) || n < 1) {
                return showSigFigError("Please enter how many significant figures to round to (1 or more) 💕");
            }
            if (n > 100) {
                return showSigFigError("Please enter a smaller number of significant figures 💕");
            }

            const roundedStr = (num === 0) ? "0" : num.toPrecision(n);
            const displayResult = formatSciNotation(roundedStr);

            if (formulaTitle) formulaTitle.innerText = "📝 Rounded Result";
            stepsDiv.innerHTML = `
                <strong>Input:</strong> ${raw.trim()}<br>
                <strong>Rounded to:</strong> ${n} significant figure${n === 1 ? '' : 's'}<br><br>
                ${raw.trim()} &rarr; <strong>${displayResult}</strong>
            `;
            resultValue.innerText = displayResult;
        }

        resultBox.style.display = 'block';

    } catch (error) {
        showSigFigError(error.message);
    }
}

function showSigFigError(message) {
    const errorBox = document.getElementById('sigfigErrorBox');
    if (errorBox) {
        errorBox.innerText = message;
        errorBox.style.display = 'block';
    }
}