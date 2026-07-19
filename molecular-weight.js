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

function calculateWeight() {
    const formula = document.getElementById('formulaInput').value.trim();
    const resultBox = document.getElementById('resultBox');
    const errorBox = document.getElementById('errorBox');
    const resultValue = document.getElementById('resultValue');
    
    resultBox.style.display = 'none';
    errorBox.style.display = 'none';
    
    if (!formula) {
        showError('Phew! Please enter a formula first ✨');
        return;
    }

    try {
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

        let finalCounts = stack[0];
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

    } catch (error) {
        showError(error.message);
    }

}

function showError(message) {
    const errorBox = document.getElementById('errorBox');
    errorBox.innerText = message;
    errorBox.style.display = 'block';
}