import { PrismaClient, Gender, TokenStatus, VisitStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Demo1234!', 12);

  const clinic = await prisma.clinic.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' },
    update: {},
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Demo Family Clinic',
      phone: '021-1234567',
      email: 'hello@demofamily.clinic',
      address: 'Shop 4, Block 5, Gulshan-e-Iqbal',
      city: 'Karachi',
      timezone: 'Asia/Karachi',
      currency: 'PKR',
      plan: 'STARTER',
    },
  });

  await prisma.clinicSettings.upsert({
    where: { clinicId: clinic.id },
    update: {},
    create: {
      clinicId: clinic.id,
      clinicName: 'Demo Family Clinic',
      address: clinic.address,
      phone: clinic.phone,
      currency: 'PKR',
      timezone: 'Asia/Karachi',
      consultationFee: 1500,
      paymentTiming: 'AT_DISPENSING',
      repeatMedicineEnabled: true,
      repeatRequiresDoctorApproval: false,
      repeatValidityDays: 30,
      negativeStockAllowed: false,
    },
  });

  await prisma.clinicSequence.upsert({
    where: { clinicId: clinic.id },
    update: {},
    create: { clinicId: clinic.id, lastPatientNumber: 10, lastPrescriptionNumber: 3 },
  });

  const owner = await prisma.user.upsert({
    where: { id: '22222222-2222-2222-2222-222222222222' },
    update: { passwordHash },
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      clinicId: clinic.id,
      name: 'Clinic Owner',
      email: 'owner@demo.clinic',
      phone: '03001111111',
      passwordHash,
      role: 'OWNER',
      canDispense: true,
    },
  });

  const doctorUser = await prisma.user.upsert({
    where: { id: '33333333-3333-3333-3333-333333333333' },
    update: { passwordHash },
    create: {
      id: '33333333-3333-3333-3333-333333333333',
      clinicId: clinic.id,
      name: 'Dr. Ahmed',
      email: 'doctor@demo.clinic',
      phone: '03002222222',
      passwordHash,
      role: 'DOCTOR',
    },
  });

  const doctor = await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      id: '44444444-4444-4444-4444-444444444444',
      clinicId: clinic.id,
      userId: doctorUser.id,
      name: 'Dr. Ahmed',
      licenseNumber: 'PMC-12345',
      specialization: 'General Physician',
      consultationFee: 1500,
    },
  });

  await prisma.user.upsert({
    where: { id: '55555555-5555-5555-5555-555555555555' },
    update: { passwordHash },
    create: {
      id: '55555555-5555-5555-5555-555555555555',
      clinicId: clinic.id,
      name: 'Reception',
      email: 'reception@demo.clinic',
      phone: '03003333333',
      passwordHash,
      role: 'RECEPTIONIST',
      canDispense: true,
    },
  });

  await prisma.user.upsert({
    where: { id: '66666666-6666-6666-6666-666666666666' },
    update: { passwordHash },
    create: {
      id: '66666666-6666-6666-6666-666666666666',
      clinicId: clinic.id,
      name: 'Medicine Counter',
      email: 'dispenser@demo.clinic',
      phone: '03004444444',
      passwordHash,
      role: 'DISPENSER',
      canDispense: true,
    },
  });

  const otherClinic = await prisma.clinic.upsert({
    where: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
    update: {},
    create: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'Other Clinic',
      city: 'Lahore',
      timezone: 'Asia/Karachi',
      currency: 'PKR',
    },
  });
  await prisma.user.upsert({
    where: { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' },
    update: { passwordHash },
    create: {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      clinicId: otherClinic.id,
      name: 'Other Owner',
      email: 'other@demo.clinic',
      phone: '03119999999',
      passwordHash,
      role: 'OWNER',
    },
  });
  await prisma.clinicSettings.upsert({
    where: { clinicId: otherClinic.id },
    update: {},
    create: {
      clinicId: otherClinic.id,
      clinicName: 'Other Clinic',
      consultationFee: 1000,
    },
  });

  const medicines = await Promise.all(
    [
      { name: 'Panadol', genericName: 'Paracetamol', strength: '500mg', form: 'Tablet', sellingPrice: 5, stockQuantity: 500 },
      { name: 'Brufen', genericName: 'Ibuprofen', strength: '400mg', form: 'Tablet', sellingPrice: 8, stockQuantity: 300 },
      { name: 'Cetirizine', genericName: 'Cetirizine', strength: '10mg', form: 'Tablet', sellingPrice: 6, stockQuantity: 200 },
      { name: 'Augmentin', genericName: 'Amoxicillin + Clavulanate', strength: '625mg', form: 'Tablet', sellingPrice: 45, stockQuantity: 80 },
    ].map((m, i) =>
      prisma.medicine.upsert({
        where: { id: `77777777-7777-7777-7777-77777777777${i}` },
        update: {},
        create: { id: `77777777-7777-7777-7777-77777777777${i}`, clinicId: clinic.id, unit: 'Tablet', ...m },
      }),
    ),
  );

  for (const medicine of medicines.slice(0, 3)) {
    await prisma.doctorFavoriteMedicine.upsert({
      where: { doctorId_medicineId: { doctorId: doctor.id, medicineId: medicine.id } },
      update: {},
      create: {
        clinicId: clinic.id,
        doctorId: doctor.id,
        medicineId: medicine.id,
        defaultDose: '1 tablet',
        defaultDoseQuantity: 1,
        defaultFrequency: '3 times/day',
        defaultFrequencyPerDay: 3,
        defaultDurationDays: 3,
      },
    });
  }

  const names = [
    ['Ahmed Khan', '03001234001', 29, Gender.MALE],
    ['Fatima Ali', '03001234002', 34, Gender.FEMALE],
    ['Usman Sheikh', '03001234003', 41, Gender.MALE],
    ['Ayesha Noor', '03001234004', 22, Gender.FEMALE],
    ['Bilal Hussain', '03001234005', 55, Gender.MALE],
    ['Sana Malik', '03001234006', 27, Gender.FEMALE],
    ['Hamza Iqbal', '03001234007', 18, Gender.MALE],
    ['Zainab Raza', '03001234008', 46, Gender.FEMALE],
    ['Omar Farooq', '03001234009', 38, Gender.MALE],
    ['Hira Shah', '03001234010', 31, Gender.FEMALE],
  ] as const;

  const patients: Array<{ id: string }> = [];
  for (let i = 0; i < names.length; i += 1) {
    const [name, phone, age, gender] = names[i];
    const patient = await prisma.patient.upsert({
      where: { clinicId_patientNumber: { clinicId: clinic.id, patientNumber: `P-${String(i + 1).padStart(6, '0')}` } },
      update: {},
      create: {
        clinicId: clinic.id,
        patientNumber: `P-${String(i + 1).padStart(6, '0')}`,
        name,
        phone,
        age,
        gender,
        address: 'Karachi',
      },
    });
    patients.push(patient);
  }

  const today = new Date(`${new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date())}T00:00:00.000Z`);
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  async function seedVisit(patientIndex: number, date: Date, tokenNumber: string, complaint: string, diagnosis: string, items: { medicineIndex: number; qty: number }[]) {
    const patient = patients[patientIndex];
    const token = await prisma.token.create({
      data: {
        clinicId: clinic.id,
        patientId: patient.id,
        doctorId: doctor.id,
        tokenNumber,
        tokenDate: date,
        status: TokenStatus.COMPLETED,
        calledAt: date,
        completedAt: date,
      },
    });
    const visit = await prisma.visit.create({
      data: {
        clinicId: clinic.id,
        patientId: patient.id,
        doctorId: doctor.id,
        tokenId: token.id,
        complaint,
        diagnosis,
        status: VisitStatus.COMPLETED,
        startedAt: date,
        completedAt: date,
      },
    });
    await prisma.token.update({ where: { id: token.id }, data: { visitId: visit.id } });
    const rx = await prisma.prescription.create({
      data: {
        clinicId: clinic.id,
        patientId: patient.id,
        visitId: visit.id,
        doctorId: doctor.id,
        prescriptionNumber: `RX-${String(patientIndex + 1).padStart(6, '0')}`,
        status: 'DISPENSED',
      },
    });
    for (const item of items) {
      const med = medicines[item.medicineIndex];
      await prisma.prescriptionItem.create({
        data: {
          prescriptionId: rx.id,
          medicineId: med.id,
          medicineNameSnapshot: med.name,
          genericNameSnapshot: med.genericName,
          strengthSnapshot: med.strength,
          formSnapshot: med.form,
          dose: '1 tablet',
          doseQuantity: 1,
          frequency: '3 times/day',
          frequencyPerDay: 3,
          durationDays: 1,
          quantity: item.qty,
        },
      });
    }
    return { patient, rx, visit };
  }

  const existingRx = await prisma.prescription.count({ where: { clinicId: clinic.id } });
  if (existingRx === 0) {
    await seedVisit(0, yesterday, '001', 'Fever, cough', 'Viral infection', [
      { medicineIndex: 0, qty: 3 },
      { medicineIndex: 2, qty: 1 },
    ]);
    await seedVisit(1, yesterday, '002', 'Body aches', 'Myalgia', [{ medicineIndex: 1, qty: 6 }]);
    await seedVisit(2, yesterday, '003', 'Sore throat', 'Pharyngitis', [{ medicineIndex: 3, qty: 10 }]);
  }

  console.log('Seeded Demo Family Clinic');
  console.log('Login: reception@demo.clinic / Demo1234!');
  void owner;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
