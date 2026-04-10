// Philippine Payroll Computation Utilities (2026 rates)

// ==================== SSS Contribution Table ====================
// Based on SSS Circular 2023-033 (updated schedule)
const SSS_TABLE = [
  { min: 0, max: 4249.99, er: 390, ee: 180 },
  { min: 4250, max: 4749.99, er: 437.5, ee: 202.5 },
  { min: 4750, max: 5249.99, er: 485, ee: 225 },
  { min: 5250, max: 5749.99, er: 532.5, ee: 247.5 },
  { min: 5750, max: 6249.99, er: 580, ee: 270 },
  { min: 6250, max: 6749.99, er: 627.5, ee: 292.5 },
  { min: 6750, max: 7249.99, er: 675, ee: 315 },
  { min: 7250, max: 7749.99, er: 722.5, ee: 337.5 },
  { min: 7750, max: 8249.99, er: 770, ee: 360 },
  { min: 8250, max: 8749.99, er: 817.5, ee: 382.5 },
  { min: 8750, max: 9249.99, er: 865, ee: 405 },
  { min: 9250, max: 9749.99, er: 912.5, ee: 427.5 },
  { min: 9750, max: 10249.99, er: 960, ee: 450 },
  { min: 10250, max: 10749.99, er: 1007.5, ee: 472.5 },
  { min: 10750, max: 11249.99, er: 1055, ee: 495 },
  { min: 11250, max: 11749.99, er: 1102.5, ee: 517.5 },
  { min: 11750, max: 12249.99, er: 1150, ee: 540 },
  { min: 12250, max: 12749.99, er: 1197.5, ee: 562.5 },
  { min: 12750, max: 13249.99, er: 1245, ee: 585 },
  { min: 13250, max: 13749.99, er: 1292.5, ee: 607.5 },
  { min: 13750, max: 14249.99, er: 1340, ee: 630 },
  { min: 14250, max: 14749.99, er: 1387.5, ee: 652.5 },
  { min: 14750, max: 15249.99, er: 1435, ee: 675 },
  { min: 15250, max: 15749.99, er: 1482.5, ee: 697.5 },
  { min: 15750, max: 16249.99, er: 1530, ee: 720 },
  { min: 16250, max: 16749.99, er: 1577.5, ee: 742.5 },
  { min: 16750, max: 17249.99, er: 1625, ee: 765 },
  { min: 17250, max: 17749.99, er: 1672.5, ee: 787.5 },
  { min: 17750, max: 18249.99, er: 1720, ee: 810 },
  { min: 18250, max: 18749.99, er: 1767.5, ee: 832.5 },
  { min: 18750, max: 19249.99, er: 1815, ee: 855 },
  { min: 19250, max: 19749.99, er: 1862.5, ee: 877.5 },
  { min: 19750, max: 20249.99, er: 1910, ee: 900 },
  { min: 20250, max: 20749.99, er: 1957.5, ee: 922.5 },
  { min: 20750, max: 21249.99, er: 2005, ee: 945 },
  { min: 21250, max: 21749.99, er: 2052.5, ee: 967.5 },
  { min: 21750, max: 22249.99, er: 2100, ee: 990 },
  { min: 22250, max: 22749.99, er: 2147.5, ee: 1012.5 },
  { min: 22750, max: 23249.99, er: 2195, ee: 1035 },
  { min: 23250, max: 23749.99, er: 2242.5, ee: 1057.5 },
  { min: 23750, max: 24249.99, er: 2290, ee: 1080 },
  { min: 24250, max: 24749.99, er: 2337.5, ee: 1102.5 },
  { min: 24750, max: 29749.99, er: 2385, ee: 1125 },
  { min: 29750, max: Infinity, er: 2385, ee: 1125 },
];

