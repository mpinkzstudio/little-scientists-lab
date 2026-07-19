// --- ฟังก์ชันเปิด/ปิดฟิลด์กรอกข้อมูลตามตัวแปรที่ต้องการหาค่า ---
function toggleDilutionInputs() {
    const target = document.getElementById('dilutionTarget').value;
    const inputs = ['C1', 'V1', 'C2', 'V2'];
    
    inputs.forEach(id => {
        const inputEl = document.getElementById(`input-${id}`);
        const groupEl = document.getElementById(`group-${id}`);
        const labelEl = groupEl.querySelector('label');
        
        if (id === target) {
            // ฟิลด์ที่เป็นเป้าหมาย: ปิดการกรอกเงิน และไฮไลต์ว่าเป็นค่าที่จะค้นหา
            inputEl.disabled = true;
            inputEl.value = '';
            inputEl.placeholder = "🔍 Calculating...";
            inputEl.style.backgroundColor = '#fff0f3'; // สีพื้นหลังโทนชมพูหวานๆ ให้รู้ว่าตรงนี้คือผลลัพธ์
            labelEl.innerHTML = `<strong>${labelEl.innerText.replace('✨ (Target)', '')} ✨ (Target)</strong>`;
        } else {
            // ฟิลด์อื่นๆ: เปิดให้กรอกปกติ
            inputEl.disabled = false;
            inputEl.placeholder = "e.g., " + (id.startsWith('M') ? "1.0" : "50");
            inputEl.style.backgroundColor = '';
            labelEl.innerHTML = labelEl.innerText.replace('✨ (Target)', '');
        }
    });
}

// เรียกทำงานหนึ่งครั้งเพื่อให้ฟิลด์ V1 ถูกปิดเป็นค่าเริ่มต้นตอนโหลดหน้าเว็บ
document.addEventListener("DOMContentLoaded", () => {
    // ผูกระบบนี้ไว้เผื่อต้องการสลับหน้า
    setTimeout(toggleDilutionInputs, 100);
});

