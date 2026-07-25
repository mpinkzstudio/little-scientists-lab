// --- ฟังก์ชันคำนวณ Molecular Weight ---
const atomicMasses = {
    'H': 1.008, 'He': 4.0026, 'Li': 6.94, 'Be': 9.0122, 'B': 10.81,
    'C': 12.0107, 'N': 14.0067, 'O': 15.999, 'F': 18.998, 'Ne': 20.180,
    'Na': 22.990, 'Mg': 24.305, 'Al': 26.9815, 'Si': 28.0855, 'P': 30.974,
    'S': 32.065, 'Cl': 35.45, 'Ar': 39.948, 'K': 39.098, 'Ca': 40.078,
    'Cr': 51.996, 'Mn': 54.938, 'Fe': 55.845, 'Co': 58.933, 'Ni': 58.693,
    'Cu': 63.546, 'Zn': 65.38, 'Ag': 107.87, 'I': 126.90, 'Ba': 137.33,
    'Pt': 195.08, 'Au': 196.96657, 'Hg': 200.59, 'Pb': 207.2, 'Br': 79.904
};

// --- เลขออกซิเดชัน (oxidation state) ที่พบได้ทั่วไปของแต่ละธาตุ ---
// ใช้สำหรับตรวจสอบคร่าวๆ ว่าสูตรที่ผู้ใช้กรอกมีความเป็นไปได้ทางเคมีหรือไม่
// (เป็นการตรวจแบบ heuristic ไม่ใช่การเทียบฐานข้อมูลสารประกอบจริง)
const oxidationStates = {
    'H': [1, -1], 'He': [0], 'Li': [1], 'Be': [2], 'B': [3, -3],
    'C': [-4, -3, -2, -1, 0, 1, 2, 3, 4],
    'N': [-3, -2, -1, 0, 1, 2, 3, 4, 5],
    'O': [-2, -1], 'F': [-1], 'Ne': [0],
    'Na': [1], 'Mg': [2], 'Al': [3], 'Si': [-4, 4], 'P': [-3, 3, 5],
    'S': [-2, 2, 4, 6], 'Cl': [-1, 1, 3, 5, 7], 'Ar': [0],
    'K': [1], 'Ca': [2],
    'Cr': [2, 3, 6], 'Mn': [2, 3, 4, 6, 7], 'Fe': [2, 3], 'Co': [2, 3], 'Ni': [2, 3],
    'Cu': [1, 2], 'Zn': [2], 'Ag': [1], 'I': [-1, 1, 3, 5, 7], 'Ba': [2],
    'Pt': [2, 4], 'Au': [1, 3], 'Hg': [1, 2], 'Pb': [2, 4], 'Br': [-1, 1, 3, 5, 7]
};

// ธาตุกลุ่มนี้เป็นโลหะที่พบสารประกอบ mixed-valence จริงในธรรมชาติ (เช่น Fe3O4 มี Fe2+ ปน Fe3+)
// จึงอนุญาตให้อะตอมของธาตุเดียวกันในสูตรเดียวกันมีเลขออกซิเดชันต่างกันได้
// ส่วนธาตุอื่นๆ (โดยเฉพาะอโลหะทั่วไป) จะบังคับให้ทุกอะตอมของธาตุนั้นใช้เลขออกซิเดชันเดียวกัน
// เพราะสารประกอบที่มีธาตุ (โดยเฉพาะอโลหะ) ปนกันหลายเลขออกซิเดชันในสูตรง่ายๆ แบบนี้แทบไม่พบในความเป็นจริง
const mixedValenceAllowed = new Set(['Fe', 'Mn', 'Cu', 'Co', 'Ni', 'Pt', 'Au', 'Hg', 'Pb', 'Cr']);

// หาผลรวมที่เป็นไปได้ทั้งหมด เมื่อเลือกเลขออกซิเดชัน (จาก states) ให้กับอะตอมจำนวน count ตัว
// (แต่ละอะตอมของธาตุเดียวกันเลือกค่าต่างกันได้ เช่น Fe3O4 มีทั้ง Fe2+ และ Fe3+ ปนกัน)
function getReachableSums(states, count, allowMixed) {
    if (!allowMixed) {
        // บังคับให้ทุกอะตอมของธาตุนี้ใช้เลขออกซิเดชันเดียวกัน: ผลรวมที่เป็นไปได้ = state * count
        return new Set(states.map(s => s * count));
    }

    let reachable = new Set([0]);
    for (let i = 0; i < count; i++) {
        const next = new Set();
        for (const r of reachable) {
            for (const s of states) {
                next.add(r + s);
            }
        }
        reachable = next;
    }
    return reachable;
}

// ตรวจสอบว่าสูตรเคมี (finalCounts) มีความเป็นไปได้ทางเคมีหรือไม่
// โดยเช็คว่ามีการจัดเลขออกซิเดชันชุดใดชุดหนึ่งที่รวมกันได้ = 0 (สภาพเป็นกลางทางประจุ) หรือไม่
// คืนค่า true = พอจะเป็นไปได้ / false = ไม่น่าจะมีอยู่จริงตามหลักเลขออกซิเดชันทั่วไป / null = ไม่สามารถประเมินได้ (ข้ามการเตือน)
function checkChemicalPlausibility(finalCounts) {
    const elements = Object.keys(finalCounts);

    // สารเดี่ยว (ธาตุบริสุทธิ์ เช่น O2, Fe, S8) ถือว่ามีอยู่จริงเสมอ ไม่ต้องตรวจสอบ
    if (elements.length <= 1) return true;

    let totalReachable = new Set([0]);

    for (const elem of elements) {
        const count = finalCounts[elem];
        const states = oxidationStates[elem];

        // ถ้าไม่มีข้อมูลเลขออกซิเดชันของธาตุนี้ หรือจำนวนอะตอมมากเกินไป (กันปัญหาประสิทธิภาพ) ให้ข้ามการเตือนไปเลย
        if (!states || count > 500) return null;

        const allowMixed = mixedValenceAllowed.has(elem);
        const elemReachable = getReachableSums(states, count, allowMixed);

        const nextTotal = new Set();
        for (const t of totalReachable) {
            for (const e of elemReachable) {
                nextTotal.add(t + e);
            }
        }
        totalReachable = nextTotal;
    }

    return totalReachable.has(0);
}


