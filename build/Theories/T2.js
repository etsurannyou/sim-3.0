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
import { add, createResult, l10, subtract } from "../Utils/simHelpers.js";
import { findIndex, sleep } from "../Utils/helperFunctions.js";
import Variable from "../Utils/variable.js";
export default function t2(data) {
    return __awaiter(this, void 0, void 0, function* () {
        let sim = new t2Sim(data);
        let res = yield sim.simulate();
        return res;
    });
}
class t2Sim {
    constructor(data) {
        var _a;
        this.stratIndex = findIndex(data.strats, data.strat);
        this.strat = data.strat;
        this.theory = "T2";
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
        this.q1 = 0;
        this.q2 = 0;
        this.q3 = 0;
        this.q4 = 0;
        this.r1 = 0;
        this.r2 = 0;
        this.r3 = 0;
        this.r4 = 0;
        //initialize variables
        this.variables = [
            new Variable({ lvl: 1, cost: 10, costInc: 2, value: 1, stepwisePowerSum: { default: true } }),
            new Variable({ cost: 5000, costInc: 2, stepwisePowerSum: { default: true } }),
            new Variable({ cost: 3e25, costInc: 3, stepwisePowerSum: { default: true } }),
            new Variable({ cost: 8e50, costInc: 4, stepwisePowerSum: { default: true } }),
            new Variable({ cost: 2e6, costInc: 2, stepwisePowerSum: { default: true } }),
            new Variable({ cost: 3e9, costInc: 2, stepwisePowerSum: { default: true } }),
            new Variable({ cost: 4e25, costInc: 3, stepwisePowerSum: { default: true } }),
            new Variable({ cost: 5e50, costInc: 4, stepwisePowerSum: { default: true } })
        ];
        //pub values
        this.tauH = 0;
        this.maxTauH = 0;
        this.pubT = 0;
        this.pubRho = 0;
        //milestones  [qterm, rterm, q1exp, r1exp]
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
            new Array(8).fill(true),
            [
                () => this.curMult < 4650,
                () => this.curMult < 2900,
                () => this.curMult < 2250,
                () => this.curMult < 1150,
                () => this.curMult < 4650,
                () => this.curMult < 2900,
                () => this.curMult < 2250,
                () => this.curMult < 1150
            ],
            new Array(8).fill(true),
            new Array(8).fill(true) //t2qs
        ];
        conditions = conditions.map((elem) => elem.map((i) => (typeof i === "function" ? i : () => i)));
        return conditions;
    }
    getMilestoneConditions() {
        let conditions = [() => true, () => true, () => this.milestones[0] > 0, () => this.milestones[0] > 1, () => true, () => true, () => this.milestones[1] > 0, () => this.milestones[1] > 1];
        return conditions;
    }
    getMilestoneTree() {
        let tree = [
            ...new Array(4).fill([
                [0, 0, 0, 0],
                [1, 0, 0, 0],
                [2, 0, 0, 0],
                [2, 1, 0, 0],
                [2, 2, 0, 0],
                [2, 2, 1, 0],
                [2, 2, 2, 0],
                [2, 2, 3, 0],
                [2, 2, 3, 1],
                [2, 2, 3, 2],
                [2, 2, 3, 3]
            ]) //t2,t2mc
        ];
        return tree;
    }
    getTotMult(val) {
        return Math.max(0, val * 0.198 - l10(100)) + l10(Math.pow((this.sigma / 20), (this.sigma < 65 ? 0 : this.sigma < 75 ? 1 : this.sigma < 85 ? 2 : 3)));
    }
    updateMilestones() {
        let milestoneCount = Math.min(10, Math.floor(Math.max(this.lastPub, this.maxRho) / 25));
        this.milestones = [0, 0, 0, 0];
        let priority = [];
        if (this.stratIndex < 2)
            priority = [1, 2, 3, 4];
        //ms for t2ms
        if (this.stratIndex === 2) {
            let tm100 = this.t % 100;
            if (tm100 < 10)
                priority = [3, 4, 1, 2];
            else if (tm100 < 50)
                priority = [1, 2, 3, 4];
            else if (tm100 < 60)
                priority = [3, 4, 1, 2];
            else if (tm100 < 100)
                priority = [2, 1, 3, 4];
        }
        //ms for t2qs
        if (this.stratIndex === 3) {
            let coastMulti = Infinity;
            if (this.lastPub > 0)
                coastMulti = 10;
            if (this.lastPub > 75)
                coastMulti = 200;
            if (this.lastPub > 100)
                coastMulti = 200;
            if (this.lastPub > 125)
                coastMulti = 200;
            if (this.lastPub > 150)
                coastMulti = 600;
            if (this.lastPub > 200)
                coastMulti = 100;
            if (this.lastPub > 225)
                coastMulti = 25;
            if (this.curMult < coastMulti)
                priority = [1, 2, 3, 4];
            else
                priority = [3, 4, 1, 2];
        }
        const max = [2, 2, 3, 3];
        for (let i = 0; i < priority.length; i++) {
            while (this.milestones[priority[i] - 1] < max[priority[i] - 1] && milestoneCount > 0) {
                this.milestones[priority[i] - 1]++;
                milestoneCount--;
            }
        }
    }
    simulate() {
        return __awaiter(this, void 0, void 0, function* () {
            let pubCondition = false;
            while (!pubCondition) {
                if (!global.simulating)
                    break;
                if ((this.ticks + 1) % 500000 === 0)
                    yield sleep();
                this.tick();
                if (this.rho > this.maxRho)
                    this.maxRho = this.rho;
                if (this.lastPub < 250)
                    this.updateMilestones();
                this.curMult = Math.pow(10, (this.getTotMult(this.maxRho) - this.totMult));
                this.buyVariables();
                pubCondition = (global.forcedPubTime !== Infinity ? this.t > global.forcedPubTime : this.t > this.pubT * 2 || this.pubRho > this.cap[0]) && this.pubRho > 15;
                this.ticks++;
            }
            this.pubMulti = Math.pow(10, (this.getTotMult(this.pubRho) - this.totMult));
            this.result = createResult(this, "");
            return this.result;
        });
    }
    tick() {
        let logdt = l10(this.dt);
        this.q1 = add(this.q1, this.variables[0].value + this.q2 + logdt);
        this.q2 = add(this.q2, this.variables[1].value + this.q3 + logdt);
        this.q3 = this.milestones[0] > 0 ? add(this.q3, this.variables[2].value + this.q4 + logdt) : this.q3;
        this.q4 = this.milestones[0] > 1 ? add(this.q4, this.variables[3].value + logdt) : this.q4;
        this.r1 = add(this.r1, this.variables[4].value + this.r2 + logdt);
        this.r2 = add(this.r2, this.variables[5].value + this.r3 + logdt);
        this.r3 = this.milestones[1] > 0 ? add(this.r3, this.variables[6].value + this.r4 + logdt) : this.r3;
        this.r4 = this.milestones[1] > 1 ? add(this.r4, this.variables[7].value + logdt) : this.r4;
        let rhodot = this.q1 * (1 + 0.05 * this.milestones[2]) + this.r1 * (1 + 0.05 * this.milestones[3]) + this.totMult + logdt;
        this.rho = add(this.rho, rhodot);
        this.t += this.dt / 1.5;
        this.dt *= this.ddt;
        if (this.maxRho < this.recovery.value)
            this.recovery.time = this.t;
        this.tauH = (this.maxRho - this.lastPub) / (this.t / 3600);
        if (this.maxTauH < this.tauH || this.maxRho >= this.cap[0] - this.cap[1] || this.pubRho < 15 || global.forcedPubTime !== Infinity) {
            this.maxTauH = this.tauH;
            this.pubT = this.t;
            this.pubRho = this.maxRho;
        }
    }
    buyVariables() {
        for (let i = this.variables.length - 1; i >= 0; i--)
            while (true) {
                if (this.rho > this.variables[i].cost && this.conditions[this.stratIndex][i]() && this.milestoneConditions[i]()) {
                    this.rho = subtract(this.rho, this.variables[i].cost);
                    this.variables[i].buy();
                }
                else
                    break;
            }
    }
}
