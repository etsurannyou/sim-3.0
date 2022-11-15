import { global } from "../../Sim/main.js";
import { logToExp, simResult, theoryData } from "../../Utils/simHelpers.js";
import { add, createResult, l10, subtract } from "../../Utils/simHelpers.js";
import { findIndex, sleep } from "../../Utils/helperFunctions.js";
import { variableInterface } from "../../Utils/simHelpers.js";
import Variable from "../../Utils/variable.js";

export default async function t7(data: theoryData): Promise<simResult> {
  let sim = new t7Sim(data);
  let res = await sim.simulate();
  return res;
}

class t7Sim {
  conditions: Array<Array<boolean | Function>>;
  milestoneConditions: Array<Function>;
  milestoneTree: Array<Array<Array<number>>>;

  stratIndex: number;
  strat: string;
  theory: string;
  //theory
  cap: Array<number>;
  recovery: { value: number; time: number; recoveryTime: boolean };
  lastPub: number;
  sigma: number;
  totMult: number;
  curMult: number;
  dt: number;
  ddt: number;
  t: number;
  ticks: number;
  //currencies
  rho: number;
  maxRho: number;
  rho2: number;
  //initialize variables
  variables: Array<variableInterface>;
  drho13: number;
  drho23: number;
  c2ratio: number;
  //pub values
  tauH: number;
  maxTauH: number;
  pubT: number;
  pubRho: number;
  //milestones  [dimensions, b1exp, b2exp, b3exp]
  milestones: Array<number>;
  pubMulti: number;
  result: Array<any>;

