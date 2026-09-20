import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { SuccessInterceptor } from '../src/common/interceptors/success.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';

const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDb('ClinicFlow workflows (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let receptionToken: string;
  let doctorToken: string;
  let otherToken: string;
  let clinicId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new SuccessInterceptor());
    await app.init();
    prisma = app.get(PrismaService);

    const login = async (identifier: string) => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ identifier, password: 'Demo1234!' })
        .expect(201);
      return res.body.data;
    };
    const reception = await login('reception@demo.clinic');
    const doctor = await login('doctor@demo.clinic');
    const other = await login('other@demo.clinic');
    receptionToken = reception.accessToken;
    doctorToken = doctor.accessToken;
    otherToken = other.accessToken;
    clinicId = reception.user.clinicId;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('creates patient → token → consultation → prescription → dispense → payment', async () => {
    const patientRes = await request(app.getHttpServer())
      .post('/api/patients')
      .set('Authorization', `Bearer ${receptionToken}`)
      .send({ name: 'E2E Patient', phone: '03005550101', age: 30, gender: 'MALE' })
      .expect(201);
    const patient = patientRes.body.data;

    const tokenRes = await request(app.getHttpServer())
      .post('/api/tokens')
      .set('Authorization', `Bearer ${receptionToken}`)
      .send({ patientId: patient.id })
      .expect(201);
    const token = tokenRes.body.data;
    expect(token.tokenNumber).toBeDefined();
    expect(token.visit).toBeDefined();

    await request(app.getHttpServer())
      .post(`/api/visits/${token.visit.id}/start`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(201);

    const medicines = await request(app.getHttpServer())
      .get('/api/medicines')
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(200);
    const panadol = medicines.body.data.find((m: { name: string }) => m.name === 'Panadol');

    const rx = await request(app.getHttpServer())
      .post(`/api/prescriptions/visits/${token.visit.id}/send`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        complaint: 'Fever',
        diagnosis: 'Viral',
        items: [
          {
            medicineId: panadol.id,
            dose: '1 tablet',
            doseQuantity: 1,
            frequency: '3 times/day',
            frequencyPerDay: 3,
            durationDays: 1,
          },
        ],
      })
      .expect(201);
    expect(rx.body.data.status).toBe('READY');

    const ready = await request(app.getHttpServer())
      .get('/api/dispensing/ready')
      .set('Authorization', `Bearer ${receptionToken}`)
      .expect(200);
    const pending = ready.body.data.find(
      (d: { prescriptionId: string }) => d.prescriptionId === rx.body.data.id,
    );
    expect(pending).toBeDefined();

    await request(app.getHttpServer())
      .post(`/api/dispensing/${pending.id}/complete`)
      .set('Authorization', `Bearer ${receptionToken}`)
      .send({ paymentMethod: 'CASH', consultationAmount: 1500 })
      .expect(201);
  });

  it('repeats previous medicines without creating a token or visit', async () => {
    const patients = await request(app.getHttpServer())
      .get('/api/patients?q=Ahmed Khan')
      .set('Authorization', `Bearer ${receptionToken}`)
      .expect(200);
    const patient = patients.body.data[0];
    const visitsBefore = await prisma.visit.count({
      where: { clinicId, patientId: patient.id },
    });
    const tokensBefore = await prisma.token.count({
      where: { clinicId, patientId: patient.id },
    });

    const latest = await request(app.getHttpServer())
      .get(`/api/prescriptions/latest?patientId=${patient.id}`)
      .set('Authorization', `Bearer ${receptionToken}`)
      .expect(200);

    const repeat = await request(app.getHttpServer())
      .post('/api/dispensing/repeat')
      .set('Authorization', `Bearer ${receptionToken}`)
      .send({
        patientId: patient.id,
        prescriptionId: latest.body.data.id,
        itemIds: latest.body.data.items.map((i: { id: string }) => i.id),
        paymentMethod: 'CASH',
      })
      .expect(201);

    expect(repeat.body.data.requiresApproval).toBe(false);
    expect(repeat.body.data.dispensing.type).toBe('REPEAT');
    expect(repeat.body.data.dispensing.payments.length).toBeGreaterThan(0);

    const visitsAfter = await prisma.visit.count({
      where: { clinicId, patientId: patient.id },
    });
    const tokensAfter = await prisma.token.count({
      where: { clinicId, patientId: patient.id },
    });
    expect(visitsAfter).toBe(visitsBefore);
    expect(tokensAfter).toBe(tokensBefore);
  });

  it('blocks another clinic from reading this clinic’s patient', async () => {
    const patients = await request(app.getHttpServer())
      .get('/api/patients?q=Ahmed Khan')
      .set('Authorization', `Bearer ${receptionToken}`)
      .expect(200);
    const patientId = patients.body.data[0].id;
    await request(app.getHttpServer())
      .get(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);
  });
});
