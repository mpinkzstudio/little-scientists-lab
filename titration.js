let titrationResult = {
    concentration: 0,
    originalConcentration: 0,
    moles: 0
};

// Acid Database
const acidData = {
    HCl: { name: "Hydrochloric Acid (HCl)", mw: 36.46 },
    HNO3: { name: "Nitric Acid (HNO₃)", mw: 63.01 },
    HBr: { name: "Hydrobromic Acid (HBr)", mw: 80.91 },
    HI: { name: "Hydroiodic Acid (HI)", mw: 127.91 },
    HClO4: { name: "Perchloric Acid (HClO₄)", mw: 100.45 }
};

// Auto Fill Molecular Weight
function updateAcidData() {
    const analyteSelect = document.getElementById("analyteSelect");
    const mwBox = document.getElementById("molecularWeight");
    if (!analyteSelect || !mwBox) return;

    const acid = analyteSelect.value;
    if (acidData[acid]) {
        mwBox.value = acidData[acid].mw;
    } else {
        mwBox.value = "";
    }
}

// Calculate Titration (C1V1 = C2V2)
function calculateTitration() {
    const resultBox = document.getElementById("titrationResultBox");
    const errorBox = document.getElementById("titrationErrorBox");

    if (resultBox) resultBox.style.display = "none";
    if (errorBox) errorBox.style.display = "none";

    const titrantConcEl = document.getElementById("titrantConc");
    const titrantConcUnitEl = document.getElementById("titrantConcUnit");
    const titrantVolEl = document.getElementById("titrantVol");
    const titrantVolUnitEl = document.getElementById("titrantVolUnit");
    const sampleVolEl = document.getElementById("sampleVol");
    const sampleVolUnitEl = document.getElementById("sampleVolUnit");

    if (!titrantConcEl || !titrantVolEl || !sampleVolEl) {
        showCustomError("titrationErrorBox", "Missing required input fields in HTML.");
        return;
    }

    const C1Input = parseFloat(titrantConcEl.value);
    const C1Unit = titrantConcUnitEl ? titrantConcUnitEl.value : "M";
    const V1Input = parseFloat(titrantVolEl.value);
    const V1Unit = titrantVolUnitEl ? titrantVolUnitEl.value : "mL";
    const V2Input = parseFloat(sampleVolEl.value);
    const V2Unit = sampleVolUnitEl ? sampleVolUnitEl.value : "mL";

    const stepBox = document.getElementById("titrationSteps");
    const result = document.getElementById("sampleConcResult");

    if (isNaN(C1Input) || isNaN(V1Input) || isNaN(V2Input)) {
        showCustomError("titrationErrorBox", "Please fill all titration data.");
        return;
    }

    // Convert concentration to M
    let C1 = C1Input;
    if (C1Unit === "mM") C1 = C1Input / 1000;

    // Convert volume to L
    let V1 = V1Input;
    let V2 = V2Input;
    if (V1Unit === "mL") V1 = V1Input / 1000;
    if (V2Unit === "mL") V2 = V2Input / 1000;

    if (V2 === 0) {
        showCustomError("titrationErrorBox", "Sample volume cannot be zero.");
        return;
    }

    // C1V1 = C2V2
    const C2 = (C1 * V1) / V2;
    titrationResult.concentration = C2;

    if (stepBox) {
        stepBox.innerHTML = `
        C₂ = (C₁ × V₁) / V₂
        <br><br>
        C₂ = (${C1.toFixed(4)} × ${V1.toFixed(4)}) / ${V2.toFixed(4)}
        <br><br>
        C₂ = ${C2.toFixed(4)} mol/L
        `;
    }

    if (result) result.innerHTML = C2.toFixed(4);
    if (resultBox) resultBox.style.display = "block";
}