export function computeSSS(monthlySalary: number): { employee: number; employer: number } {
  const bracket = SSS_TABLE.find(
    (b) => monthlySalary >= b.min && monthlySalary <= b.max
  );
  if (!bracket) return { employee: 1125, employer: 2385 };
  return { employee: bracket.ee, employer: bracket.er };
}

// ==================== PhilHealth ====================
// 5% of monthly basic salary, split 50-50, cap at ₱100,000 salary
const PHILHEALTH_RATE = 0.05;
const PHILHEALTH_FLOOR = 10000;
const PHILHEALTH_CEILING = 100000;

export function computePhilHealth(monthlySalary: number): {
  employee: number;
  employer: number;
} {
  const base = Math.max(PHILHEALTH_FLOOR, Math.min(monthlySalary, PHILHEALTH_CEILING));
  const total = base * PHILHEALTH_RATE;
  const share = total / 2;
  return { employee: share, employer: share };
}

// ==================== Pag-IBIG ====================
// Employee: 1% if ≤ ₱1,500; 2% if > ₱1,500 (max base ₱10,000)
// Employer: 2% (max base ₱10,000)
const PAGIBIG_CEILING = 10000;

export function computePagIBIG(monthlySalary: number): {
  employee: number;
  employer: number;
} {
  const base = Math.min(monthlySalary, PAGIBIG_CEILING);
  const eeRate = monthlySalary <= 1500 ? 0.01 : 0.02;
  return {
    employee: base * eeRate,
    employer: base * 0.02,
  };
}

// ==================== Withholding Tax (BIR) ====================
// Revised withholding tax table (TRAIN Law / CREATE MORE Act)
// Monthly tax table
const TAX_TABLE = [
  { min: 0, max: 20833, base: 0, rate: 0 },
  { min: 20833, max: 33332, base: 0, rate: 0.15 },
  { min: 33333, max: 66666, base: 1875, rate: 0.20 },
  { min: 66667, max: 166666, base: 8541.8, rate: 0.25 },
  { min: 166667, max: 666666, base: 33541.8, rate: 0.30 },
  { min: 666667, max: Infinity, base: 183541.8, rate: 0.35 },
];

export function computeWithholdingTax(taxableIncome: number): number {
  const bracket = TAX_TABLE.find(
    (b) => taxableIncome >= b.min && taxableIncome <= b.max
  );
  if (!bracket) return 0;
  return bracket.base + (taxableIncome - bracket.min) * bracket.rate;
}

// ==================== Full Payroll Computation ====================

export interface PayrollComputation {
  basicPay: number;
  overtimePay: number;
  nightDiffPay: number;
  holidayPay: number;
  allowances: number;
  grossPay: number;
  sssEmployee: number;
  sssEmployer: number;
  philhealthEmployee: number;
  philhealthEmployer: number;
  pagibigEmployee: number;
  pagibigEmployer: number;
  withholdingTax: number;
  totalDeductions: number;
  netPay: number;
}

export interface PayrollInput {
  basicSalary: number; // monthly
  daysWorked: number;
  totalWorkingDays: number; // in the period
  overtimeHours: number;
  nightDiffHours: number;
  holidayDays: number; // regular holiday days worked
  specialHolidayDays: number;
  lateMinutes: number;
  undertimeMinutes: number;
  absentDays: number;
  allowances: number;
  otherDeductions: number;
  payFrequency: "monthly" | "semi-monthly" | "weekly";
}

