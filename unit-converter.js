// --- ชุดข้อมูลหน่วยวัดสำหรับหมวดหมู่ต่างๆ ---
const unitOptions = {
    concentration: [
        { value: "1", text: "Molar (M)" },
        { value: "0.001", text: "millimolar (mM)" },
        { value: "0.000001", text: "micromolar (µM)" }
    ],
    volume: [
        { value: "1", text: "Liter (L)" },
        { value: "0.001", text: "milliliter (mL)" },
        { value: "0.000001", text: "microliter (µL)" }
    ],
    mass: [
        { value: "1", text: "Gram (g)" },
        { value: "0.001", text: "milligram (mg)" },
        { value: "0.000001", text: "microgram (µg)" }
    ],
    temperature: [
        { value: "C", text: "Celsius (°C)" },
        { value: "K", text: "Kelvin (K)" }
    ]
};

// --- ฟังก์ชันอัปเดตตัวเลือกหน่วยใน Select Box เมื่อเปลี่ยนหมวดหมู่ ---
function updateConverterUnits() {
    const category = document.getElementById('convCategory').value;
    const fromSelect = document.getElementById('convFromUnit');
    const toSelect = document.getElementById('convToUnit');
    const options = unitOptions[category];
    
    // เคลียร์ค่าเก่า
    fromSelect.innerHTML = "";
    toSelect.innerHTML = "";
    
    // ใส่ตัวเลือกใหม่
    options.forEach((opt, index) => {
        const fOpt = new Option(opt.text, opt.value);
        const tOpt = new Option(opt.text, opt.value);
        fromSelect.add(fOpt);
        toSelect.add(tOpt);
    });
    
    // ตั้งค่าเริ่มต้นให้หน่วยปลายทางเลือกตัวถัดไปจะได้ไม่ซ้ำกัน
    if (options.length > 1) {
        toSelect.selectedIndex = 1;
    }
    
    // ล้างค่าผลลัพธ์เก่าและคำนวณใหม่
    document.getElementById('convInput').value = "";
    document.getElementById('convOutputDisplay').innerText = "0.00";
    document.getElementById('converterResultBox').style.display = 'none';
    document.getElementById('converterErrorBox').style.display = 'none';
}

// เรียกฟังก์ชันครั้งแรกเพื่อให้หน่วยโหลดเตรียมพร้อมไว้
setTimeout(updateConverterUnits, 200);

// --- ฟังก์ชันสลับหน่วยต้นทางและปลายทาง (Swap) ---
function swapConverterUnits() {
    const fromSelect = document.getElementById('convFromUnit');
    const toSelect = document.getElementById('convToUnit');
    
    const tempIndex = fromSelect.selectedIndex;
    fromSelect.selectedIndex = toSelect.selectedIndex;
    toSelect.selectedIndex = tempIndex;
    
    calculateConversion();
}

// --- ฟังก์ชันหลักในการคำนวณการแปลงหน่วย ---
function calculateConversion() {
    const category = document.getElementById('convCategory').value;
    const inputValRaw = document.getElementById('convInput').value;
    const fromSelect = document.getElementById('convFromUnit');
    const toSelect = document.getElementById('convToUnit');
    
    const outputDisplay = document.getElementById('convOutputDisplay');
    const resultBox = document.getElementById('converterResultBox');
    const errorBox = document.getElementById('converterErrorBox');
    const stepsDiv = document.getElementById('converterSteps');
    
    // ซ่อนกล่องข้อมูลไว้ก่อนถ้ายังไม่ได้พิมพ์ค่า
    resultBox.style.display = 'none';
    errorBox.style.display = 'none';
    
    if (inputValRaw === "") {
        outputDisplay.innerText = "0.00";
        return;
    }
    
    const value = parseFloat(inputValRaw);
    if (isNaN(value)) {
        outputDisplay.innerText = "Error";
        return;
    }

    const fromText = fromSelect.options[fromSelect.selectedIndex].text;
    const toText = toSelect.options[toSelect.selectedIndex].text;

    const fmt = (num) => {
        if (num === 0) return "0";
        if (Math.abs(num) < 0.00001 || Math.abs(num) > 999999) return num.toExponential(4);
        return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
    };

    let result;
    let stepsHTML = "";

    if (category === 'temperature') {
        // --- กรณีแปลงหน่วยอุณหภูมิ (คิดแบบบวกลบ) ---
        const fromUnit = fromSelect.value;
        const toUnit = toSelect.value;
        
        if (fromUnit === toUnit) {
            result = value;
            stepsHTML = `Same unit selected: <strong>${fmt(result)} ${fromUnit === 'C' ? '°C' : 'K'}</strong>`;
        } else if (fromUnit === 'C' && toUnit === 'K') {
            result = value + 271.15; // อิงตามหลักวิชาการทั่วไป 273.15
            // เพื่อป้องกันเลขบั๊ก แก้เป็น 273.15 ตามมาตรฐานสากล
            result = value + 273.15;
            stepsHTML = `Formula: K = °C + 273.15<br>&bull; ${value} °C + 273.15 = <strong>${fmt(result)} K</strong>`;
        } else if (fromUnit === 'K' && toUnit === 'C') {
            if (value < 0) {
                errorBox.innerText = "Temperature in Kelvin cannot be below Absolute Zero (0 K).";
                errorBox.style.display = 'block';
                outputDisplay.innerText = "Invalid";
                return;
            }
            result = value - 273.15;
            stepsHTML = `Formula: °C = K - 273.15<br>&bull; ${value} K - 273.15 = <strong>${fmt(result)} °C</strong>`;
        }
    } else {
        // --- กรณีแปลงหน่วยความเข้มข้น, มวล, ปริมาตร (คิดแบบคูณ/หารด้วย Factor) ---
        const fromFactor = parseFloat(fromSelect.value);
        const toFactor = parseFloat(toSelect.value);
        
        // แปลงไปเป็นหน่วยฐาน (Base unit เช่น M, L, g) ก่อน จากนั้นแปลงไปเป็นหน่วยปลายทาง
        const baseValue = value * fromFactor;
        result = baseValue / toFactor;
        
        stepsHTML = `<strong>Conversion Steps:</strong><br>`;
        stepsHTML += `&nbsp;&nbsp;&bull; Convert to base unit: ${fmt(value)} &times; ${fromFactor} = ${fmt(baseValue)}<br>`;
        stepsHTML += `&nbsp;&nbsp;&bull; Convert to target unit: ${fmt(baseValue)} / ${toFactor} = <strong>${fmt(result)}</strong><br><br>`;
        stepsHTML += `Result: <strong>${fmt(value)}</strong> ${fromText.split(' ')[1] || fromText} = <strong>${fmt(result)}</strong> ${toText.split(' ')[1] || toText}`;
    }

    outputDisplay.innerText = fmt(result);
    stepsDiv.innerHTML = stepsHTML;
    resultBox.style.display = 'block';
}