// Add Dilution Step Dynamically
function addDilutionStep() {
    const container = document.getElementById("dilutionContainer");
    if (!container) return;
    
    const stepNumber = container.children.length + 1;
    const newStep = document.createElement("div");

    newStep.className = "dilution-step";
    newStep.style.cssText = `
        background:#f8f9fa;
        border-radius:16px;
        padding:15px;
        margin-top:15px;
    `;

    newStep.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <b style="font-size:13px;">Dilution Step ${stepNumber}</b>
        <button type="button" onclick="removeDilutionStep(this)" style="background:#fff; color:#fb6f92; border:2px solid #ffc2d1; border-radius:12px; padding:5px 12px; font-family:'Quicksand',sans-serif; font-weight:700; cursor:pointer;">✕</button>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
        <div class="input-group">
            <label>Transfer Volume</label>
            <div style="display:grid; grid-template-columns:1fr 70px; gap:10px;">
                <input type="number" class="dilutionInput" data-type="transferVolume" placeholder="Transfer Volume">
                <span style="padding:12px 0; text-align:center;">mL</span>
            </div>
        </div>    
        <div class="input-group">
            <label>Total Volume</label>
            <div style="display:grid; grid-template-columns:1fr 70px; gap:10px;">
                <input type="number" class="dilutionInput" data-type="finalVolume" placeholder="Volume">
                <span style="padding:12px 0; text-align:center;">mL</span>
            </div>
        </div>
    </div>
    `;
    container.appendChild(newStep);
}

function removeDilutionStep(button) {
    const step = button.closest(".dilution-step");
    if (step) {
        step.remove();
        updateDilutionStepNumber();
    }
}

function updateDilutionStepNumber() {
    const steps = document.querySelectorAll(".dilution-step");
    steps.forEach((step, index) => {
        const title = step.querySelector("b");
        if (title) {
            title.innerText = `Dilution Step ${index + 1}`;
        }
    });
}

// Calculate Final Analysis
function calculateAnalysis() {
    const resultBox = document.getElementById("analysisResultBox");
    const errorBox = document.getElementById("analysisErrorBox");

    if (resultBox) resultBox.style.display = "none";
    if (errorBox) errorBox.style.display = "none";

    if (titrationResult.concentration === 0) {
        showCustomError("analysisErrorBox", "Please calculate titration first.");
        return;
    }

    const analyteSelect = document.getElementById("analyteSelect");
    if (!analyteSelect || !analyteSelect.value) {
        showCustomError("analysisErrorBox", "Please select analyte.");
        return;
    }

    const sampleAmountEl = document.getElementById("sampleAmount");
    const sampleAmount = sampleAmountEl ? parseFloat(sampleAmountEl.value) : NaN;
    if (isNaN(sampleAmount) || sampleAmount <= 0) {
        showCustomError("analysisErrorBox", "Please enter a valid sample amount.");
        return;
    }

    const percentType = document.querySelector('input[name="percentType"]:checked');
    if (!percentType) {
        showCustomError("analysisErrorBox", "Please choose calculation type.");
        return;
    }

    const mwEl = document.getElementById("molecularWeight");
    const mw = mwEl ? parseFloat(mwEl.value) : NaN;
    if (isNaN(mw) || mw <= 0) {
        showCustomError("analysisErrorBox", "Invalid molecular weight.");
        return;
    }

    const dilutionSteps = getDilutionSteps();
    
    // คำนวณหา Dilution Factor ของกระบวนการทั้งหมด
    const dilutionFactor = calculateDilutionFactor(dilutionSteps);

    // ความเข้มข้นดั้งเดิมก่อนเจือจาง
    const originalConcentration = titrationResult.concentration * dilutionFactor;
    titrationResult.originalConcentration = originalConcentration;

    // คำนวณหาปริมาตรตั้งต้นของขวดแรก (ถ้าไม่มีขั้นตอนเจือจางที่สร้างเพิ่มขึ้นมา ให้ถือว่าใช้วิธีคำนวณฐาน 100mL หรืออิงปริมาตรตัวอย่าง)
    let originalVolume = 0.1; // ค่า Default 100 mL ในหน่วยลิตรป้องกันการค้างกรณีไม่มีขั้นตอนเจือจาง
    if (dilutionSteps.length > 0 && dilutionSteps[0].finalVolume > 0) {
        originalVolume = dilutionSteps[0].finalVolume / 1000;
    }

    // mol = M × V
    const analyteMoles = originalConcentration * originalVolume;
    titrationResult.moles = analyteMoles;

    // กรัม = mol × MW
    const analyteMass = analyteMoles * mw;

    // คำนวณร้อยละ (%)
    let composition = (analyteMass / sampleAmount) * 100;

    // นำไปแสดงผลลัพธ์บน UI
    const compositionResultEl = document.getElementById("compositionResult");
    const analyteAmountResultEl = document.getElementById("analyteAmountResult");

    if (compositionResultEl) compositionResultEl.innerHTML = composition.toFixed(2) + " %";
    if (analyteAmountResultEl) analyteAmountResultEl.innerHTML = analyteMass.toFixed(4) + " g";
    if (resultBox) resultBox.style.display = "block";
}

// ปรับปรุงการเก็บลำดับขั้นให้ปลอดภัย แม้ไม่มีกล่อง Step 1 ใน UI
function getDilutionSteps() {
    const steps = document.querySelectorAll(".dilution-step");
    let dilutionData = [];

    steps.forEach((step) => {
        const finalVolEl = step.querySelector('[data-type="finalVolume"]');
        const transferVolEl = step.querySelector('[data-type="transferVolume"]');

        const finalVolume = finalVolEl ? parseFloat(finalVolEl.value) : 0;
        const transferVolume = transferVolEl ? parseFloat(transferVolEl.value) : 0;

        dilutionData.push({
            transferVolume: isNaN(transferVolume) ? 0 : transferVolume,
            finalVolume: isNaN(finalVolume) ? 0 : finalVolume
        });
    });

    return dilutionData;
}

function calculateDilutionFactor(dilutionData) {
    let dilutionFactor = 1;
    // ปรับลูปให้เริ่มคูณ Factor ตั้งแต่เจอสเตปที่มีการถ่ายสาร (Transfer)
    for (let i = 0; i < dilutionData.length; i++) {
        const transfer = dilutionData[i].transferVolume;
        const finalVolume = dilutionData[i].finalVolume;

        if (transfer > 0 && finalVolume > 0) {
            dilutionFactor *= (finalVolume / transfer);
        }
    }
    return dilutionFactor;
}

function syncSampleAmount() {
    const sampleAmountEl = document.getElementById("sampleAmount");
    const step1AmountEl = document.getElementById("step1Amount");
    if (sampleAmountEl && step1AmountEl) {
        step1AmountEl.value = sampleAmountEl.value;
    }
}

function updateSampleInput() {
    const percentType = document.querySelector('input[name="percentType"]:checked');
    const sampleLabel = document.getElementById("sampleAmountLabel");
    const sampleInput = document.getElementById("sampleAmount");
    const sampleUnit = document.getElementById("sampleAmountUnit");
    const stepLabel = document.getElementById("step1Label");
    const stepInput = document.getElementById("step1Amount");
    const stepUnit = document.getElementById("step1Unit");

    if (!sampleInput) return;

    if (!percentType) {
        if (sampleLabel) sampleLabel.innerText = "Sample Weight";
        if (sampleUnit) sampleUnit.innerText = "";
        sampleInput.placeholder = "Select calculation type first";
        sampleInput.disabled = true;
        if (stepLabel) stepLabel.innerText = "Sample Weight";
        if (stepUnit) stepUnit.innerText = "";
        if (stepInput) stepInput.placeholder = "Auto";
        return;
    }

    sampleInput.disabled = false;

    if (percentType.value === "ww") {
        if (sampleLabel) sampleLabel.innerText = "Sample Weight";
        if (sampleUnit) sampleUnit.innerText = "g";
        sampleInput.placeholder = "Enter sample weight";
        if (stepLabel) stepLabel.innerText = "Sample Weight";
        if (stepUnit) stepUnit.innerText = "g";
    } else {
        if (sampleLabel) sampleLabel.innerText = "Sample Volume";
        if (sampleUnit) sampleUnit.innerText = "mL";
        sampleInput.placeholder = "Enter sample volume";
        if (stepLabel) stepLabel.innerText = "Sample Volume";
        if (stepUnit) stepUnit.innerText = "mL";
    }
    if (stepInput) stepInput.placeholder = "Auto";
}

window.addEventListener("DOMContentLoaded", () => {
    const sampleAmountEl = document.getElementById("sampleAmount");
    if (sampleAmountEl) {
        sampleAmountEl.addEventListener("input", syncSampleAmount);
    }
    
    // ผูก Event ให้กับวิทยุเปลี่ยนประเภท % เผื่อกดเปลี่ยนฟิลด์จะปรับตามอัตโนมัติ
    const percentRadioEls = document.querySelectorAll('input[name="percentType"]');
    percentRadioEls.forEach(radio => {
        radio.addEventListener("change", updateSampleInput);
    });

    updateSampleInput();
    syncSampleAmount();
});

// ฟังก์ชันแยกจัดการ Error Box แต่ละโซนไม่ให้โปรแกรมพัง
function showCustomError(boxId, message) {
    const errorBox = document.getElementById(boxId);
    if (errorBox) {
        errorBox.innerText = message;
        errorBox.style.display = "block";
    } else {
        console.error("Error display missing:", message);
    }
}