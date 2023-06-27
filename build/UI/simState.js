import { qs } from "../Utils/helpers.js";
import { modeUpdate } from "./render.js";
//Inputs
const theory = qs(".theory");
const strat = qs(".strat");
const sigma = qs(".sigma");
const input = qs(".input");
const cap = qs(".cap");
const mode = qs(".mode");
const modeInput = qs("textarea");
const hardCap = qs(".hardCap");
//Outputs
const output = qs(".output");
const table = qs(".simTable");
//Setting Inputs
const dtOtp = qs(".dtOtp");
const ddtOtp = qs(".ddtOtp");
const showA23 = qs(".a23");
const defaultState = `{"controls1":{"theory":{"value":"T1","innerHTML":"<option value=\"T1\">T1</option><option value=\"T2\">T2</option><option value=\"T3\">T3</option><option value=\"T4\">T4</option><option value=\"T5\">T5</option><option value=\"T6\">T6</option><option value=\"T7\">T7</option><option value=\"T8\">T8</option><option value=\"WSP\">WSP</option><option value=\"SL\">SL</option><option value=\"EF\">EF</option><option value=\"CSR2\">CSR2</option><option value=\"RZ\">RZ</option><option value=\"FP\">FP</option>"},"strat":{"value":"Best Overall","innerHTML":"\n            <option value=\"Best Overall\">Best Overall</option>\n            <option value=\"Best Active\">Best Active</option>\n            <option value=\"Best Semi-Idle\">Best Semi-Idle</option>\n            <option value=\"Best Idle\">Best Idle</option>\n          <option value=\"T1\">T1</option><option value=\"T1C34\">T1C34</option><option value=\"T1C4\">T1C4</option><option value=\"T1Ratio\">T1Ratio</option><option value=\"T1SolarXLII\">T1SolarXLII</option>"},"sigma":"","input":"","cap":""},"controls2":{"mode":"Single sim","modeInput":"","extraInputDescription":"","hardCap":false,"timeDiffInputs":["","",""]},"output":"Invalid sigma value. Sigma must be an integer that's >= 0","table":"\n        <thead><tr><th> </th><th>Input</th><th><span style=\"font-size:0.9rem; font-style:italics\">τ</span>/h Active</th><th><span style=\"font-size:0.9rem; font-style:italics\">τ</span>/h Idle</th><th>Ratio</th><th>Multi Active</th><th>Multi Idle</th><th>Strat Active</th><th>Strat Idle</th><th>Time Active</th><th>Time Idle</th><th>Δ<span style=\"font-size:0.9rem; font-style:italics\">τ</span> Active</th><th>Δ<span style=\"font-size:0.9rem; font-style:italics\">τ</span> Idle</th></tr></thead>\n        <tbody></tbody>\n      ","settings":{"dt":"1.5","ddt":"1.0001","showA23":false}}`;
export function setSimState() {
    localStorage.setItem("simState", JSON.stringify({
        controls1: {
            theory: { value: theory.value, innerHTML: theory.innerHTML },
            strat: { value: strat.value, innerHTML: strat.innerHTML },
            sigma: sigma.value,
            input: input.value,
            cap: cap.value
        },
        controls2: {
            mode: mode.value,
            modeInput: modeInput.value,
            extraInputDescription: qs(".extraInputDescription").textContent,
            hardCap: hardCap.checked,
            timeDiffInputs: [qs(".timeDiffWrapper").children[0].value, qs(".timeDiffWrapper").children[1].value, qs(".timeDiffWrapper").children[2].value]
        },
        output: output.textContent,
        table: table.innerHTML,
        settings: {
            dt: dtOtp.textContent,
            ddt: ddtOtp.textContent,
            showA23: showA23.checked
        }
    }));
}
export function getSimState() {
    var _a;
    const state = JSON.parse((_a = localStorage.getItem("simState")) !== null && _a !== void 0 ? _a : defaultState);
    theory.innerHTML = state.controls1.theory.innerHTML;
    theory.value = state.controls1.theory.value;
    strat.innerHTML = state.controls1.strat.innerHTML;
    strat.value = state.controls1.strat.value;
    sigma.value = state.controls1.sigma;
    input.value = state.controls1.input;
    cap.value = state.controls1.cap;
    mode.value = state.controls2.mode;
    modeInput.value = state.controls2.modeInput;
    qs(".extraInputDescription").textContent = state.controls2.extraInputDescription;
    hardCap.checked = state.controls2.hardCap;
    qs(".timeDiffWrapper").children[0].value = state.controls2.timeDiffInputs[0];
    qs(".timeDiffWrapper").children[1].value = state.controls2.timeDiffInputs[1];
    qs(".timeDiffWrapper").children[2].value = state.controls2.timeDiffInputs[2];
    output.textContent = state.output;
    table.innerHTML = state.table;
    dtOtp.textContent = state.settings.dt;
    ddtOtp.textContent = state.settings.ddt;
    showA23.checked = state.settings.showA23;
    qs(".dt").value = "8.1943";
    qs(".ddt").value = "2.71233";
    modeUpdate();
    table.classList.remove("big");
    table.classList.remove("small");
    if (state.controls2.mode !== "All")
        table.classList.add("small");
    else
        table.classList.add("big");
}
