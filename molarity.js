// --- ฟังก์ชันควบคุมการซ่อน/แสดงช่องตามเป้าหมายคำนวณ (เรียกตอนโหลดหน้าเว็บด้วยได้ถ้าต้องการ) ---
function toggleMolarityInputs() {
    const target = document.getElementById('molarityTarget').value;
    
    // รีเซ็ตการแสดงผลทุกกลุ่มก่อน
    document.getElementById('group-mol-conc').style.display = 'grid';
    document.getElementById('group-mol-mass').style.display = 'grid';
    document.getElementById('group-mol-vol').style.display = 'grid';
    
    // ซ่อนฟิลด์ที่เป็นตัวแปรเป้าหมายที่เราอยากหา
    if (target === 'M') {
        document.getElementById('group-mol-conc').style.display = 'none';
    } else if (target === 'mass') {
        document.getElementById('group-mol-mass').style.display = 'none';
    } else if (target === 'vol') {
        document.getElementById('group-mol-vol').style.display = 'none';
    }
    
    // เคลียร์กล่องคำตอบเก่า
    document.getElementById('molarityResultBox').style.display = 'none';
    document.getElementById('molarityErrorBox').style.display = 'none';
}

// เรียกให้เปิดฟังก์ชันสลับช่องครั้งแรกเพื่อให้ซ่อนช่องหา M ไว้ตามดีฟอลต์
setTimeout(toggleMolarityInputs, 100);

// --- ฟังก์ชันสำหรับการคำนวณ Molarity แบบครอบคลุมย้อนกลับทุกมิติ ---
function calculateMolarity() {
    const target = document.getElementById('molarityTarget').value;
    const mwInput = document.getElementById('mol-mw');
    const concInput = document.getElementById('input-mol-conc');
    const massInput = document.getElementById('mol-mass');
    const massUnit = parseFloat(document.getElementById('mol-mass-unit').value);
    const volInput = document.getElementById('mol-vol');
    const volUnit = parseFloat(document.getElementById('mol-vol-unit').value);
    
    const resultBox = document.getElementById('molarityResultBox');
    const errorBox = document.getElementById('molarityErrorBox');
    const formulaTitle = document.getElementById('molarityFormulaTitle');
    const stepsDiv = document.getElementById('molaritySteps');
    const resultValue = document.getElementById('molarityResultValue');

    resultBox.style.display = 'none';
    errorBox.style.display = 'none';

    const mw = parseFloat(mwInput.value);
    if (isNaN(mw) || mw <= 0) return showMolarityError("Please enter a valid Molecular Weight.");

    // ฟังก์ชันจัดฟอร์แมตตัวเลขวิทยาศาสตร์ให้อ่านง่าย
    const fmt = (num) => {
        if (num === 0) return "0";
        if (Math.abs(num) < 0.0001 || Math.abs(num) > 99999) return num.toExponential(4);
        return num.toLocaleString(undefined, { maximumFractionDigits: 5 });
    };

    // แยก Case คำนวณตามตัวแปรที่เลือก
    if (target === 'M') {
        // --- CASE 1: หาความเข้มข้น Molarity (M) ---
        const massRaw = parseFloat(massInput.value);
        const volRaw = parseFloat(volInput.value);
        
        if (isNaN(massRaw) || massRaw <= 0) return showMolarityError("Please enter a valid Mass of Solute.");
        if (isNaN(volRaw) || volRaw <= 0) return showMolarityError("Please enter a valid Solution Volume.");
        
        const massGrams = massRaw * massUnit;
        const volLiters = volRaw * volUnit;
        const moles = massGrams / mw;
        const molarity = moles / volLiters;
        
        formulaTitle.innerText = "📝 Formula: Molarity = Moles / Volume (L)";
        stepsDiv.innerHTML = `
            <strong>Step 1: Calculate Moles of Solute</strong><br>
            &bull; Moles = Mass (${fmt(massGrams)} g) / MW (${fmt(mw)} g/mol) = <strong>${moles.toFixed(4)} mol</strong><br><br>
            <strong>Step 2: Calculate Molarity</strong><br>
            &bull; Molarity = Moles / Volume = ${fmt(moles)} mol / ${fmt(volLiters)} L = <strong>${molarity.toFixed(4)} M</strong>
        `;
        resultValue.innerText = `${molarity.toFixed(4)} M`;
        
    } else if (target === 'mass') {
        // --- CASE 2: หามวลสารที่ต้องชั่ง (Mass, g) ---
        const conc = parseFloat(concInput.value);
        const volRaw = parseFloat(volInput.value);
        
        if (isNaN(conc) || conc <= 0) return showMolarityError("Please enter a valid Concentration (Molarity).");
        if (isNaN(volRaw) || volRaw <= 0) return showMolarityError("Please enter a valid Solution Volume.");
        
        const volLiters = volRaw * volUnit;
        // สูตร: Mass (g) = M * V(L) * MW
        const massGrams = conc * volLiters * mw;
        
        formulaTitle.innerText = "📝 Formula: Mass (g) = Molarity &times; Volume (L) &times; MW";
        stepsDiv.innerHTML = `
            <strong>Step 1: Calculate Mass in Grams</strong><br>
            &bull; Mass = ${fmt(conc)} M &times; ${fmt(volLiters)} L &times; ${fmt(mw)} g/mol<br>
            &bull; Mass = <strong>${massGrams.toFixed(4)} g</strong>
        `;
        resultValue.innerText = `${massGrams.toFixed(4)} g`;
        
    } else if (target === 'vol') {
        // --- CASE 3: หาปริมาตรสารละลายที่ต้องใช้ (Volume) ---
        const conc = parseFloat(concInput.value);
        const massRaw = parseFloat(massInput.value);
        
        if (isNaN(conc) || conc <= 0) return showMolarityError("Please enter a valid Concentration (Molarity).");
        if (isNaN(massRaw) || massRaw <= 0) return showMolarityError("Please enter a valid Mass of Solute.");
        
        const massGrams = massRaw * massUnit;
        // สูตร: V(L) = Mass(g) / (M * MW)
        const volLiters = massGrams / (conc * mw);
        const volMl = volLiters / 0.001; // แปลงกลับเป็น mL เพื่อให้อ่านง่าย
        
        formulaTitle.innerText = "📝 Formula: Volume (L) = Mass (g) / (Molarity &times; MW)";
        stepsDiv.innerHTML = `
            <strong>Step 1: Calculate Volume in Liters</strong><br>
            &bull; Volume (L) = ${fmt(massGrams)} g / (${fmt(conc)} M &times; ${fmt(mw)} g/mol)<br>
            &bull; Volume = <strong>${volLiters.toFixed(5)} L</strong><br><br>
            <strong>Step 2: Convert to Milliliters (mL)</strong><br>
            &bull; Volume = ${volLiters.toFixed(5)} L &times; 1000 = <strong>${volMl.toFixed(2)} mL</strong>
        `;
        resultValue.innerText = `${volMl.toFixed(2)} mL`;
    }

    resultBox.style.display = 'block';
}

function showMolarityError(message) {
    const errorBox = document.getElementById('molarityErrorBox');
    errorBox.innerText = message;
    errorBox.style.display = 'block';
}