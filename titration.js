let titrationResult = {
    concentration: 0,
    originalConcentration: 0,
    moles: 0
};

// Acid Database
const acidData = {
    HCl: {
        name: "Hydrochloric Acid (HCl)",
        mw: 36.46
    },

    HNO3: {
        name: "Nitric Acid (HNO₃)",
        mw: 63.01
    },

    HBr: {
        name: "Hydrobromic Acid (HBr)",
        mw: 80.91
    },

    HI: {
        name: "Hydroiodic Acid (HI)",
        mw: 127.91
    },

    HClO4: {
        name: "Perchloric Acid (HClO₄)",
        mw: 100.45
    }
};

// Auto Fill Molecular Weight
function updateAcidData() {

    const acid = document.getElementById("analyteSelect").value;
    const mwBox = document.getElementById("molecularWeight");

    if (acidData[acid]) {

        mwBox.value = acidData[acid].mw;
    }

    else {
        mwBox.value = "";
    }
}

// Calculate Titration
// C1V1 = C2V2
function calculateTitration() {
    const C1Input = parseFloat(
        document.getElementById("titrantConc").value
    );
    const C1Unit =
        document.getElementById("titrantConcUnit").value;


    const V1Input = parseFloat(
        document.getElementById("titrantVol").value
    );
    const V1Unit =
        document.getElementById("titrantVolUnit").value;


    const V2Input = parseFloat(
        document.getElementById("sampleVol").value
    );
    const V2Unit =
        document.getElementById("sampleVolUnit").value;


    const resultBox =
        document.getElementById("titrationResultBox");

    const stepBox =
        document.getElementById("titrationSteps");

    const result =
        document.getElementById("sampleConcResult");

    // ตรวจสอบข้อมูล
    if (
        isNaN(C1Input) ||
        isNaN(V1Input) ||
        isNaN(V2Input)
    )
    {
        alert("Please fill all titration data.");
        return;
    }

    // แปลง Concentration เป็น M
    let C1 = C1Input;

    if(C1Unit === "mM"){

        C1 = C1Input / 1000;

    }

    // แปลง Volume เป็น L
    let V1 = V1Input;
    let V2 = V2Input;

    if(V1Unit === "mL"){

        V1 = V1Input / 1000;

    }

    if(V2Unit === "mL"){

        V2 = V2Input / 1000;

    }

    // สูตร C1V1=C2V2
    const C2 = (C1 * V1) / V2;
    titrationResult.concentration = C2;

    // แสดงผล
    stepBox.innerHTML = `

    C₂ = (C₁ × V₁) / V₂

    <br><br>

    C₂ = (${C1.toFixed(4)} × ${V1.toFixed(4)})
    / ${V2.toFixed(4)}

    <br><br>

    C₂ = ${C2.toFixed(4)} mol/L

    `;

    result.innerHTML =
        C2.toFixed(4);
    resultBox.style.display = "block";

}

// Add Dilution Step
function addDilutionStep(){
    const container =
        document.getElementById("dilutionContainer");
    const stepNumber =
        container.children.length + 1;
    const newStep = document.createElement("div");

    newStep.className = "dilution-step";
    newStep.style.cssText = `
        background:#f8f9fa;
        border-radius:16px;
        padding:15px;
        margin-top:15px;
    `;

    newStep.innerHTML = `
    <div style="
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:12px;
    ">

        <b style="font-size:13px;">Dilution Step ${stepNumber}</b>

        <button
        onclick="removeDilutionStep(this)"
        style="background:#fff; color:#fb6f92; border:2px solid #ffc2d1;
        border-radius:12px; padding:5px 12px; font-family:'Quicksand',sans-serif;
        font-weight:700; cursor:pointer;">✕</button>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">

        <div class="input-group">
            <label>Transfer Volume</label>

            <div style="display:grid; grid-template-columns:1fr 70px; gap:10px;">
            <input
                type="number"
                class="dilutionInput"
                data-type="transferVolume"
                placeholder="Transfer Volume">

            <span style="padding:12px 0; text-align:center;">mL</span>
        </div>
    </div>    

    <div class="input-group">
        <label>Total Volume</label>

        <div style="display:grid; grid-template-columns:1fr 70px; gap:10px;">
            <input
                type="number"
                class="dilutionInput"
                data-type="finalVolume"
                placeholder="Volume">

            <span style="padding:12px 0; text-align:center;">mL</span>
        </div>
    </div>

</div>

    `;
     container.appendChild(newStep);
}

function removeDilutionStep(button){
    const step = button.closest(".dilution-step");
    step.remove();
    updateDilutionStepNumber();
}

function updateDilutionStepNumber(){
    const steps = document.querySelectorAll(".dilution-step");
    steps.forEach((step,index)=>{
        const title = step.querySelector("b");
        if(title){
          title.innerText = `Dilution Step ${index+1}`;
        }
    });
}


