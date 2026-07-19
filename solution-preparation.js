// --- ฟังก์ชันควบคุมหน้าต่างป้อนข้อมูลแท็บ Solution Prep ---
function toggleSolPrepInputs() {
    const mode = document.getElementById('solPrepMode').value;
    const unitLabel = document.getElementById('unit-sol-conc');
    const stockGroup = document.getElementById('group-sol-stock');
    
    // รีเซ็ตการซ่อนกล่องผลลัพธ์เก่าก่อน
    document.getElementById('solPrepResultBox').style.display = 'none';
    document.getElementById('solPrepErrorBox').style.display = 'none';
    
    // ซ่อน/แสดงกลุ่มความเข้มข้นของ Stock
    if (mode === 'ppmStock') {
        stockGroup.style.display = 'grid';
    } else {
        stockGroup.style.display = 'none';
    }

    // ปรับหน่วยตามโหมดที่เลือก
    if (mode === 'wv') unitLabel.innerText = '% w/v';
    else if (mode === 'vv') unitLabel.innerText = '% v/v';
    else if (mode === 'ppmSolid' || mode === 'ppmStock') unitLabel.innerText = 'ppm';
}

// เรียกดีฟอลต์ให้สลับช่องถูกเมื่อรีโหลด
setTimeout(toggleSolPrepInputs, 150);