// --- ฟังก์ชันคำนวณ Dilution C1V1 = C2V2 (เวอร์ชันปรับปรุงการแสดงผลวิธีคิด) ---
function calculateDilution() {
    const target = document.getElementById('dilutionTarget').value;
    const resultBox = document.getElementById('dilutionResultBox');
    const errorBox = document.getElementById('dilutionErrorBox');
    const stepsDiv = document.getElementById('dilutionSteps');
    const resultValueSpan = document.getElementById('dilutionResultValue');
    
    resultBox.style.display = 'none';
    errorBox.style.display = 'none';

    // ดึงค่าและหน่วยแปลงเข้าสู่หน่วยฐาน (M และ L)
    const C1_raw = parseFloat(document.getElementById('input-C1').value);
    const unitC1 = parseFloat(document.getElementById('unit-C1').value);
    const V1_raw = parseFloat(document.getElementById('input-V1').value);
    const unitV1 = parseFloat(document.getElementById('unit-V1').value);
    const C2_raw = parseFloat(document.getElementById('input-C2').value);
    const unitC2 = parseFloat(document.getElementById('unit-C2').value);
    const V2_raw = parseFloat(document.getElementById('input-V2').value);
    const unitV2 = parseFloat(document.getElementById('unit-V2').value);

    // ตรวจสอบค่าว่าง (ยกเว้นตัวแปรที่เป็น Target)
    if (target !== 'C1' && isNaN(C1_raw)) return showDilutionError("Please enter Initial Concentration (C1) 💕");
    if (target !== 'V1' && isNaN(V1_raw)) return showDilutionError("Please enter Initial Volume (V1) 💕");
    if (target !== 'C2' && isNaN(C2_raw)) return showDilutionError("Please enter Final Concentration (C2) 💕");
    if (target !== 'V2' && isNaN(V2_raw)) return showDilutionError("Please enter Final Volume (V2) 💕");

    // แปลงค่าที่กรอกให้เป็นค่าในหน่วยมาตรฐานสากล (M และ L) เพื่อคำนวณความถูกต้อง
    let C1 = C1_raw * unitC1;
    let V1 = V1_raw * unitV1;
    let C2 = C2_raw * unitC2;
    let V2 = V2_raw * unitV2;

    let finalResult = 0;
    let stepsHtml = "";
    
    // ดึงข้อความชื่อหน่วยที่ผู้ใช้เลือกผลลัพธ์ปลายทางไว้
    const selectUnitC1 = document.getElementById('unit-C1').options[document.getElementById('unit-C1').selectedIndex].text;
    const selectUnitV1 = document.getElementById('unit-V1').options[document.getElementById('unit-V1').selectedIndex].text;
    const selectUnitC2 = document.getElementById('unit-C2').options[document.getElementById('unit-C2').selectedIndex].text;
    const selectUnitV2 = document.getElementById('unit-V2').options[document.getElementById('unit-V2').selectedIndex].text;

    // ฟังก์ชันช่วยจัดรูปแบบตัวเลขให้อ่านง่าย ไม่ติด e-1 ถ้าเป็นทศนิยมปกติ
    const formatStepNum = (num) => {
        if (num >= 0.0001 && num <= 10000) {
            return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
        }
        return num.toExponential(3);
    };

    if (target === 'V1') {
        V1 = (C2 * V2) / C1;
        finalResult = V1 / unitV1;
        stepsHtml = `
            <strong>Step 1:</strong> Rearrange formula<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&bull; V1 = (C2 &times; V2) / C1<br><br>
            <strong>Step 2:</strong> Substitute values (in base units)<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&bull; V1 = (${formatStepNum(C2)} M &times; ${formatStepNum(V2)} L) / ${formatStepNum(C1)} M<br><br>
            <strong>Step 3:</strong> Convert answer back to ${selectUnitV1}
        `;
        resultValueSpan.innerHTML = `${finalResult.toFixed(4)} <span class="unit">${selectUnitV1}</span>`;
    } 
    else if (target === 'C1') {
        C1 = (C2 * V2) / V1;
        finalResult = C1 / unitC1;
        stepsHtml = `
            <strong>Step 1:</strong> Rearrange formula<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&bull; C1 = (C2 &times; V2) / V1<br><br>
            <strong>Step 2:</strong> Substitute values (in base units)<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&bull; C1 = (${formatStepNum(C2)} M &times; ${formatStepNum(V2)} L) / ${formatStepNum(V1)} L<br><br>
            <strong>Step 3:</strong> Convert answer back to ${selectUnitC1}
        `;
        resultValueSpan.innerHTML = `${finalResult.toFixed(4)} <span class="unit">${selectUnitC1}</span>`;
    } 
    else if (target === 'V2') {
        V2 = (C1 * V1) / C2;
        finalResult = V2 / unitV2;
        stepsHtml = `
            <strong>Step 1:</strong> Rearrange formula<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&bull; V2 = (C1 &times; V1) / C2<br><br>
            <strong>Step 2:</strong> Substitute values (in base units)<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&bull; V2 = (${formatStepNum(C1)} M &times; ${formatStepNum(V1)} L) / ${formatStepNum(C2)} M<br><br>
            <strong>Step 3:</strong> Convert answer back to ${selectUnitV2}
        `;
        resultValueSpan.innerHTML = `${finalResult.toFixed(4)} <span class="unit">${selectUnitV2}</span>`;
    } 
    else if (target === 'C2') {
        C2 = (C1 * V1) / V2;
        finalResult = C2 / unitC2;
        stepsHtml = `
            <strong>Step 1:</strong> Rearrange formula<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&bull; C2 = (C1 &times; V1) / V2<br><br>
            <strong>Step 2:</strong> Substitute values (in base units)<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&bull; C2 = (${formatStepNum(C1)} M &times; ${formatStepNum(V1)} L) / ${formatStepNum(V2)} L<br><br>
            <strong>Step 3:</strong> Convert answer back to ${selectUnitC2}
        `;
        resultValueSpan.innerHTML = `${finalResult.toFixed(4)} <span class="unit">${selectUnitC2}</span>`;
    }

    if (!isFinite(finalResult) || isNaN(finalResult) || finalResult < 0) {
        return showDilutionError("Calculated value is invalid. Please check your inputs! 🥺");
    }

    stepsDiv.innerHTML = stepsHtml;
    resultBox.style.display = 'block';
}

function showDilutionError(message) {
    const errorBox = document.getElementById('dilutionErrorBox');
    errorBox.innerText = message;
    errorBox.style.display = 'block';
}