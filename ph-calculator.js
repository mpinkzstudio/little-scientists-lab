// --- pH Calculator (Basic) ---
// สมมติฐาน: อุณหภูมิ 25°C (Kw = 1.0 x 10^-14) และกรด/เบสแก่แตกตัวสมบูรณ์แบบ 1:1
// (เช่น HCl, NaOH ที่ให้ H+ หรือ OH- หนึ่งตัวต่อโมเลกุล)
const KW_25C = 1.0e-14;

// --- สลับป้ายชื่อ/placeholder/หน่วย ตามโหมดที่เลือก ---
function togglePhInputs() {
    const modeEl = document.getElementById('phMode');
    const labelEl = document.getElementById('phInputLabel');
    const inputEl = document.getElementById('phInputValue');
    const unitEl = document.getElementById('phInputUnit');
    const wrapperEl = document.getElementById('phInputWrapper');
    if (!modeEl || !labelEl || !inputEl || !unitEl || !wrapperEl) return;

    const mode = modeEl.value;
    const isConcentration = (mode === 'hConc' || mode === 'ohConc');

    const labels = {
        hConc: 'Concentration [H⁺] (or Strong Monoprotic Acid, e.g. HCl)',
        ohConc: 'Concentration [OH⁻] (or Strong Monohydroxide Base, e.g. NaOH)',
        pOHValue: 'pOH Value',
        pHValue: 'pH Value'
    };
    const placeholders = {
        hConc: 'e.g., 0.01',
        ohConc: 'e.g., 0.001',
        pOHValue: 'e.g., 4.0',
        pHValue: 'e.g., 3.0'
    };

    labelEl.innerText = labels[mode] || 'Value';
    inputEl.placeholder = placeholders[mode] || '';

    // ซ่อนตัวเลือกหน่วยเมื่อกรอกเป็นค่า pH/pOH โดยตรง เพราะเป็นค่าไร้หน่วย
    unitEl.style.display = isConcentration ? 'block' : 'none';
    wrapperEl.style.gridTemplateColumns = isConcentration ? '1fr 100px' : '1fr';

    const resultBox = document.getElementById('phResultBox');
    const errorBox = document.getElementById('phErrorBox');
    if (resultBox) resultBox.style.display = 'none';
    if (errorBox) errorBox.style.display = 'none';
}

document.addEventListener("DOMContentLoaded", togglePhInputs);