  getBuyingConditions() {
    if (this.lastPub >= 100) this.c2ratio = 100;
    if (this.lastPub >= 175) this.c2ratio = 10;
    if (this.lastPub >= 250) this.c2ratio = 20;
    if (this.lastPub >= 275) this.c2ratio = 50;
    if (this.lastPub >= 300) this.c2ratio = Infinity;
    let conditions: Array<Array<boolean | Function>> = [
      [true, true, true, true, true, true, true], //T7
      [true, true, true, false, false, false, false], //T7C12
      [true, false, false, true, false, false, false], //T7C3
      [true, false, false, true, true, true, true], //T7noC12
      [true, false, false, false, true, true, true], //T7noC123
      [true, false, false, false, false, true, true], //T7noC1234
      [() => this.variables[0].cost + 1 < this.variables[2].cost, () => this.variables[1].cost + l10(8) < this.variables[2].cost, true, false, false, false, false], //T7C12d
      [() => this.variables[0].cost + 1 < this.variables[3].cost, false, false, true, false, false, false], //T7C3d
      [
        () => this.variables[0].cost + l10(4) < this.variables[6].cost,
        () => this.variables[1].cost + l10(10 + this.variables[2].lvl) < this.variables[2].cost,
        () => this.variables[2].cost + l10(this.c2ratio) < this.variables[6].cost,
        () => this.variables[3].cost + 1 < this.variables[6].cost,
        () => this.variables[4].cost + 1 < this.variables[6].cost,
        () => this.variables[5].cost + l10(4) < this.variables[6].cost,
        true
      ] //T7PlaySpqcey
    ];
    conditions = conditions.map((elem) => elem.map((i) => (typeof i === "function" ? i : () => i)));
    return conditions;
  }
  getMilestoneConditions() {
    let conditions: Array<Function> = [() => true, () => true, () => true, () => this.milestones[1] > 0, () => this.milestones[0] > 0, () => this.milestones[2] > 0, () => this.milestones[3] > 0];
    return conditions;
  }
  getMilestoneTree() {
    let tree: Array<Array<Array<number>>> = [
      [
        [0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0],
        [1, 1, 0, 0, 0],
        [1, 1, 1, 0, 0],
        [1, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 2],
        [1, 1, 1, 1, 3]
      ], //T7
      [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 2],
        [0, 0, 0, 0, 3]
      ], //T7C12
      [
        [0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0]
      ], //T7C3
      [
        [0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0],
        [1, 1, 0, 0, 0],
        [1, 1, 1, 0, 0],
        [1, 1, 1, 1, 0]
      ], //T7noC12
      [
        [0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 1, 0, 0],
        [1, 0, 1, 1, 0]
      ], //T7noC123
      [
        [0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 1, 0, 0],
        [1, 0, 1, 1, 0]
      ], //T7noC1234
      [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 2],
        [0, 0, 0, 0, 3]
      ], //T7C12d
      [
        [0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0]
      ], //T7C3d
      [
        [0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0],
        [1, 1, 0, 0, 0],
        [1, 1, 1, 0, 0],
        [1, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 2],
        [1, 1, 1, 1, 3]
      ] //T7PlaySpqcey
    ];
    return tree;
  }

  getTotMult(val: number) {
    return Math.max(0, val * 0.152) + l10((this.sigma / 20) ** (this.sigma < 65 ? 0 : this.sigma < 75 ? 1 : this.sigma < 85 ? 2 : 3));
  }
  updateMilestones(): void {
    const stage = Math.min(7, Math.floor(Math.max(this.lastPub, this.maxRho) / 25));
    this.milestones = this.milestoneTree[this.stratIndex][Math.min(this.milestoneTree[this.stratIndex].length - 1, stage)];
  }
  constructor(data: theoryData) {
    this.stratIndex = findIndex(data.strats, data.strat);
    this.strat = data.strat;
    this.theory = "T7";
    //theory
    this.cap = typeof data.cap === "number" && data.cap > 0 ? [data.cap, 1] : [Infinity, 0];
    this.recovery = data.recovery ?? { value: 0, time: 0, recoveryTime: false };
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
    this.rho2 = 0;
    //initialize variables
    this.variables = [
      new Variable({ lvl: 1, cost: 500, costInc: 1.51572, value: 1, stepwisePowerSum: { default: true } }),
      new Variable({ cost: 10, costInc: 1.275, value: 1, stepwisePowerSum: { default: true } }),
      new Variable({ cost: 40, costInc: 8, varBase: 2 }),
      new Variable({ cost: 1e5, costInc: 63, varBase: 2 }),
      new Variable({ cost: 10, costInc: 2.82, varBase: 2 }),
      new Variable({ cost: 1e8, costInc: 60, varBase: 2 }),
      new Variable({ cost: 1e2, costInc: 2.81, varBase: 2 })
    ];
    this.drho13 = 0;
    this.drho23 = 0;
    this.c2ratio = Infinity;
    //pub values
    this.tauH = 0;
    this.maxTauH = 0;
    this.pubT = 0;
    this.pubRho = 0;
    //milestones  [dimensions, c3term, c5term, c6term, c1exp]
    this.milestones = [0, 0, 0, 0, 0];
    this.result = [];
    this.pubMulti = 0;
    this.conditions = this.getBuyingConditions();
    this.milestoneConditions = this.getMilestoneConditions();
    this.milestoneTree = this.getMilestoneTree();
    this.updateMilestones();
  }
  async simulate() {
    let pubCondition = false;
    while (!pubCondition) {
      if (!global.simulating) break;
      if ((this.ticks + 1) % 500000 === 0) await sleep();
      this.tick();
      if (this.rho > this.maxRho) this.maxRho = this.rho;
      if (this.lastPub < 175) this.updateMilestones();
      this.curMult = 10 ** (this.getTotMult(this.maxRho) - this.totMult);
      this.buyVariables();
      pubCondition = (global.forcedPubTime !== Infinity ? this.t > global.forcedPubTime : this.t > this.pubT * 2 || this.pubRho > this.cap[0]) && this.pubRho > 10;
      this.ticks++;
    }
    this.pubMulti = 10 ** (this.getTotMult(this.pubRho) - this.totMult);
    this.result = createResult(this, this.strat === "T7PlaySpqcey" ? (this.c2ratio !== Infinity ? this.c2ratio.toString() : "") : "");
    return this.result;
  }
  tick() {
    let vc1 = this.variables[1].value * (1 + 0.05 * this.milestones[4]);

    let drho11 = vc1 + this.variables[2].value;
    let drho12 = this.milestones[1] > 0 ? l10(1.5) + this.variables[3].value + this.rho / 2 : 0;
    let drho21 = this.milestones[0] > 0 ? this.variables[4].value : 0;
    let drho22 = this.milestones[2] > 0 ? l10(1.5) + this.variables[5].value + this.rho2 / 2 : 0;
    this.drho13 = this.milestones[3] > 0 ? Math.min(this.drho13 + 2, Math.min(l10(0.5) + this.variables[6].value + this.rho2 / 2 - this.rho / 2, this.rho + 2)) : 0;
    this.drho23 = this.milestones[3] > 0 ? Math.min(this.drho23 + 2, Math.min(l10(0.5) + this.variables[6].value + this.rho / 2 - this.rho2 / 2, this.rho2 + 2)) : 0;
    let dtq1bonus = l10(this.dt) + this.variables[0].value + this.totMult;

    this.rho = add(this.rho, dtq1bonus + add(add(drho11, drho12), this.drho13));

    this.rho2 = add(this.rho2, dtq1bonus + add(add(drho21, drho22), this.drho23));

    this.t += this.dt / 1.5;
    this.dt *= this.ddt;
    if (this.maxRho < this.recovery.value) this.recovery.time = this.t;

    this.tauH = (this.maxRho - this.lastPub) / (this.t / 3600);
    if (this.maxTauH < this.tauH || this.maxRho >= this.cap[0] - this.cap[1] || this.pubRho < 10 || global.forcedPubTime !== Infinity) {
      this.maxTauH = this.tauH;
      this.pubT = this.t;
      this.pubRho = this.maxRho;
    }
  }
  buyVariables() {
    for (let i = this.variables.length - 1; i >= 0; i--)
      while (true) {
        if (this.rho > this.variables[i].cost && (<Function>this.conditions[this.stratIndex][i])() && this.milestoneConditions[i]()) {
          this.rho = subtract(this.rho, this.variables[i].cost);
          this.variables[i].buy();
        } else break;
      }
  }
}