function calculateAnalysis(){

    if(titrationResult.concentration === 0){
        alert("Please calculate titration first.");
        return;
    }

    const acid =
        document.getElementById("analyteSelect").value;

    if(!acid){
        alert("Please select analyte.");
        return;
    }

    const sampleAmount =
        parseFloat(document.getElementById("sampleAmount").value);

    if(isNaN(sampleAmount)){
        alert("Please enter sample amount.");
        return;
    }

    const percentType =
        document.querySelector('input[name="percentType"]:checked');

    if(!percentType){
        alert("Please choose calculation type.");
        return;
    }

    const mw =
        parseFloat(document.getElementById("molecularWeight").value);

    const sampleUnit =
        document.getElementById("sampleAmountUnit").value;

    const dilutionSteps =
        getDilutionSteps();

    // ===========================
    // Total Dilution Factor
    // ===========================

    const dilutionFactor =
        calculateDilutionFactor(dilutionSteps);

    // ===========================
    // Original Concentration
    // ===========================

    const originalConcentration =
        titrationResult.concentration *
        dilutionFactor;

    titrationResult.originalConcentration =
        originalConcentration;

    // ===========================
    // Moles in Original Flask
    // ===========================

    // Step 1 Total Volume (mL)
    const originalVolume =
        dilutionSteps[0].finalVolume / 1000;

    // mol = M × V
    const analyteMoles =
        originalConcentration *
        originalVolume;

    // เก็บไว้
    titrationResult.moles =
        analyteMoles;

    console.log(
        "Original Volume =",
        originalVolume,
        "L"
    );

    console.log(
        "Analyte Moles =",
        analyteMoles,
        "mol"
    );

    // ===========================
    // Analyte Mass
    // ===========================

    // gram = mol × MW
    const analyteMass =
        analyteMoles * mw;

    // ===========================
    // Composition (%)
    // ===========================

    let composition = 0;

    // %(w/w)
    if(percentType.value === "ww"){

        composition =
            (analyteMass / sampleAmount) * 100;

    }

    // %(w/v)
    else{

        composition =
            (analyteMass / sampleAmount) * 100;

    }

    document.getElementById(
        "compositionResult"
    ).innerHTML =
        composition.toFixed(2) + " %";

    console.log(
        "Analyte Mass =",
        analyteMass,
        "g"
    );

    document.getElementById(
        "analyteAmountResult"
    ).innerHTML =
        analyteMass.toFixed(4) + " g";

    document.getElementById(
        "analysisResultBox"
    ).style.display = "block";

    // ===========================
    // Debug
    // ===========================

    console.log("Acid =", acid);
    console.log("MW =", mw);
    console.log("Sample Weight =", sampleAmount);
    console.log("Sample Unit =", sampleUnit);
    console.log("Percent Type =", percentType.value);

    console.log("Dilution Steps =", dilutionSteps);
    console.log("Dilution Factor =", dilutionFactor);

    console.log("Concentration in Flask =", titrationResult.concentration);
    console.log("Original Concentration =", originalConcentration);

}


function getDilutionSteps(){

    const steps =
        document.querySelectorAll(".dilution-step");

    let dilutionData = [];

    steps.forEach((step, index)=>{

        const finalVolume =
            parseFloat(step.querySelector('[data-type="finalVolume"]').value);

        if(index === 0){
            //Step 1
            const weight =
                parseFloat(step.querySelector('[data-type="weight"]').value);

            dilutionData.push({
                weight: isNaN(weight) ? 0 : weight,
                finalVolume: isNaN(finalVolume) ? 0 : finalVolume
            });
        }

        else{
            //Step 2+
            const transferVolume =
                parseFloat(step.querySelector('[data-type="transferVolume"]').value);
            
            dilutionData.push({
                transferVolume: isNaN(transferVolume) ? 0 : transferVolume,
                finalVolume: isNaN(finalVolume) ? 0 : finalVolume
            });
        }

    });

    return dilutionData;

}

function calculateDilutionFactor(dilutionData){

    let dilutionFactor = 1;

    // เริ่มคิดตั้งแต่ Step2
    for(let i = 1; i < dilutionData.length; i++){

        const transfer = dilutionData[i].transferVolume;
        const finalVolume = dilutionData[i].finalVolume;

        if(
            transfer > 0 &&
            finalVolume > 0
        ){

            dilutionFactor *= finalVolume / transfer;

        }

    }

    return dilutionFactor;

}

function syncSampleAmount(){

    document.getElementById("step1Amount").value =
        document.getElementById("sampleAmount").value;

}


function updateSampleInput(){

    const percentType =
        document.querySelector(
            'input[name="percentType"]:checked'
        );

    const sampleLabel =
        document.getElementById("sampleAmountLabel");

    const sampleInput =
        document.getElementById("sampleAmount");

    const sampleUnit =
        document.getElementById("sampleAmountUnit");

    const stepLabel =
        document.getElementById("step1Label");

    const stepInput =
        document.getElementById("step1Amount");

    const stepUnit =
        document.getElementById("step1Unit");

    // -----------------------
    // ยังไม่ได้เลือก Type
    // -----------------------

    if(!percentType){

        sampleLabel.innerText = "Sample Weight";
        sampleUnit.innerText = "";

        sampleInput.placeholder =
            "Select calculation type first";

        sampleInput.disabled = true;

        stepLabel.innerText = "Sample Weight";
        stepUnit.innerText = "";

        stepInput.placeholder =
            "Auto";

        return;

    }

    // เปิดให้กรอก

    sampleInput.disabled = false;

    // -----------------------
    // %(w/w)
    // -----------------------

    if(percentType.value === "ww"){

        sampleLabel.innerText =
            "Sample Weight";

        sampleUnit.innerText =
            "g";

        sampleInput.placeholder =
            "Enter sample weight";

        stepLabel.innerText =
            "Sample Weight";

        stepUnit.innerText =
            "g";

        stepInput.placeholder =
            "Auto";

    }

    // -----------------------
    // %(w/v)
    // -----------------------

    else{

        sampleLabel.innerText =
            "Sample Volume";

        sampleUnit.innerText =
            "mL";

        sampleInput.placeholder =
            "Enter sample volume";

        stepLabel.innerText =
            "Sample Volume";

        stepUnit.innerText =
            "mL";

        stepInput.placeholder =
            "Auto";

    }

}


window.addEventListener("DOMContentLoaded", ()=>{

    document
        .getElementById("sampleAmount")
        .addEventListener("input", syncSampleAmount);

    updateSampleInput();
    syncSampleAmount();

});