// เช่น "MgSO4" -> { Mg: 1, S: 1, O: 4 }
function parseFormulaSegment(formula) {
    let stack = [{}];
    let i = 0;

    while (i < formula.length) {
        let ch = formula[i];

        if (ch === '(' || ch === '[' || ch === '{') {
            stack.push({});
            i++;
        }
        else if (ch === ')' || ch === ']' || ch === '}') {
            i++;
            let start = i;
            while (i < formula.length && /\d/.test(formula[i])) {
                i++;
            }
            let count = start < i ? parseInt(formula.substring(start, i)) : 1;

            let popped = stack.pop();
            if (!popped || stack.length === 0) {
                throw new Error("Mismatched parentheses 🥺");
            }

            let currentLayer = stack[stack.length - 1];
            for (let elem in popped) {
                currentLayer[elem] = (currentLayer[elem] || 0) + popped[elem] * count;
            }
        }
        else if (/[A-Z]/.test(ch)) {
            let start = i;
            i++;
            while (i < formula.length && /[a-z]/.test(formula[i])) {
                i++;
            }
            let element = formula.substring(start, i);

            if (!atomicMasses[element]) {
                throw new Error(`Element "${element}" is not supported yet 🥺`);
            }

            let numStart = i;
            while (i < formula.length && /\d/.test(formula[i])) {
                i++;
            }
            let count = numStart < i ? parseInt(formula.substring(numStart, i)) : 1;

            let currentLayer = stack[stack.length - 1];
            currentLayer[element] = (currentLayer[element] || 0) + count;
        }
        else {
            throw new Error("Invalid character in formula 💡");
        }
    }

    if (stack.length !== 1) {
        throw new Error("Mismatched parentheses 🥺");
    }

    return stack[0];
}

function calculateWeight() {
    const formula = document.getElementById('formulaInput').value.trim();
    const resultBox = document.getElementById('resultBox');
    const errorBox = document.getElementById('errorBox');
    const warningBox = document.getElementById('mwWarningBox');
    const resultValue = document.getElementById('resultValue');
    
    resultBox.style.display = 'none';
    errorBox.style.display = 'none';
    if (warningBox) warningBox.style.display = 'none';
    
    if (!formula) {
        showError('Phew! Please enter a formula first ✨');
        return;
    }

    try {
        // รองรับ hydrate notation เช่น "CuSO4.5H2O" โดยแยกส่วนด้วย '.'
        // ส่วนแรกไม่มีตัวคูณ ส่วนถัดไปอาจมีเลขนำหน้าเป็นตัวคูณ (เช่น "5H2O" -> คูณ 5)
        const segments = formula.split('.');
        if (segments.some(seg => seg.trim() === '')) {
            throw new Error("Invalid formula format around '.' 💡");
        }

        let finalCounts = {};

        segments.forEach((segment, index) => {
            let multiplier = 1;
            let formulaPart = segment;

            if (index > 0) {
                // ดึงเลขนำหน้า (ตัวคูณ) ของส่วน hydrate เช่น "5H2O" -> multiplier=5, formulaPart="H2O"
                const match = segment.match(/^(\d+)([A-Z].*)$/);
                if (match) {
                    multiplier = parseInt(match[1]);
                    formulaPart = match[2];
                } else {
                    multiplier = 1;
                    formulaPart = segment;
                }
            }

            const segmentCounts = parseFormulaSegment(formulaPart);
            for (let elem in segmentCounts) {
                finalCounts[elem] = (finalCounts[elem] || 0) + segmentCounts[elem] * multiplier;
            }
        });

        let totalWeight = 0;
        let hasElements = false;

        for (let elem in finalCounts) {
            hasElements = true;
            totalWeight += atomicMasses[elem] * finalCounts[elem];
        }

        if (!hasElements) {
            throw new Error("Check your casing! (e.g., H2O works, h2o does not) 💡");
        }

        resultValue.innerText = totalWeight.toFixed(3);
        resultBox.style.display = 'block';

        // ตรวจสอบความเป็นไปได้ทางเคมีของสูตร (ยังคำนวณ MW ให้ตามปกติเสมอ ไม่ว่าผลตรวจจะเป็นอย่างไร)
        const plausible = checkChemicalPlausibility(finalCounts);
        if (plausible === false) {
            showMwWarning("⚠️ This formula may be incorrect. The molecular weight is calculated, but please verify the compound.");
        }

    } catch (error) {
        showError(error.message);
    }

}

function showMwWarning(message) {
    const warningBox = document.getElementById('mwWarningBox');
    if (!warningBox) return;
    warningBox.innerText = message;
    warningBox.style.display = 'block';
}

function showError(message) {
    const errorBox = document.getElementById('errorBox');
    errorBox.innerText = message;
    errorBox.style.display = 'block';
}