// --- จัดรูปแบบตัวเลขความเข้มข้นให้อ่านง่าย ---
function fmtPhConc(num) {
    if (num === 0) return "0";
    if (Math.abs(num) < 0.001 || Math.abs(num) > 9999) return num.toExponential(3);
    return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

// --- ฟังก์ชันหลักในการคำนวณ pH ---
function calculatePh() {
    const modeEl = document.getElementById('phMode');
    const inputEl = document.getElementById('phInputValue');
    const unitEl = document.getElementById('phInputUnit');
    const resultBox = document.getElementById('phResultBox');
    const errorBox = document.getElementById('phErrorBox');
    const stepsDiv = document.getElementById('phSteps');
    const phEl = document.getElementById('phResultPH');
    const pohEl = document.getElementById('phResultPOH');
    const hEl = document.getElementById('phResultH');
    const ohEl = document.getElementById('phResultOH');
    const natureEl = document.getElementById('phNatureNote');

    if (!modeEl || !inputEl || !resultBox || !errorBox || !stepsDiv || !phEl || !pohEl || !hEl || !ohEl) return;

    resultBox.style.display = 'none';
    errorBox.style.display = 'none';

    const mode = modeEl.value;
    const raw = parseFloat(inputEl.value);

    if (isNaN(raw)) {
        return showPhError("Please enter a valid number 💕");
    }

    let pH, pOH, H, OH;
    let stepsHtml = "";

    try {
        if (mode === 'hConc') {
            if (raw <= 0) throw new Error("Concentration must be greater than zero 💕");
            const unitFactor = parseFloat(unitEl.value);
            H = raw * unitFactor;

            pH = -Math.log10(H);
            pOH = 14 - pH;
            OH = KW_25C / H;

            stepsHtml = `
                <strong>[H⁺] = Concentration</strong> (given directly, or from a strong monoprotic acid that dissociates completely)<br>
                &bull; [H⁺] = ${fmtPhConc(H)} M<br>
                &bull; pH = -log[H⁺] = -log(${fmtPhConc(H)}) = <strong>${pH.toFixed(2)}</strong><br>
                &bull; pOH = 14 − pH = <strong>${pOH.toFixed(2)}</strong>
            `;

        } else if (mode === 'ohConc') {
            if (raw <= 0) throw new Error("Concentration must be greater than zero 💕");
            const unitFactor = parseFloat(unitEl.value);
            OH = raw * unitFactor;

            pOH = -Math.log10(OH);
            pH = 14 - pOH;
            H = KW_25C / OH;

            stepsHtml = `
                <strong>[OH⁻] = Concentration</strong> (given directly, or from a strong monohydroxide base that dissociates completely)<br>
                &bull; [OH⁻] = ${fmtPhConc(OH)} M<br>
                &bull; pOH = -log[OH⁻] = -log(${fmtPhConc(OH)}) = <strong>${pOH.toFixed(2)}</strong><br>
                &bull; pH = 14 − pOH = <strong>${pH.toFixed(2)}</strong>
            `;

        } else if (mode === 'pOHValue') {
            pOH = raw;
            pH = 14 - pOH;
            OH = Math.pow(10, -pOH);
            H = Math.pow(10, -pH);

            stepsHtml = `
                <strong>Given pOH directly</strong><br>
                &bull; pOH = ${pOH.toFixed(2)}<br>
                &bull; pH = 14 − pOH = <strong>${pH.toFixed(2)}</strong><br>
                &bull; [OH⁻] = 10⁻ᵖᴼᴴ = ${fmtPhConc(OH)} M<br>
                &bull; [H⁺] = 10⁻ᵖᴴ = ${fmtPhConc(H)} M
            `;

        } else if (mode === 'pHValue') {
            pH = raw;
            pOH = 14 - pH;
            H = Math.pow(10, -pH);
            OH = Math.pow(10, -pOH);

            stepsHtml = `
                <strong>Given pH directly</strong><br>
                &bull; pH = ${pH.toFixed(2)}<br>
                &bull; pOH = 14 − pH = <strong>${pOH.toFixed(2)}</strong><br>
                &bull; [H⁺] = 10⁻ᵖᴴ = ${fmtPhConc(H)} M<br>
                &bull; [OH⁻] = 10⁻ᵖᴼᴴ = ${fmtPhConc(OH)} M
            `;
        } else {
            throw new Error("Please select a calculation mode 💕");
        }
    } catch (err) {
        return showPhError(err.message);
    }

    if (!isFinite(pH) || isNaN(pH) || !isFinite(pOH) || isNaN(pOH)) {
        return showPhError("Calculated value is invalid. Please check your input! 🥺");
    }

    stepsDiv.innerHTML = stepsHtml;
    phEl.innerText = pH.toFixed(2);
    pohEl.innerText = pOH.toFixed(2);
    hEl.innerText = `${fmtPhConc(H)} M`;
    ohEl.innerText = `${fmtPhConc(OH)} M`;

    let nature;
    if (pH < 6.99) nature = "🔴 Acidic";
    else if (pH > 7.01) nature = "🔵 Basic";
    else nature = "🟢 Neutral";
    if (natureEl) natureEl.innerText = nature;

    resultBox.style.display = 'block';
}

function showPhError(message) {
    const errorBox = document.getElementById('phErrorBox');
    if (errorBox) {
        errorBox.innerText = message;
        errorBox.style.display = 'block';
    }
}