// --- ฟังก์ชันหลักในการคำนวณการเตรียมสารละลาย ---
function calculateSolutionPrep() {
    const mode = document.getElementById('solPrepMode').value;
    const concInput = document.getElementById('sol-conc');
    const volInput = document.getElementById('sol-vol');
    const volUnitFactor = parseFloat(document.getElementById('sol-vol-unit').value); // mL = 0.001, L = 1
    
    const resultBox = document.getElementById('solPrepResultBox');
    const errorBox = document.getElementById('solPrepErrorBox');
    const stepsDiv = document.getElementById('solPrepSteps');
    const resultValue = document.getElementById('solPrepResultValue');

    resultBox.style.display = 'none';
    errorBox.style.display = 'none';

    const conc = parseFloat(concInput.value);
    const volRaw = parseFloat(volInput.value);

    // ตรวจสอบข้อมูลนำเข้าเบื้องต้น
    if (isNaN(conc) || conc <= 0) return showSolPrepError("Please enter a valid Target Concentration.");
    if (isNaN(volRaw) || volRaw <= 0) return showSolPrepError("Please enter a valid Solution Volume.");

    // แปลงปริมาตรรวมให้อยู่ในรูปหน่วย mL และ L เพื่อใช้ในสูตร
    const volInMl = volUnitFactor === 1 ? volRaw * 1000 : volRaw;
    const volInLiters = volUnitFactor === 1 ? volRaw : volRaw * 0.001;

    const fmt = (num) => {
        if (num === 0) return "0";
        if (Math.abs(num) < 0.0001) return num.toExponential(4);
        return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
    };

    if (mode === 'wv') {
        // --- CASE 1: % w/v (Weight in grams per 100 mL of solution) ---
        // สูตร: g = (% w/v * mL) / 100
        const massGrams = (conc * volInMl) / 100;
        
        stepsDiv.innerHTML = `
            <strong>Formula: Mass (g) = (% w/v &times; Volume in mL) / 100</strong><br>
            &bull; Mass = (${fmt(conc)} &times; ${fmt(volInMl)} mL) / 100<br>
            &bull; Mass = <strong>${fmt(massGrams)} g</strong><br><br>
            <strong>🧪 Lab Protocol:</strong><br>
            1. Weigh out exactly <strong>${fmt(massGrams)} g</strong> of the solid solute.<br>
            2. Dissolve the solute in a beaker with a portion of distilled water.<br>
            3. Transfer to a volumetric flask and add solvent up to the final <strong>${fmt(volInMl)} mL</strong> mark.
        `;
        resultValue.innerText = `${fmt(massGrams)} g`;

    } else if (mode === 'vv') {
        // --- CASE 2: % v/v (Volume in mL per 100 mL of solution) ---
        // สูตร: mL of solute = (% v/v * mL total) / 100
        const volSoluteMl = (conc * volInMl) / 100;
        
        stepsDiv.innerHTML = `
            <strong>Formula: Solute Vol (mL) = (% v/v &times; Total Volume in mL) / 100</strong><br>
            &bull; Solute Volume = (${fmt(conc)} &times; ${fmt(volInMl)} mL) / 100<br>
            &bull; Solute Volume = <strong>${fmt(volSoluteMl)} mL</strong><br><br>
            <strong>🧪 Lab Protocol:</strong><br>
            1. Measure exactly <strong>${fmt(volSoluteMl)} mL</strong> of the liquid solute using a pipette.<br>
            2. Add into a volumetric flask filled with partial solvent.<br>
            3. Dilute with solvent until the total volume reaches the <strong>${fmt(volInMl)} mL</strong> mark.
        `;
        resultValue.innerText = `${fmt(volSoluteMl)} mL`;

    } else if (mode === 'ppmSolid') {
        // --- CASE 3: ppm จากสารบริสุทธิ์แบบแข็ง (1 ppm = 1 mg / 1 L) ---
        // สูตร: mg = ppm * L
        const massMg = conc * volInLiters;
        const massG = massMg / 1000;
        
        stepsDiv.innerHTML = `
            <strong>Formula: Mass (mg) = ppm &times; Volume (L)</strong><br>
            &bull; Mass = ${fmt(conc)} ppm &times; ${fmt(volInLiters)} L<br>
            &bull; Mass = <strong>${fmt(massMg)} mg</strong> (${fmt(massG)} g)<br><br>
            <strong>🧪 Lab Protocol:</strong><br>
            1. Weigh out <strong>${fmt(massMg)} mg</strong> (or ${fmt(massG)} g) of solid solute.<br>
            2. Completely dissolve it in a minor volume of solvent.<br>
            3. Fill to volume up to the <strong>${fmt(volInMl)} mL</strong> line.
        `;
        resultValue.innerText = massMg >= 1 ? `${fmt(massMg)} mg` : `${fmt(massG)} g`;

    } else if (mode === 'ppmStock') {
        // --- CASE 4: ppm จากการเจือจาง Stock Solution (C1V1 = C2V2) ---
        const stockConc = parseFloat(document.getElementById('sol-stock-conc').value);
        if (isNaN(stockConc) || stockConc <= 0) return showSolPrepError("Please enter a valid Stock Concentration.");
        if (stockConc <= conc) return showSolPrepError("Stock concentration must be higher than target concentration.");

        // สูตร: V1 = (C2 * V2) / C1
        const pipetteVolMl = (conc * volInMl) / stockConc;
        
        stepsDiv.innerHTML = `
            <strong>Formula: V_stock = (C_target &times; V_target) / C_stock</strong><br>
            &bull; V_stock = (${fmt(conc)} ppm &times; ${fmt(volInMl)} mL) / ${fmt(stockConc)} ppm<br>
            &bull; V_stock = <strong>${fmt(pipetteVolMl)} mL</strong><br><br>
            <strong>🧪 Lab Protocol:</strong><br>
            1. Pipette exactly <strong>${fmt(pipetteVolMl)} mL</strong> from your ${fmt(stockConc)} ppm stock solution.<br>
            2. Transfer it cleanly into a fresh volumetric flask.<br>
            3. Fill up to the <strong>${fmt(volInMl)} mL</strong> line with distilled water and mix well.
        `;
        resultValue.innerText = `${fmt(pipetteVolMl)} mL`;
    }

    resultBox.style.display = 'block';
}

function showSolPrepError(message) {
    const errorBox = document.getElementById('solPrepErrorBox');
    errorBox.innerText = message;
    errorBox.style.display = 'block';
}