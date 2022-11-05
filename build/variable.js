import { log10, add, ZERO } from "./Utils/simHelpers.js";
export default class Variable {
    constructor(data) {
        var _a, _b, _c, _d;
        this.lvl = (_a = data.lvl) !== null && _a !== void 0 ? _a : 0;
        this.cost = parseValue(String(data.cost));
        this.costInc = Math.log10(data.costInc);
        this.value = typeof data.value === "number" || typeof data.value === "string" ? parseValue(String(data.value)) : 0;
        this.stepwisePowerSum =
            ((_b = data.stepwisePowerSum) === null || _b === void 0 ? void 0 : _b.default) === true
                ? { base: 2, length: 10 }
                : typeof ((_c = data.stepwisePowerSum) === null || _c === void 0 ? void 0 : _c.base) === "number" && typeof ((_d = data.stepwisePowerSum) === null || _d === void 0 ? void 0 : _d.length) === "number"
                    ? { base: data.stepwisePowerSum.base, length: data.stepwisePowerSum.length }
                    : { base: 0, length: 0 };
        this.varBase = data.varBase ? Math.log10(data.varBase) : 1;
    }
    buy() {
        this.cost += this.costInc;
        if (this.stepwisePowerSum.base !== 0) {
            this.value = this.value === ZERO ? Math.log10(this.stepwisePowerSum.base) * Math.floor(this.lvl / this.stepwisePowerSum.length) : add(this.value, Math.log10(this.stepwisePowerSum.base) * Math.floor(this.lvl / this.stepwisePowerSum.length));
        }
        else
            this.value = this.varBase * (this.lvl + 1);
        this.lvl++;
    }
}
function parseValue(val) {
    if (val === "Infinity")
        throw "Variable value reached Infinity";
    if (val === "0")
        return ZERO;
    if (/[e]/.test(val))
        return log10(val);
    return Math.log10(Number(val));
}