export function computePayroll(input: PayrollInput): PayrollComputation {
  const {
    basicSalary,
    daysWorked,
    totalWorkingDays,
    overtimeHours,
    nightDiffHours,
    holidayDays,
    specialHolidayDays,
    lateMinutes,
    undertimeMinutes,
    absentDays,
    allowances,
    otherDeductions,
    payFrequency,
  } = input;

  // Daily and hourly rates
  const divisor = payFrequency === "monthly" ? 1 : payFrequency === "semi-monthly" ? 2 : 4;
  const periodSalary = basicSalary / divisor;
  const dailyRate = basicSalary / 22; // standard 22 working days
  const hourlyRate = dailyRate / 8;

  // Basic pay for the period
  const basicPay = daysWorked > 0 ? dailyRate * daysWorked : periodSalary;

  // Overtime: 125% of hourly rate for regular OT
  const overtimePay = overtimeHours * hourlyRate * 1.25;

  // Night differential: 10% of hourly rate
  const nightDiffPay = nightDiffHours * hourlyRate * 0.1;

  // Holiday pay: regular holiday = 200% of daily rate for worked days
  const holidayPay =
    holidayDays * dailyRate * 1.0 + specialHolidayDays * dailyRate * 0.3;

  // Deductions for late/undertime/absent
  const minuteRate = hourlyRate / 60;
  const lateDeduction = lateMinutes * minuteRate;
  const undertimeDeduction = undertimeMinutes * minuteRate;
  const absentDeduction = absentDays * dailyRate;

  const grossPay =
    basicPay + overtimePay + nightDiffPay + holidayPay + allowances;

  // Government deductions (based on monthly salary for SSS/PhilHealth/PagIBIG)
  const sss = computeSSS(basicSalary);
  const philhealth = computePhilHealth(basicSalary);
  const pagibig = computePagIBIG(basicSalary);

  // Pro-rate government deductions for semi-monthly
  const govDivisor = payFrequency === "semi-monthly" ? 2 : 1;

  const sssEE = sss.employee / govDivisor;
  const philhealthEE = philhealth.employee / govDivisor;
  const pagibigEE = pagibig.employee / govDivisor;

  // Taxable income = gross - government contributions
  const taxableIncome = grossPay - sssEE - philhealthEE - pagibigEE;
  const monthlyTaxable =
    payFrequency === "semi-monthly" ? taxableIncome * 2 : taxableIncome;
  const monthlyTax = computeWithholdingTax(monthlyTaxable);
  const withholdingTax = monthlyTax / govDivisor;

  const totalDeductions =
    sssEE +
    philhealthEE +
    pagibigEE +
    withholdingTax +
    lateDeduction +
    undertimeDeduction +
    absentDeduction +
    otherDeductions;

  const netPay = grossPay - totalDeductions;

  return {
    basicPay: Math.round(basicPay * 100) / 100,
    overtimePay: Math.round(overtimePay * 100) / 100,
    nightDiffPay: Math.round(nightDiffPay * 100) / 100,
    holidayPay: Math.round(holidayPay * 100) / 100,
    allowances,
    grossPay: Math.round(grossPay * 100) / 100,
    sssEmployee: Math.round(sssEE * 100) / 100,
    sssEmployer: Math.round(sss.employer / govDivisor * 100) / 100,
    philhealthEmployee: Math.round(philhealthEE * 100) / 100,
    philhealthEmployer: Math.round(philhealth.employer / govDivisor * 100) / 100,
    pagibigEmployee: Math.round(pagibigEE * 100) / 100,
    pagibigEmployer: Math.round(pagibig.employer / govDivisor * 100) / 100,
    withholdingTax: Math.round(withholdingTax * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netPay: Math.round(netPay * 100) / 100,
  };
}

// ==================== 13th Month Pay ====================
export function compute13thMonthPay(totalBasicPayYTD: number): number {
  return totalBasicPayYTD / 12;
}

// ==================== Overtime Rates ====================
export const OT_RATES = {
  regular: 1.25, // Regular day OT
  restDay: 1.3, // Rest day OT
  specialHoliday: 1.3, // Special holiday OT
  specialHolidayRestDay: 1.5, // Special holiday + rest day OT
  regularHoliday: 2.0, // Regular holiday (worked)
  regularHolidayRestDay: 2.6, // Regular holiday + rest day
  doubleHoliday: 3.0, // Double holiday
};

// Night differential: 10% premium for work between 10PM - 6AM
export const NIGHT_DIFF_RATE = 0.1;
