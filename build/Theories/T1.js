var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { global } from "../Sim/main.js";
import { logToExp } from "../Utils/simHelpers.js";
import { add, arr, createResult, l10, subtract } from "../Utils/simHelpers.js";
import { findIndex, sleep } from "../Utils/helperFunctions.js";
import Variable from "../Utils/variable.js";
export default function t1(data) {
    return __awaiter(this, void 0, void 0, function* () {
        let sim = new t1Sim(data);
        let res = yield sim.simulate();
        return res;
    });
}
class t1Sim {
    constructor(data) {
        var _a;
        this.stratIndex = findIndex(data.strats, data.strat);
        this.strat = data.strat;
        this.theory = "T1";
        //theory
        this.cap = typeof data.cap === "number" && data.cap > 0 ? [data.cap, 1] : [Infinity, 0];
        this.recovery = (_a = data.recovery) !== null && _a !== void 0 ? _a : { value: 0, time: 0, recoveryTime: false };
        this.lastPub = data.rho;
        this.sigma = data.sigma;
        this.totMult = this.getTotMult(data.rho);
        this.curMult = 0;
        this.dt = global.dt;
        this.ddt = global.ddt;
        this.t = 0;
        this.ticks = 0;
        //currencies
        this.rho = 0;
        this.maxRho = 0;
        //initialize variables
        this.variables = [
            new Variable({ lvl: 1, cost: 5, costInc: 2, value: 1, stepwisePowerSum: { default: true } }),
            new Variable({ cost: 100, costInc: 10, varBase: 2 }),
            new Variable({ cost: 15, costInc: 2, stepwisePowerSum: { default: true } }),
            new Variable({ cost: 3000, costInc: 10, varBase: 2 }),
            new Variable({ cost: 1e4, costInc: Math.pow(2, (4.5 * Math.log2(10))), varBase: 10 }),
            new Variable({ cost: 1e10, costInc: Math.pow(2, (8 * Math.log2(10))), varBase: 10 })
        ];
        //values of the different terms, so they are accesible for variable buying conditions
        this.term1 = 0;
        this.term2 = 0;
        this.term3 = 0;
        this.termRatio = 0;
        this.c3Ratio = this.lastPub < 300 ? 1 : this.lastPub < 450 ? 1.1 : this.lastPub < 550 ? 2 : this.lastPub < 655 ? 5 : 10;
        //pub values
        this.tauH = 0;
        this.maxTauH = 0;
        this.pubT = 0;
        this.pubRho = 0;
        //milestones  [logterm, c1exp, c3term, c4term]
        this.milestones = [0, 0, 0, 0];
        this.result = [];
        this.pubMulti = 0;
        this.conditions = this.getBuyingConditions();
        this.milestoneConditions = this.getMilestoneConditions();
        this.milestoneTree = this.getMilestoneTree();
        this.updateMilestones();
    }
    getBuyingConditions() {
        let conditions = [
            [...arr(6, true)],
            [true, true, false, false, true, true],
            [true, true, false, false, false, true],
            [
                () => this.variables[0].cost + 1 < this.rho,
                () => this.variables[1].cost + l10(1.11) < this.rho,
                () => this.variables[2].cost + this.termRatio + 1 <= this.rho,
                () => this.variables[3].cost + this.termRatio <= this.rho,
                () => this.variables[4].cost + l10(this.c3Ratio) < this.rho,
                true
            ],
            [
                () => this.variables[0].cost + l10(5) <= this.rho &&
                    this.variables[0].cost + l10(6 + (this.variables[0].lvl % 10)) <= this.variables[1].cost &&
                    this.variables[0].cost + l10(15 + (this.variables[0].lvl % 10)) < (this.milestones[3] > 0 ? this.variables[5].cost : 1000),
                () => this.variables[1].cost + l10(1.11) < this.rho,
                () => this.variables[2].cost + this.termRatio + 1 <= this.rho,
                () => this.variables[3].cost + this.termRatio <= this.rho,
                () => this.variables[4].cost + l10(this.c3Ratio) < this.rho,
                true
            ] //t1SolarXLII
        ];
        conditions = conditions.map((elem) => elem.map((i) => (typeof i === "function" ? i : () => i)));
        return conditions;
    }
    getMilestoneConditions() {
        let conditions = [() => true, () => true, () => true, () => true, () => this.milestones[2] > 0, () => this.milestones[3] > 0];
        return conditions;
    }
    getMilestoneTree() {
        let tree = [
            ...new Array(5).fill([
                [0, 0, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 1, 1],
                [1, 0, 1, 1],
                [1, 1, 1, 1],
                [1, 2, 1, 1],
                [1, 3, 1, 1]
            ]) //t1,t1C34,t1C4,t1Ratio,t1SolarXLII
        ];
        return tree;
    }
    getTotMult(val) {
        return Math.max(0, val * 0.164 - l10(3)) + l10(Math.pow((this.sigma / 20), (this.sigma < 65 ? 0 : this.sigma < 75 ? 1 : this.sigma < 85 ? 2 : 3)));
    }
    updateMilestones() {
        const stage = Math.min(6, Math.floor(Math.max(this.lastPub, this.maxRho) / 25));
        this.milestones = this.milestoneTree[this.stratIndex][Math.min(this.milestoneTree[this.stratIndex].length - 1, stage)];
    }
    simulate() {
        return __awaiter(this, void 0, void 0, function* () {
            let c4_nc = Math.ceil((this.lastPub - 10) / 8) * 8 + 10;
            let pub = c4_nc - this.lastPub < 3 ? c4_nc + 2 : c4_nc - this.lastPub < 5 ? c4_nc - 2 + Math.log10(1.5) : c4_nc - 4 + Math.log10(1.4);
            let coast = (c4_nc - this.lastPub < 3 ? c4_nc : Math.floor(this.lastPub)) + Math.log10(30);
            coast = Math.max(8 + Math.log10(30), coast + Math.floor(pub - coast));
            let pubCondition = false;
            while (!pubCondition) {
                if (!global.simulating)
                    break;
                if ((this.ticks + 1) % 500000 === 0)
                    yield sleep();
                this.tick();
                if (this.rho > this.maxRho)
                    this.maxRho = this.rho;
                if (this.lastPub < 176)
                    this.updateMilestones();
                this.curMult = Math.pow(10, (this.getTotMult(this.maxRho) - this.totMult));
                if (this.stratIndex !== 4 || this.rho < coast || global.forcedPubTime !== Infinity)
                    this.buyVariables();
                pubCondition = (global.forcedPubTime !== Infinity ? this.t > global.forcedPubTime : this.stratIndex === 4 ? this.pubRho > pub : this.t > this.pubT * 2 || this.pubRho > this.cap[0]) && this.pubRho > 10;
                this.ticks++;
            }
            this.pubMulti = Math.pow(10, (this.getTotMult(this.pubRho) - this.totMult));
            this.result = createResult(this, global.forcedPubTime === Infinity && this.stratIndex === 4 ? ` ${this.lastPub < 50 ? "" : logToExp(Math.min(this.pubRho, coast), 2)}` : "");
            return this.result;
        });
    }
    tick() {
        this.term1 = this.variables[2].value * (1 + 0.05 * this.milestones[1]) + this.variables[3].value + (this.milestones[0] > 0 ? l10(1 + this.rho / Math.LOG10E / 100) : 0);
        this.term2 = add(this.variables[4].value + this.rho * 0.2, this.variables[5].value + this.rho * 0.3);
        this.term3 = this.variables[0].value + this.variables[1].value;
        let rhodot = add(this.term1, this.term2) + this.term3 + this.totMult + l10(this.dt);
        this.rho = add(this.rho, rhodot);
        this.t += this.dt / 1.5;
        this.dt *= this.ddt;
        if (this.maxRho < this.recovery.value)
            this.recovery.time = this.t;
        this.tauH = (this.maxRho - this.lastPub) / (this.t / 3600);
        if (this.maxTauH < this.tauH || this.maxRho >= this.cap[0] - this.cap[1] || this.pubRho < 10 || global.forcedPubTime !== Infinity || this.stratIndex === 4) {
            this.maxTauH = this.tauH;
            this.pubT = this.t;
            this.pubRho = this.maxRho;
        }
    }
    buyVariables() {
        let bought = false;
        for (let i = this.variables.length - 1; i >= 0; i--)
            while (true) {
                if (this.rho > this.variables[i].cost && this.conditions[this.stratIndex][i]() && this.milestoneConditions[i]()) {
                    this.rho = subtract(this.rho, this.variables[i].cost);
                    this.variables[i].buy();
                    bought = true;
                }
                else
                    break;
            }
        if (bought) {
            this.termRatio = Math.max(l10(5), (this.term2 - this.term1) * Number(this.milestones[3] > 0));
        }
    }
}
