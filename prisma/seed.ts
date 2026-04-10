import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ==================== HELPERS ====================

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatSSS(): string {
  return `${randomBetween(10, 99)}-${randomBetween(1000000, 9999999)}-${randomBetween(1, 9)}`;
}

function formatPhilHealth(): string {
  return `${randomBetween(10, 99)}-${randomBetween(100000000, 999999999)}-${randomBetween(1, 9)}`;
}

function formatPagIBIG(): string {
  return `${randomBetween(1000, 9999)}-${randomBetween(1000, 9999)}-${randomBetween(1000, 9999)}`;
}

function formatTIN(): string {
  return `${randomBetween(100, 999)}-${randomBetween(100, 999)}-${randomBetween(100, 999)}-${randomBetween(0, 9)}${randomBetween(0, 9)}${randomBetween(0, 9)}`;
}

function dateOnly(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function dateTime(year: number, month: number, day: number, hour: number, minute: number): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
}

// ==================== MAIN SEED ====================

async function main() {
  console.log("🌱 Starting seed...\n");

  // ==================== CLEAN ====================
  console.log("🧹 Cleaning existing data...");
  await prisma.payrollItem.deleteMany();
  await prisma.payrollRun.deleteMany();
  await prisma.assetAssignment.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.attendanceRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.overtimeRequest.deleteMany();
  await prisma.officialBusiness.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.position.deleteMany();
  await prisma.department.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();
  console.log("✅ Cleaned existing data.\n");

  // ==================== USERS ====================
  console.log("👤 Creating users...");
  const hashedPassword = await bcrypt.hash("password123", 10);
  const hashedAdminPassword = await bcrypt.hash("Password123!", 10);

  // Main payroll admin account
  await prisma.user.upsert({
    where: { email: "payrolladmin@auntsallyslaundry.com" },
    update: { password: hashedAdminPassword, role: "admin", isActive: true },
    create: { email: "payrolladmin@auntsallyslaundry.com", password: hashedAdminPassword, role: "admin", isActive: true },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@auntsallys.com" },
    update: {},
    create: {
      email: "admin@auntsallys.com",
      password: hashedPassword,
      role: "admin",
    },
  });

  const hrUser = await prisma.user.create({
    data: {
      email: "hr@auntsallys.com",
      password: hashedPassword,
      role: "hr",
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: "manager@auntsallys.com",
      password: hashedPassword,
      role: "manager",
    },
  });

  console.log("✅ Created admin, HR, and manager users.\n");

  // ==================== BRANCHES ====================
  console.log("🏢 Creating branches...");
  const [mainBranch, cebuBranch, davaoBranch] = await prisma.$transaction([
    prisma.branch.create({
      data: {
        name: "AuntSally's Main Office",
        type: "main",
        phone: "+63 2 8888 1234",
        email: "main@auntsallys.com",
        address: "123 Ayala Avenue",
        city: "Makati City",
        province: "Metro Manila",
        zipCode: "1226",
      },
    }),
    prisma.branch.create({
      data: {
        name: "AuntSally's Cebu Branch",
        type: "sub",
        phone: "+63 32 888 5678",
        email: "cebu@auntsallys.com",
        address: "456 Osmena Blvd",
        city: "Cebu City",
        province: "Cebu",
        zipCode: "6000",
      },
    }),
    prisma.branch.create({
      data: {
        name: "AuntSally's Davao Branch",
        type: "sub",
        phone: "+63 82 888 9012",
        email: "davao@auntsallys.com",
        address: "789 JP Laurel Avenue",
        city: "Davao City",
        province: "Davao del Sur",
        zipCode: "8000",
      },
    }),
  ]);
  console.log("✅ Created 3 branches.\n");

  // ==================== DEPARTMENTS ====================
  console.log("🏬 Creating departments...");
  const departmentsData = [
    { name: "HR", description: "Human Resources Department" },
    { name: "Engineering", description: "Software Engineering Department" },
    { name: "Operations", description: "Operations Department" },
    { name: "Finance", description: "Finance and Accounting Department" },
    { name: "Marketing", description: "Marketing Department" },
    { name: "Sales", description: "Sales Department" },
  ];

  const departments: Record<string, { id: string; name: string }> = {};
  for (const dept of departmentsData) {
    const created = await prisma.department.create({ data: dept });
    departments[dept.name] = created;
  }
  console.log("✅ Created 6 departments.\n");

  // ==================== POSITIONS ====================
  console.log("💼 Creating positions...");
  const positionsData: { name: string; departmentName: string }[] = [
    { name: "HR Manager", departmentName: "HR" },
    { name: "HR Staff", departmentName: "HR" },
    { name: "Software Engineer", departmentName: "Engineering" },
    { name: "QA Engineer", departmentName: "Engineering" },
    { name: "Tech Lead", departmentName: "Engineering" },
    { name: "Operations Manager", departmentName: "Operations" },
    { name: "Operations Staff", departmentName: "Operations" },
    { name: "Finance Manager", departmentName: "Finance" },
    { name: "Accountant", departmentName: "Finance" },
    { name: "Marketing Manager", departmentName: "Marketing" },
    { name: "Content Creator", departmentName: "Marketing" },
    { name: "Sales Manager", departmentName: "Sales" },
    { name: "Sales Representative", departmentName: "Sales" },
  ];

  const positions: Record<string, { id: string; name: string }> = {};
  for (const pos of positionsData) {
    const created = await prisma.position.create({
      data: {
        name: pos.name,
        departmentId: departments[pos.departmentName].id,
      },
    });
    positions[pos.name] = created;
  }
  console.log("✅ Created 13 positions.\n");

  // ==================== SHIFTS ====================
  console.log("⏰ Creating shifts...");
  const [regularShift, morningShift, nightShift] = await prisma.$transaction([
    prisma.shift.create({
      data: {
        name: "Regular Shift",
        startTime: "08:00",
        endTime: "17:00",
        breakMinutes: 60,
        gracePeriod: 15,
        isNightShift: false,
      },
    }),
    prisma.shift.create({
      data: {
        name: "Morning Shift",
        startTime: "06:00",
        endTime: "15:00",
        breakMinutes: 60,
        gracePeriod: 15,
        isNightShift: false,
      },
    }),
    prisma.shift.create({
      data: {
        name: "Night Shift",
        startTime: "22:00",
        endTime: "07:00",
        breakMinutes: 60,
        gracePeriod: 15,
        isNightShift: true,
      },
    }),
  ]);
  console.log("✅ Created 3 shifts.\n");

  // ==================== EMPLOYEES ====================
  console.log("👥 Creating employees...");

  interface EmployeeInput {
    firstName: string;
    lastName: string;
    middleName: string;
    gender: string;
    email: string;
    phone: string;
    birthDate: Date;
    civilStatus: string;
    address: string;
    city: string;
    province: string;
    branchId: string;
    departmentName: string;
    positionName: string;
    employmentType: string;
    basicSalary: number;
    dateHired: Date;
    shiftId: string;
    bankName: string;
  }

  const employeesInput: EmployeeInput[] = [
    // 1 - Admin
    {
      firstName: "Ricardo",
      lastName: "Dela Cruz",
      middleName: "Santos",
      gender: "male",
      email: "admin@auntsallys.com",
      phone: "+63 917 111 0001",
      birthDate: dateOnly(1985, 3, 15),
      civilStatus: "married",
      address: "123 Rizal St, Brgy. Poblacion",
      city: "Makati City",
      province: "Metro Manila",
      branchId: mainBranch.id,
      departmentName: "Engineering",
      positionName: "Tech Lead",
      employmentType: "regular",
      basicSalary: 80000,
      dateHired: dateOnly(2020, 1, 6),
      shiftId: regularShift.id,
      bankName: "BDO",
    },
    // 2 - HR
    {
      firstName: "Maria",
      lastName: "Reyes",
      middleName: "Garcia",
      gender: "female",
      email: "hr@auntsallys.com",
      phone: "+63 917 111 0002",
      birthDate: dateOnly(1988, 7, 22),
      civilStatus: "single",
      address: "456 Mabini St, Brgy. San Lorenzo",
      city: "Makati City",
      province: "Metro Manila",
      branchId: mainBranch.id,
      departmentName: "HR",
      positionName: "HR Manager",
      employmentType: "regular",
      basicSalary: 55000,
      dateHired: dateOnly(2019, 6, 17),
      shiftId: regularShift.id,
      bankName: "BPI",
    },
    // 3 - Manager
    {
      firstName: "Jose",
      lastName: "Santos",
      middleName: "Villanueva",
      gender: "male",
      email: "manager@auntsallys.com",
      phone: "+63 917 111 0003",
      birthDate: dateOnly(1982, 11, 5),
      civilStatus: "married",
      address: "789 Bonifacio Drive",
      city: "Makati City",
      province: "Metro Manila",
      branchId: mainBranch.id,
      departmentName: "Operations",
      positionName: "Operations Manager",
      employmentType: "regular",
      basicSalary: 65000,
      dateHired: dateOnly(2018, 3, 12),
      shiftId: regularShift.id,
      bankName: "Metrobank",
    },
    // 4
    {
      firstName: "Ana",
      lastName: "Bautista",
      middleName: "Lim",
      gender: "female",
      email: "ana.bautista@auntsallys.com",
      phone: "+63 917 111 0004",
      birthDate: dateOnly(1990, 5, 10),
      civilStatus: "single",
      address: "12 Sampaguita St, Brgy. Lahug",
      city: "Cebu City",
      province: "Cebu",
      branchId: cebuBranch.id,
      departmentName: "Engineering",
      positionName: "Software Engineer",
      employmentType: "regular",
      basicSalary: 50000,
      dateHired: dateOnly(2021, 8, 2),
      shiftId: regularShift.id,
      bankName: "BDO",
    },
    // 5
    {
      firstName: "Miguel",
      lastName: "Gonzales",
      middleName: "Ramos",
      gender: "male",
      email: "miguel.gonzales@auntsallys.com",
      phone: "+63 917 111 0005",
      birthDate: dateOnly(1993, 2, 28),
      civilStatus: "single",
      address: "34 Narra St, Brgy. Guadalupe",
      city: "Cebu City",
      province: "Cebu",
      branchId: cebuBranch.id,
      departmentName: "Engineering",
      positionName: "Software Engineer",
      employmentType: "regular",
      basicSalary: 45000,
      dateHired: dateOnly(2022, 1, 10),
      shiftId: regularShift.id,
      bankName: "BPI",
    },
    // 6
    {
      firstName: "Patricia",
      lastName: "Mendoza",
      middleName: "Cruz",
      gender: "female",
      email: "patricia.mendoza@auntsallys.com",
      phone: "+63 917 111 0006",
      birthDate: dateOnly(1995, 9, 14),
      civilStatus: "single",
      address: "56 Acacia Ave, Brgy. Banilad",
      city: "Cebu City",
      province: "Cebu",
      branchId: cebuBranch.id,
      departmentName: "Engineering",
      positionName: "QA Engineer",
      employmentType: "regular",
      basicSalary: 40000,
      dateHired: dateOnly(2022, 5, 16),
      shiftId: regularShift.id,
      bankName: "Metrobank",
    },
    // 7
    {
      firstName: "Carlos",
      lastName: "Villanueva",
      middleName: "Tan",
      gender: "male",
      email: "carlos.villanueva@auntsallys.com",
      phone: "+63 917 111 0007",
      birthDate: dateOnly(1987, 12, 1),
      civilStatus: "married",
      address: "78 Mango Ave",
      city: "Davao City",
      province: "Davao del Sur",
      branchId: davaoBranch.id,
      departmentName: "Operations",
      positionName: "Operations Staff",
      employmentType: "regular",
      basicSalary: 25000,
      dateHired: dateOnly(2021, 4, 5),
      shiftId: morningShift.id,
      bankName: "BDO",
    },
    // 8
    {
      firstName: "Isabella",
      lastName: "Garcia",
      middleName: "Aquino",
      gender: "female",
      email: "isabella.garcia@auntsallys.com",
      phone: "+63 917 111 0008",
      birthDate: dateOnly(1991, 4, 18),
      civilStatus: "married",
      address: "90 Orchid Lane, Brgy. Matina",
      city: "Davao City",
      province: "Davao del Sur",
      branchId: davaoBranch.id,
      departmentName: "Finance",
      positionName: "Finance Manager",
      employmentType: "regular",
      basicSalary: 55000,
      dateHired: dateOnly(2020, 9, 1),
      shiftId: regularShift.id,
      bankName: "BPI",
    },
    // 9
    {
      firstName: "Antonio",
      lastName: "Ramirez",
      middleName: "Lopez",
      gender: "male",
      email: "antonio.ramirez@auntsallys.com",
      phone: "+63 917 111 0009",
      birthDate: dateOnly(1989, 8, 25),
      civilStatus: "single",
      address: "11 Jasmine St, Brgy. Buhangin",
      city: "Davao City",
      province: "Davao del Sur",
      branchId: davaoBranch.id,
      departmentName: "Finance",
      positionName: "Accountant",
      employmentType: "regular",
      basicSalary: 35000,
      dateHired: dateOnly(2023, 2, 13),
      shiftId: regularShift.id,
      bankName: "Metrobank",
    },
    // 10
    {
      firstName: "Sophia",
      lastName: "Torres",
      middleName: "Navarro",
      gender: "female",
      email: "sophia.torres@auntsallys.com",
      phone: "+63 917 111 0010",
      birthDate: dateOnly(1994, 1, 7),
      civilStatus: "single",
      address: "22 Sunflower St, Brgy. Agdao",
      city: "Davao City",
      province: "Davao del Sur",
      branchId: davaoBranch.id,
      departmentName: "Marketing",
      positionName: "Marketing Manager",
      employmentType: "regular",
      basicSalary: 50000,
      dateHired: dateOnly(2021, 11, 8),
      shiftId: regularShift.id,
      bankName: "BDO",
    },
    // 11
    {
      firstName: "Gabriel",
      lastName: "Aquino",
      middleName: "Morales",
      gender: "male",
      email: "gabriel.aquino@auntsallys.com",
      phone: "+63 917 111 0011",
      birthDate: dateOnly(1996, 6, 30),
      civilStatus: "single",
      address: "33 Bamboo Lane, Brgy. Apas",
      city: "Cebu City",
      province: "Cebu",
      branchId: cebuBranch.id,
      departmentName: "Marketing",
      positionName: "Content Creator",
      employmentType: "contractual",
      basicSalary: 28000,
      dateHired: dateOnly(2024, 3, 1),
      shiftId: regularShift.id,
      bankName: "BPI",
    },
    // 12
    {
      firstName: "Camille",
      lastName: "Pascual",
      middleName: "Rivera",
      gender: "female",
      email: "camille.pascual@auntsallys.com",
      phone: "+63 917 111 0012",
      birthDate: dateOnly(1992, 10, 12),
      civilStatus: "married",
      address: "44 Pine St, Brgy. Guadalupe",
      city: "Makati City",
      province: "Metro Manila",
      branchId: mainBranch.id,
      departmentName: "Sales",
      positionName: "Sales Manager",
      employmentType: "regular",
      basicSalary: 55000,
      dateHired: dateOnly(2020, 5, 18),
      shiftId: regularShift.id,
      bankName: "Metrobank",
    },
    // 13
    {
      firstName: "Rafael",
      lastName: "Navarro",
      middleName: "Santiago",
      gender: "male",
      email: "rafael.navarro@auntsallys.com",
      phone: "+63 917 111 0013",
      birthDate: dateOnly(1997, 3, 20),
      civilStatus: "single",
      address: "55 Cedar Lane, Brgy. Bel-Air",
      city: "Makati City",
      province: "Metro Manila",
      branchId: mainBranch.id,
      departmentName: "Sales",
      positionName: "Sales Representative",
      employmentType: "probationary",
      basicSalary: 22000,
      dateHired: dateOnly(2025, 10, 1),
      shiftId: regularShift.id,
      bankName: "BDO",
    },
    // 14
    {
      firstName: "Angelica",
      lastName: "Dimaculangan",
      middleName: "Ocampo",
      gender: "female",
      email: "angelica.dimaculangan@auntsallys.com",
      phone: "+63 917 111 0014",
      birthDate: dateOnly(1986, 8, 8),
      civilStatus: "married",
      address: "66 Mahogany Rd, Brgy. Tejeros",
      city: "Makati City",
      province: "Metro Manila",
      branchId: mainBranch.id,
      departmentName: "HR",
      positionName: "HR Staff",
      employmentType: "regular",
      basicSalary: 30000,
      dateHired: dateOnly(2021, 7, 1),
      shiftId: regularShift.id,
      bankName: "BPI",
    },
    // 15
    {
      firstName: "Marco",
      lastName: "Espiritu",
      middleName: "Dela Rosa",
      gender: "male",
      email: "marco.espiritu@auntsallys.com",
      phone: "+63 917 111 0015",
      birthDate: dateOnly(1991, 11, 17),
      civilStatus: "single",
      address: "77 Palm St, Brgy. San Antonio",
      city: "Makati City",
      province: "Metro Manila",
      branchId: mainBranch.id,
      departmentName: "Engineering",
      positionName: "Software Engineer",
      employmentType: "regular",
      basicSalary: 55000,
      dateHired: dateOnly(2020, 2, 3),
      shiftId: regularShift.id,
      bankName: "Metrobank",
    },
    // 16
    {
      firstName: "Jessa",
      lastName: "Manalo",
      middleName: "Villanueva",
      gender: "female",
      email: "jessa.manalo@auntsallys.com",
      phone: "+63 917 111 0016",
      birthDate: dateOnly(1998, 4, 25),
      civilStatus: "single",
      address: "88 Rosal St, Brgy. Camputhaw",
      city: "Cebu City",
      province: "Cebu",
      branchId: cebuBranch.id,
      departmentName: "Sales",
      positionName: "Sales Representative",
      employmentType: "regular",
      basicSalary: 22000,
      dateHired: dateOnly(2023, 9, 4),
      shiftId: regularShift.id,
      bankName: "BDO",
    },
    // 17
    {
      firstName: "Daniel",
      lastName: "Corpuz",
      middleName: "Bautista",
      gender: "male",
      email: "daniel.corpuz@auntsallys.com",
      phone: "+63 917 111 0017",
      birthDate: dateOnly(1984, 7, 3),
      civilStatus: "married",
      address: "99 Flamboyan Lane, Brgy. Pardo",
      city: "Cebu City",
      province: "Cebu",
      branchId: cebuBranch.id,
      departmentName: "Operations",
      positionName: "Operations Staff",
      employmentType: "regular",
      basicSalary: 25000,
      dateHired: dateOnly(2019, 11, 11),
      shiftId: morningShift.id,
      bankName: "BPI",
    },
    // 18
    {
      firstName: "Christine",
      lastName: "Sy",
      middleName: "Tan",
      gender: "female",
      email: "christine.sy@auntsallys.com",
      phone: "+63 917 111 0018",
      birthDate: dateOnly(1993, 12, 19),
      civilStatus: "single",
      address: "101 Gumamela St, Brgy. Sasa",
      city: "Davao City",
      province: "Davao del Sur",
      branchId: davaoBranch.id,
      departmentName: "Sales",
      positionName: "Sales Representative",
      employmentType: "regular",
      basicSalary: 22000,
      dateHired: dateOnly(2024, 1, 15),
      shiftId: regularShift.id,
      bankName: "Metrobank",
    },
    // 19
    {
      firstName: "Enrique",
      lastName: "Salazar",
      middleName: "Ong",
      gender: "male",
      email: "enrique.salazar@auntsallys.com",
      phone: "+63 917 111 0019",
      birthDate: dateOnly(1990, 9, 6),
      civilStatus: "married",
      address: "112 Camia Lane, Brgy. Toril",
      city: "Davao City",
      province: "Davao del Sur",
      branchId: davaoBranch.id,
      departmentName: "Operations",
      positionName: "Operations Staff",
      employmentType: "regular",
      basicSalary: 25000,
      dateHired: dateOnly(2022, 6, 20),
      shiftId: nightShift.id,
      bankName: "BDO",
    },
    // 20
    {
      firstName: "Beatriz",
      lastName: "Lim",
      middleName: "Chua",
      gender: "female",
      email: "beatriz.lim@auntsallys.com",
      phone: "+63 917 111 0020",
      birthDate: dateOnly(1988, 2, 14),
      civilStatus: "married",
      address: "123 Ilang-Ilang St, Brgy. Kapitan Pepe",
      city: "Makati City",
      province: "Metro Manila",
      branchId: mainBranch.id,
      departmentName: "Finance",
      positionName: "Accountant",
      employmentType: "regular",
      basicSalary: 38000,
      dateHired: dateOnly(2021, 3, 15),
      shiftId: regularShift.id,
      bankName: "BPI",
    },
    // 21
    {
      firstName: "Jerome",
      lastName: "Padilla",
      middleName: "Reyes",
      gender: "male",
      email: "jerome.padilla@auntsallys.com",
      phone: "+63 917 111 0021",
      birthDate: dateOnly(1995, 5, 21),
      civilStatus: "single",
      address: "134 Dahlia Ave, Brgy. Banawa",
      city: "Cebu City",
      province: "Cebu",
      branchId: cebuBranch.id,
      departmentName: "Engineering",
      positionName: "Software Engineer",
      employmentType: "probationary",
      basicSalary: 35000,
      dateHired: dateOnly(2025, 11, 3),
      shiftId: regularShift.id,
      bankName: "Metrobank",
    },
    // 22
    {
      firstName: "Katrina",
      lastName: "Fernandez",
      middleName: "Magno",
      gender: "female",
      email: "katrina.fernandez@auntsallys.com",
      phone: "+63 917 111 0022",
      birthDate: dateOnly(1992, 6, 11),
      civilStatus: "single",
      address: "145 Hibiscus Lane, Brgy. Talamban",
      city: "Cebu City",
      province: "Cebu",
      branchId: cebuBranch.id,
      departmentName: "Marketing",
      positionName: "Content Creator",
      employmentType: "regular",
      basicSalary: 30000,
      dateHired: dateOnly(2023, 4, 17),
      shiftId: regularShift.id,
      bankName: "BDO",
    },
    // 23
    {
      firstName: "Paolo",
      lastName: "Guerrero",
      middleName: "Santiago",
      gender: "male",
      email: "paolo.guerrero@auntsallys.com",
      phone: "+63 917 111 0023",
      birthDate: dateOnly(1986, 10, 29),
      civilStatus: "married",
      address: "156 Calachuchi Rd, Brgy. Cabancalan",
      city: "Makati City",
      province: "Metro Manila",
      branchId: mainBranch.id,
      departmentName: "Engineering",
      positionName: "QA Engineer",
      employmentType: "regular",
      basicSalary: 42000,
      dateHired: dateOnly(2020, 8, 10),
      shiftId: regularShift.id,
      bankName: "BPI",
    },
    // 24
    {
      firstName: "Maricel",
      lastName: "Obando",
      middleName: "Diaz",
      gender: "female",
      email: "maricel.obando@auntsallys.com",
      phone: "+63 917 111 0024",
      birthDate: dateOnly(1997, 1, 16),
      civilStatus: "single",
      address: "167 Bougainvillea St, Brgy. Pampanga",
      city: "Davao City",
      province: "Davao del Sur",
      branchId: davaoBranch.id,
      departmentName: "HR",
      positionName: "HR Staff",
      employmentType: "contractual",
      basicSalary: 22000,
      dateHired: dateOnly(2025, 6, 1),
      shiftId: regularShift.id,
      bankName: "Metrobank",
    },
    // 25
    {
      firstName: "Kenneth",
      lastName: "Tan",
      middleName: "Lim",
      gender: "male",
      email: "kenneth.tan@auntsallys.com",
      phone: "+63 917 111 0025",
      birthDate: dateOnly(1994, 8, 4),
      civilStatus: "single",
      address: "178 Sampaguita Ave, Brgy. Lanang",
      city: "Davao City",
      province: "Davao del Sur",
      branchId: davaoBranch.id,
      departmentName: "Engineering",
      positionName: "Software Engineer",
      employmentType: "regular",
      basicSalary: 48000,
      dateHired: dateOnly(2022, 10, 24),
      shiftId: regularShift.id,
      bankName: "BDO",
    },
  ];

  // Map user accounts: first 3 employees link to admin/hr/manager users
  const userLinks: (string | null)[] = [
    adminUser.id,
    hrUser.id,
    managerUser.id,
  ];

  // Create user accounts for all 25 employees (employees 4-25 get employee role)
  const employeeUsers: { id: string; email: string }[] = [];
  for (let i = 3; i < employeesInput.length; i++) {
    const emp = employeesInput[i];
    const user = await prisma.user.create({
      data: {
        email: emp.email,
        password: hashedPassword,
        role: "employee",
      },
    });
    employeeUsers.push(user);
  }

  const createdEmployees: { id: string; employeeId: string; basicSalary: number; shiftId: string | null }[] = [];

  for (let i = 0; i < employeesInput.length; i++) {
    const emp = employeesInput[i];
    const empNumber = String(i + 1).padStart(4, "0");
    const dailyRate = Math.round((emp.basicSalary / 22) * 100) / 100;
    const hourlyRate = Math.round((dailyRate / 8) * 100) / 100;

    let userId: string | null = null;
    if (i < 3) {
      userId = userLinks[i]!;
    } else {
      userId = employeeUsers[i - 3].id;
    }

    const created = await prisma.employee.create({
      data: {
        userId,
        employeeId: `EMP-${empNumber}`,
        firstName: emp.firstName,
        lastName: emp.lastName,
        middleName: emp.middleName,
        email: emp.email,
        phone: emp.phone,
        gender: emp.gender,
        birthDate: emp.birthDate,
        civilStatus: emp.civilStatus,
        address: emp.address,
        city: emp.city,
        province: emp.province,
        zipCode: emp.city === "Makati City" ? "1226" : emp.city === "Cebu City" ? "6000" : "8000",
        branchId: emp.branchId,
        departmentId: departments[emp.departmentName].id,
        positionId: positions[emp.positionName].id,
        employmentType: emp.employmentType,
        dateHired: emp.dateHired,
        dateRegularized:
          emp.employmentType === "regular"
            ? new Date(emp.dateHired.getTime() + 180 * 24 * 60 * 60 * 1000)
            : undefined,
        status: "active",
        basicSalary: emp.basicSalary,
        dailyRate,
        hourlyRate,
        payFrequency: "semi-monthly",
        sssNumber: formatSSS(),
        philhealthNumber: formatPhilHealth(),
        pagibigNumber: formatPagIBIG(),
        tinNumber: formatTIN(),
        bankName: emp.bankName,
        bankAccountNumber: `${randomBetween(1000, 9999)}${randomBetween(10000000, 99999999)}`,
        bankAccountName: `${emp.firstName} ${emp.middleName ? emp.middleName.charAt(0) + ". " : ""}${emp.lastName}`,
        shiftId: emp.shiftId,
      },
    });

    createdEmployees.push({
      id: created.id,
      employeeId: created.employeeId,
      basicSalary: emp.basicSalary,
      shiftId: emp.shiftId,
    });
  }
  console.log(`✅ Created ${createdEmployees.length} employees.\n`);

  // ==================== LEAVE TYPES ====================
  console.log("🏖️  Creating leave types...");
  const leaveTypesData = [
    { name: "Vacation Leave", defaultDays: 15, isPaid: true },
    { name: "Sick Leave", defaultDays: 15, isPaid: true },
    { name: "Emergency Leave", defaultDays: 5, isPaid: true },
    { name: "Maternity Leave", defaultDays: 105, isPaid: true },
    { name: "Paternity Leave", defaultDays: 7, isPaid: true },
    { name: "Solo Parent Leave", defaultDays: 7, isPaid: true },
    { name: "Bereavement Leave", defaultDays: 3, isPaid: true },
    { name: "Unpaid Leave", defaultDays: 0, isPaid: false },
  ];

  const leaveTypes: { id: string; name: string; defaultDays: number }[] = [];
  for (const lt of leaveTypesData) {
    const created = await prisma.leaveType.create({ data: lt });
    leaveTypes.push({ id: created.id, name: lt.name, defaultDays: lt.defaultDays });
  }
  console.log(`✅ Created ${leaveTypes.length} leave types.\n`);

  // ==================== LEAVE BALANCES ====================
  console.log("📊 Creating leave balances for 2026...");
  let leaveBalanceCount = 0;
  for (const emp of createdEmployees) {
    for (const lt of leaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          employeeId: emp.id,
          leaveTypeId: lt.id,
          year: 2026,
          totalDays: lt.defaultDays,
          usedDays: 0,
          remainingDays: lt.defaultDays,
        },
      });
      leaveBalanceCount++;
    }
  }
  console.log(`✅ Created ${leaveBalanceCount} leave balance records.\n`);

  // ==================== HOLIDAYS ====================
  console.log("📅 Creating Philippine holidays for 2026...");
  const holidaysData = [
    { name: "New Year's Day", date: dateOnly(2026, 1, 1), type: "regular" },
    { name: "EDSA Revolution Anniversary", date: dateOnly(2026, 2, 25), type: "special-non-working" },
    { name: "Maundy Thursday", date: dateOnly(2026, 4, 1), type: "regular" },
    { name: "Good Friday", date: dateOnly(2026, 4, 2), type: "regular" },
    { name: "Araw ng Kagitingan", date: dateOnly(2026, 4, 5), type: "regular" },
    { name: "Labor Day", date: dateOnly(2026, 5, 1), type: "regular" },
    { name: "Independence Day", date: dateOnly(2026, 6, 12), type: "regular" },
    { name: "Eid'l Adha", date: dateOnly(2026, 6, 17), type: "regular" },
    { name: "Ninoy Aquino Day", date: dateOnly(2026, 8, 21), type: "special-non-working" },
    { name: "National Heroes Day", date: dateOnly(2026, 8, 31), type: "regular" },
    { name: "All Saints' Day", date: dateOnly(2026, 11, 1), type: "special-non-working" },
    { name: "All Souls' Day", date: dateOnly(2026, 11, 2), type: "special-non-working" },
    { name: "Bonifacio Day", date: dateOnly(2026, 11, 30), type: "regular" },
    { name: "Feast of Immaculate Conception", date: dateOnly(2026, 12, 8), type: "special-non-working" },
    { name: "Christmas Eve", date: dateOnly(2026, 12, 24), type: "special-non-working" },
    { name: "Christmas Day", date: dateOnly(2026, 12, 25), type: "regular" },
    { name: "Rizal Day", date: dateOnly(2026, 12, 30), type: "regular" },
    { name: "Last Day of the Year", date: dateOnly(2026, 12, 31), type: "special-non-working" },
  ];

  for (const hol of holidaysData) {
    await prisma.holiday.create({
      data: {
        name: hol.name,
        date: hol.date,
        type: hol.type,
        isRecurring: true,
      },
    });
  }
  console.log(`✅ Created ${holidaysData.length} holidays.\n`);

  // ==================== ATTENDANCE RECORDS ====================
  console.log("🕐 Generating attendance records for the past 2 weeks...");

  // Today is 2026-04-08. Past 2 weeks: March 25 - April 7
  const attendanceStartDate = dateOnly(2026, 3, 25);
  const attendanceEndDate = dateOnly(2026, 4, 7);
  let attendanceCount = 0;

  // Holidays in this range (Apr 1 Maundy Thursday, Apr 2 Good Friday, Apr 5 Araw ng Kagitingan)
  const holidayDates = new Set(["2026-04-01", "2026-04-02", "2026-04-05"]);

  function getDateStr(d: Date): string {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }

  // Seed random deterministically-ish per employee+date
  function simpleRand(empIdx: number, dayIdx: number, salt: number): number {
    const x = Math.sin(empIdx * 127 + dayIdx * 311 + salt * 997) * 10000;
    return x - Math.floor(x);
  }

  const attendanceRecords: Parameters<typeof prisma.attendance.create>[0]["data"][] = [];

  for (let empIdx = 0; empIdx < createdEmployees.length; empIdx++) {
    const emp = createdEmployees[empIdx];
    const currentDate = new Date(attendanceStartDate);
    let dayIdx = 0;

    while (currentDate <= attendanceEndDate) {
      const dateStr = getDateStr(currentDate);
      const dayOfWeek = currentDate.getUTCDay(); // 0=Sun, 6=Sat

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        dayIdx++;
        continue;
      }

      // Check for holidays
      if (holidayDates.has(dateStr)) {
        attendanceRecords.push({
          employeeId: emp.id,
          date: new Date(currentDate),
          shiftId: emp.shiftId,
          status: "holiday",
          productionHours: 0,
        });
        attendanceCount++;
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        dayIdx++;
        continue;
      }

      const rand = simpleRand(empIdx, dayIdx, 1);

      // ~8% chance of absence
      if (rand < 0.08) {
        attendanceRecords.push({
          employeeId: emp.id,
          date: new Date(currentDate),
          shiftId: emp.shiftId,
          status: "absent",
          productionHours: 0,
          remarks: "No show",
        });
        attendanceCount++;
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        dayIdx++;
        continue;
      }

      // Determine shift times
      let shiftStartHour = 8;
      let shiftStartMin = 0;
      let shiftEndHour = 17;
      let shiftEndMin = 0;

      if (emp.shiftId === morningShift.id) {
        shiftStartHour = 6;
        shiftStartMin = 0;
        shiftEndHour = 15;
        shiftEndMin = 0;
      } else if (emp.shiftId === nightShift.id) {
        shiftStartHour = 22;
        shiftStartMin = 0;
        shiftEndHour = 7; // next day, but we keep it simple
        shiftEndMin = 0;
      }

      // Clock-in variation: -15 to +30 min from shift start
      const clockInVariation = Math.floor(simpleRand(empIdx, dayIdx, 2) * 46) - 15;
      const actualClockInMin = shiftStartHour * 60 + shiftStartMin + clockInVariation;
      const clockInHour = Math.floor(actualClockInMin / 60);
      const clockInMin = actualClockInMin % 60;

      // Late calculation
      const lateMinutes = Math.max(0, clockInVariation);
      const status = lateMinutes > 0 ? "late" : "present";

      // Clock-out variation: -5 to +120 min from shift end (overtime possible)
      const clockOutVariation = Math.floor(simpleRand(empIdx, dayIdx, 3) * 126) - 5;
      const actualClockOutMin = shiftEndHour * 60 + shiftEndMin + clockOutVariation;
      const clockOutHour = Math.floor(actualClockOutMin / 60);
      const clockOutMin = actualClockOutMin % 60;

      // Overtime: only count if more than 30 minutes past shift end
      const overtimeMinutes = clockOutVariation > 30 ? clockOutVariation : 0;

      // Undertime: if left early
      const undertimeMinutes = clockOutVariation < 0 ? Math.abs(clockOutVariation) : 0;

      // Calculate production hours (total hours - break)
      const totalMinutesWorked = actualClockOutMin - actualClockInMin - 60; // minus 60 min break
      const productionHours = Math.max(0, Math.round((totalMinutesWorked / 60) * 100) / 100);

      // Night diff hours for night shift
      const nightDiffMinutes = emp.shiftId === nightShift.id ? Math.max(totalMinutesWorked, 0) : 0;

      const year = currentDate.getUTCFullYear();
      const month = currentDate.getUTCMonth();
      const day = currentDate.getUTCDate();

      attendanceRecords.push({
        employeeId: emp.id,
        date: new Date(currentDate),
        shiftId: emp.shiftId,
        clockIn: new Date(Date.UTC(year, month, day, clockInHour, clockInMin)),
        clockOut: new Date(Date.UTC(year, month, day, clockOutHour, clockOutMin)),
        breakStart: new Date(Date.UTC(year, month, day, 12, 0)),
        breakEnd: new Date(Date.UTC(year, month, day, 13, 0)),
        breakMinutes: 60,
        status,
        lateMinutes,
        undertimeMinutes,
        overtimeMinutes,
        nightDiffMinutes,
        productionHours,
      });
      attendanceCount++;

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      dayIdx++;
    }
  }

  // Batch insert attendance records
  for (const record of attendanceRecords) {
    await prisma.attendance.create({ data: record });
  }
  console.log(`✅ Created ${attendanceCount} attendance records.\n`);

  // ==================== ASSETS ====================
  console.log("💻 Creating assets...");

  const assets: { id: string; status: string }[] = [];

  // 10 Laptops
  const laptopBrands = [
    { brand: "Lenovo", model: "ThinkPad T14" },
    { brand: "Dell", model: "Latitude 5540" },
    { brand: "HP", model: "EliteBook 840 G10" },
    { brand: "Apple", model: "MacBook Pro 14\"" },
    { brand: "Lenovo", model: "ThinkPad X1 Carbon" },
    { brand: "Dell", model: "XPS 15" },
    { brand: "HP", model: "ProBook 450 G10" },
    { brand: "Apple", model: "MacBook Air M3" },
    { brand: "Lenovo", model: "IdeaPad 5 Pro" },
    { brand: "Dell", model: "Inspiron 16" },
  ];

  for (let i = 0; i < 10; i++) {
    const isAssigned = i < 7; // 7 assigned, 3 available
    const asset = await prisma.asset.create({
      data: {
        assetCode: `LAPTOP-${String(i + 1).padStart(3, "0")}`,
        name: `${laptopBrands[i].brand} ${laptopBrands[i].model}`,
        category: "laptop",
        brand: laptopBrands[i].brand,
        model: laptopBrands[i].model,
        serialNumber: `SN-LT-${randomBetween(100000, 999999)}`,
        purchaseDate: dateOnly(2024, randomBetween(1, 12), randomBetween(1, 28)),
        purchasePrice: randomBetween(45000, 120000),
        condition: "good",
        status: isAssigned ? "assigned" : "available",
      },
    });
    assets.push({ id: asset.id, status: asset.status });
  }

  // 5 Monitors
  const monitorModels = [
    { brand: "Dell", model: "UltraSharp U2723QE" },
    { brand: "LG", model: "27UK850-W" },
    { brand: "Samsung", model: "ViewFinity S8" },
    { brand: "BenQ", model: "PD2700U" },
    { brand: "ASUS", model: "ProArt PA278CV" },
  ];

  for (let i = 0; i < 5; i++) {
    const isAssigned = i < 3;
    const asset = await prisma.asset.create({
      data: {
        assetCode: `MON-${String(i + 1).padStart(3, "0")}`,
        name: `${monitorModels[i].brand} ${monitorModels[i].model}`,
        category: "monitor",
        brand: monitorModels[i].brand,
        model: monitorModels[i].model,
        serialNumber: `SN-MN-${randomBetween(100000, 999999)}`,
        purchaseDate: dateOnly(2024, randomBetween(1, 12), randomBetween(1, 28)),
        purchasePrice: randomBetween(15000, 35000),
        condition: "good",
        status: isAssigned ? "assigned" : "available",
      },
    });
    assets.push({ id: asset.id, status: asset.status });
  }

  // 3 Company phones
  const phoneModels = [
    { brand: "Samsung", model: "Galaxy S24" },
    { brand: "Apple", model: "iPhone 15" },
    { brand: "Samsung", model: "Galaxy A54" },
  ];

  for (let i = 0; i < 3; i++) {
    const isAssigned = i < 2;
    const asset = await prisma.asset.create({
      data: {
        assetCode: `PHONE-${String(i + 1).padStart(3, "0")}`,
        name: `${phoneModels[i].brand} ${phoneModels[i].model}`,
        category: "phone",
        brand: phoneModels[i].brand,
        model: phoneModels[i].model,
        serialNumber: `SN-PH-${randomBetween(100000, 999999)}`,
        purchaseDate: dateOnly(2024, randomBetween(1, 12), randomBetween(1, 28)),
        purchasePrice: randomBetween(15000, 60000),
        condition: "good",
        status: isAssigned ? "assigned" : "available",
      },
    });
    assets.push({ id: asset.id, status: asset.status });
  }

  // Create asset assignments for assigned assets
  let assignmentIdx = 0;
  for (const asset of assets) {
    if (asset.status === "assigned" && assignmentIdx < createdEmployees.length) {
      await prisma.assetAssignment.create({
        data: {
          assetId: asset.id,
          employeeId: createdEmployees[assignmentIdx].id,
          assignedDate: dateOnly(2024, randomBetween(1, 6), randomBetween(1, 28)),
          condition: "good",
          notes: "Issued upon onboarding",
        },
      });
      assignmentIdx++;
    }
  }
  console.log(`✅ Created ${assets.length} assets with ${assignmentIdx} assignments.\n`);

  // ==================== SETTINGS ====================
  console.log("⚙️  Creating default settings...");
  const settingsData = [
    { key: "company_name", value: "AuntSally's", category: "company" },
    { key: "company_email", value: "info@auntsallys.com", category: "company" },
    { key: "company_phone", value: "+63 2 8888 1234", category: "company" },
    { key: "company_address", value: "123 Ayala Avenue, Makati City, Metro Manila", category: "company" },
    { key: "pay_frequency", value: "semi-monthly", category: "payroll" },
    { key: "pay_day_first", value: "15", category: "payroll" },
    { key: "pay_day_second", value: "30", category: "payroll" },
    { key: "sss_enabled", value: "true", category: "payroll" },
    { key: "philhealth_enabled", value: "true", category: "payroll" },
    { key: "pagibig_enabled", value: "true", category: "payroll" },
    { key: "tax_enabled", value: "true", category: "payroll" },
    { key: "overtime_rate", value: "1.25", category: "payroll" },
    { key: "night_diff_rate", value: "0.10", category: "payroll" },
    { key: "late_deduction_per_minute", value: "0", category: "attendance" },
    { key: "grace_period_minutes", value: "15", category: "attendance" },
    { key: "work_hours_per_day", value: "8", category: "attendance" },
    { key: "work_days_per_month", value: "22", category: "attendance" },
    { key: "currency", value: "PHP", category: "general" },
    { key: "timezone", value: "Asia/Manila", category: "general" },
    { key: "date_format", value: "MM/dd/yyyy", category: "general" },
  ];

  for (const setting of settingsData) {
    await prisma.setting.create({ data: setting });
  }
  console.log(`✅ Created ${settingsData.length} settings.\n`);

  // ==================== PAYROLL RUN ====================
  console.log("💰 Creating payroll run...");

  // Most recent completed semi-monthly period: March 16 - March 31, 2026
  const periodStart = dateOnly(2026, 3, 16);
  const periodEnd = dateOnly(2026, 3, 31);
  const payDate = dateOnly(2026, 3, 31);

  // Calculate payroll items
  interface PayrollItemInput {
    employeeId: string;
    basicPay: number;
    overtimePay: number;
    nightDiffPay: number;
    holidayPay: number;
    allowances: number;
    grossPay: number;
    sssContribution: number;
    philhealthContribution: number;
    pagibigContribution: number;
    withholdingTax: number;
    lateDeductions: number;
    absentDeductions: number;
    totalDeductions: number;
    netPay: number;
    daysWorked: number;
    hoursWorked: number;
  }

  const payrollItems: PayrollItemInput[] = [];
  let totalGross = 0;
  let totalDeductions = 0;
  let totalNetPay = 0;

  for (const emp of createdEmployees) {
    // Semi-monthly basic pay = basic salary / 2
    const basicPay = Math.round(emp.basicSalary / 2);
    const dailyRate = Math.round((emp.basicSalary / 22) * 100) / 100;
    const hourlyRate = Math.round((dailyRate / 8) * 100) / 100;

    // Working days in Mar 16-31: exclude weekends (Mar 16=Mon through Mar 31=Tue)
    // Mar 16(M),17(T),18(W),19(Th),20(F) - 5 days
    // Mar 23(M),24(T),25(W),26(Th),27(F) - 5 days
    // Mar 30(M),31(T) - 2 days = 12 working days
    // Slight variation per employee
    const daysWorked = 12 - (simpleRand(createdEmployees.indexOf(emp), 100, 5) < 0.15 ? 1 : 0);
    const hoursWorked = daysWorked * 8;

    // Some overtime
    const hasOvertime = simpleRand(createdEmployees.indexOf(emp), 100, 6) > 0.6;
    const overtimeHours = hasOvertime ? Math.floor(simpleRand(createdEmployees.indexOf(emp), 100, 7) * 10) + 2 : 0;
    const overtimePay = Math.round(overtimeHours * hourlyRate * 1.25);

    // Night diff for night shift employees
    const isNight = emp.shiftId === nightShift.id;
    const nightDiffPay = isNight ? Math.round(hoursWorked * hourlyRate * 0.1) : 0;

    const holidayPay = 0; // No holidays in Mar 16-31
    const allowances = 0;
    const grossPay = basicPay + overtimePay + nightDiffPay + holidayPay + allowances;

    // Government deductions (simplified Philippine rates)
    // SSS: ~4.5% employee share on semi-monthly, capped
    const sssContribution = Math.min(Math.round(basicPay * 0.045), 1350);
    // PhilHealth: 5% total / 2 = 2.5% employee share on monthly salary / 2
    const philhealthContribution = Math.min(Math.round(basicPay * 0.025), 500);
    // Pag-IBIG: 2% employee, max 100/month = 50 semi-monthly
    const pagibigContribution = Math.min(Math.round(basicPay * 0.02), 50);

    // Withholding tax (simplified: ~10% on taxable income above 10417/month semi equiv)
    const taxableIncome = Math.max(grossPay - sssContribution - philhealthContribution - pagibigContribution - 10417, 0);
    const withholdingTax = Math.round(taxableIncome * 0.15);

    // Late deductions
    const lateDeductions = Math.round(simpleRand(createdEmployees.indexOf(emp), 200, 8) < 0.2 ? hourlyRate * 0.5 : 0);
    const absentDeductions = daysWorked < 12 ? Math.round(dailyRate * (12 - daysWorked)) : 0;

    const totalDed =
      sssContribution +
      philhealthContribution +
      pagibigContribution +
      withholdingTax +
      lateDeductions +
      absentDeductions;

    const netPay = grossPay - totalDed;

    payrollItems.push({
      employeeId: emp.id,
      basicPay,
      overtimePay,
      nightDiffPay,
      holidayPay,
      allowances,
      grossPay,
      sssContribution,
      philhealthContribution,
      pagibigContribution,
      withholdingTax,
      lateDeductions,
      absentDeductions,
      totalDeductions: totalDed,
      netPay,
      daysWorked,
      hoursWorked,
    });

    totalGross += grossPay;
    totalDeductions += totalDed;
    totalNetPay += netPay;
  }

  const payrollRun = await prisma.payrollRun.create({
    data: {
      name: "Payroll - March 16-31, 2026",
      periodStart,
      periodEnd,
      payDate,
      payFrequency: "semi-monthly",
      status: "paid",
      totalGross: Math.round(totalGross * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      totalNetPay: Math.round(totalNetPay * 100) / 100,
      employeeCount: createdEmployees.length,
      processedBy: adminUser.id,
      approvedBy: adminUser.id,
      approvedAt: dateOnly(2026, 3, 30),
      notes: "Regular semi-monthly payroll, second half of March 2026.",
    },
  });

  // Create payroll items
  for (const item of payrollItems) {
    await prisma.payrollItem.create({
      data: {
        payrollRunId: payrollRun.id,
        employeeId: item.employeeId,
        basicPay: item.basicPay,
        overtimePay: item.overtimePay,
        nightDiffPay: item.nightDiffPay,
        holidayPay: item.holidayPay,
        allowances: item.allowances,
        thirteenthMonth: 0,
        otherEarnings: 0,
        grossPay: item.grossPay,
        sssContribution: item.sssContribution,
        philhealthContribution: item.philhealthContribution,
        pagibigContribution: item.pagibigContribution,
        withholdingTax: item.withholdingTax,
        lateDeductions: item.lateDeductions,
        undertimeDeductions: 0,
        absentDeductions: item.absentDeductions,
        loanDeductions: 0,
        otherDeductions: 0,
        totalDeductions: item.totalDeductions,
        netPay: item.netPay,
        daysWorked: item.daysWorked,
        hoursWorked: item.hoursWorked,
      },
    });
  }
  console.log(
    `✅ Created payroll run "${payrollRun.name}" with ${payrollItems.length} items.`
  );
  console.log(
    `   Total Gross: ₱${totalGross.toLocaleString()} | Deductions: ₱${totalDeductions.toLocaleString()} | Net: ₱${totalNetPay.toLocaleString()}\n`
  );

  // ==================== SUMMARY ====================
  console.log("========================================");
  console.log("🌱 Seed completed successfully!");
  console.log("========================================");
  console.log(`  Users:          ${3 + employeesInput.length - 3} (3 admin/hr/manager + ${employeesInput.length - 3} employees)`);
  console.log(`  Branches:       3`);
  console.log(`  Departments:    ${Object.keys(departments).length}`);
  console.log(`  Positions:      ${Object.keys(positions).length}`);
  console.log(`  Shifts:         3`);
  console.log(`  Employees:      ${createdEmployees.length}`);
  console.log(`  Leave Types:    ${leaveTypes.length}`);
  console.log(`  Leave Balances: ${leaveBalanceCount}`);
  console.log(`  Holidays:       ${holidaysData.length}`);
  console.log(`  Attendance:     ${attendanceCount}`);
  console.log(`  Assets:         ${assets.length}`);
  console.log(`  Settings:       ${settingsData.length}`);
  console.log(`  Payroll Run:    1 (${payrollItems.length} items)`);
  console.log("========================================\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
