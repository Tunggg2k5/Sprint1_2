import "dotenv/config";
import bcrypt from "bcryptjs";
import { closeMongoDB, connectMongoDB, getCollection, toObjectId } from "./config/mongodb.js";
import { COLLECTIONS } from "./models/collections.js";
import * as publicRepository from "./repositories/publicRepository.js";

const seedKey = "training-seed";

function clinicDate(daysFromToday, hour) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function upsertUser(phone, data) {
  const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : data.passwordHash;
  const document = {
    ...data,
    phone,
    email: data.email || `${phone}@training.local`,
    status: data.status || "active",
    passwordHash,
    seedKey,
    updatedAt: new Date()
  };
  delete document.password;

  return getCollection(COLLECTIONS.users).findOneAndUpdate(
    { phone },
    { $set: document, $setOnInsert: { createdAt: new Date() } },
    { upsert: true, returnDocument: "after" }
  );
}

async function upsertByName(collectionName, name, data) {
  return getCollection(collectionName).findOneAndUpdate(
    { name },
    { $set: { ...data, name, seedKey, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true, returnDocument: "after" }
  );
}

function publicUser(user) {
  return {
    _id: user._id,
    fullName: user.fullName,
    phone: user.phone,
    avatarUrl: user.avatarUrl || "",
    yearsOfExperience: user.yearsOfExperience,
    bio: user.bio
  };
}

function serviceSnapshot(service) {
  return {
    _id: service._id,
    name: service.name,
    description: service.description
  };
}

function roomSnapshot(room) {
  return {
    _id: room._id,
    name: room.name,
    assignedDentist: room.assignedDentist,
    assignedNurse: room.assignedNurse
  };
}

async function seed() {
  await connectMongoDB();

  const patient = await upsertUser("0911000001", {
    fullName: "Nguyễn Văn An",
    role: "patient",
    gender: "male",
    address: "TP. Hồ Chí Minh",
    bio: "Bệnh nhân demo cho Sprint 1 và Sprint 2.",
    avatarUrl: "",
    password: "Password123!"
  });

  const receptionist = await upsertUser("0901000001", {
    fullName: "Nguyễn Thị Mai Linh",
    role: "receptionist",
    gender: "female",
    address: "SmileCare",
    bio: "Lễ tân hỗ trợ bệnh nhân.",
    avatarUrl: "",
    password: "Password123!"
  });

  const dentists = await Promise.all([
    upsertUser("0902000001", {
      fullName: "BS. Nguyễn Minh Anh",
      role: "dentist",
      yearsOfExperience: 9,
      qualification: "Bác sĩ Răng Hàm Mặt",
      bio: "Có kinh nghiệm thăm khám, tư vấn kế hoạch điều trị và theo dõi tiến trình chăm sóc răng miệng cho bệnh nhân.",
      avatarUrl: "src/assets/doctor-minh-anh.png",
      password: "Password123!"
    }),
    upsertUser("0902000002", {
      fullName: "BS. Trần Hoàng Nam",
      role: "dentist",
      yearsOfExperience: 12,
      qualification: "Bác sĩ Răng Hàm Mặt",
      bio: "Phụ trách thăm khám, tư vấn phương án điều trị phù hợp và phối hợp cùng đội ngũ lâm sàng trong từng ca khám.",
      avatarUrl: "src/assets/doctor-hoang-nam.png",
      password: "Password123!"
    }),
    upsertUser("0902000003", {
      fullName: "BS. Lê Thanh Vy",
      role: "dentist",
      yearsOfExperience: 7,
      qualification: "Bác sĩ Răng Hàm Mặt",
      bio: "Tập trung vào trải nghiệm thăm khám nhẹ nhàng, giải thích rõ kế hoạch điều trị và hướng dẫn chăm sóc sau khám.",
      avatarUrl: "src/assets/doctor-thanh-vy.png",
      password: "Password123!"
    })
  ]);

  const services = await Promise.all([
    upsertByName(COLLECTIONS.services, "Cạo vôi răng", {
      description: "Làm sạch mảng bám, vôi răng và hướng dẫn vệ sinh răng miệng.",
      isActive: true
    }),
    upsertByName(COLLECTIONS.services, "Trám răng", {
      description: "Phục hồi vùng răng tổn thương và hướng dẫn chăm sóc sau điều trị.",
      isActive: true
    }),
    upsertByName(COLLECTIONS.services, "Tẩy trắng răng", {
      description: "Cải thiện màu răng theo tình trạng thực tế và chỉ định chuyên môn.",
      isActive: true
    }),
    upsertByName(COLLECTIONS.services, "Nhổ răng khôn", {
      description: "Thăm khám, chẩn đoán và thực hiện nhổ răng theo chỉ định của bác sĩ.",
      isActive: true
    })
  ]);

  const nurses = [
    { _id: "nurse-1", fullName: "Y tá 1", phone: "0903000001" },
    { _id: "nurse-2", fullName: "Y tá 2", phone: "0903000002" },
    { _id: "nurse-3", fullName: "Y tá 3", phone: "0903000003" }
  ];

  const rooms = await Promise.all([
    upsertByName(COLLECTIONS.rooms, "Phòng khám 1", {
      roomType: "Phòng điều trị nha khoa",
      description: "Phòng điều trị được trang bị cho quy trình vận hành SmileCare.",
      assignedDentist: publicUser(dentists[0]),
      assignedNurse: nurses[0],
      status: "available",
      isActive: true
    }),
    upsertByName(COLLECTIONS.rooms, "Phòng khám 2", {
      roomType: "Phòng điều trị nha khoa",
      description: "Phòng điều trị được trang bị cho quy trình vận hành SmileCare.",
      assignedDentist: publicUser(dentists[1]),
      assignedNurse: nurses[1],
      status: "available",
      isActive: true
    }),
    upsertByName(COLLECTIONS.rooms, "Phòng khám 3", {
      roomType: "Phòng điều trị nha khoa",
      description: "Phòng điều trị được trang bị cho quy trình vận hành SmileCare.",
      assignedDentist: publicUser(dentists[2]),
      assignedNurse: nurses[2],
      status: "available",
      isActive: true
    })
  ]);

  await publicRepository.upsertPublicClinic({
    clinicName: "SmileCare",
    hotline: "0901000001",
    receptionist: publicUser(receptionist),
    receptionistPhone: receptionist.phone,
    address: "150 Hai Bà Trưng, Quận 1, TP. Hồ Chí Minh",
    branches: [
      {
        id: "smilecare-q1",
        province: "TP. Hồ Chí Minh",
        branch: "SmileCare Quận 1 - 150 Hai Bà Trưng"
      }
    ],
    faqs: [
      {
        question: "Tôi có thể thay đổi lịch hẹn sau khi đặt không?",
        answer: "Bạn có thể thay đổi bác sĩ, ngày hoặc slot khám. Lịch thay đổi sẽ được gửi lại cho lễ tân xác nhận."
      },
      {
        question: "Nếu tôi không chọn bác sĩ thì sao?",
        answer: "Lễ tân sẽ sắp xếp bác sĩ và gửi thời gian khám đã xác nhận cho bạn."
      },
      {
        question: "Tôi cần làm gì khi quên mật khẩu?",
        answer: "Vui lòng sử dụng mục Quên mật khẩu để xem số điện thoại lễ tân và liên hệ hỗ trợ."
      }
    ]
  });

  await Promise.all([
    getCollection(COLLECTIONS.notifications).deleteMany({ user: patient._id }),
    getCollection(COLLECTIONS.appointments).deleteMany({ patient: patient._id }),
    getCollection(COLLECTIONS.invoices).deleteMany({ patient: patient._id }),
    getCollection(COLLECTIONS.treatmentRecords).deleteMany({ patient: patient._id }),
    getCollection(COLLECTIONS.treatmentPlans).deleteMany({ patient: patient._id }),
    getCollection(COLLECTIONS.reviews).deleteMany({
      $or: [
        { seedKey },
        { patient: patient._id },
        { "patient._id": patient._id }
      ]
    })
  ]);

  const appointmentBase = {
    patient: patient._id,
    patientInfo: publicUser(patient),
    seedKey
  };

  const scheduledAppointment = await getCollection(COLLECTIONS.appointments).insertOne({
    ...appointmentBase,
    service: serviceSnapshot(services[0]),
    room: null,
    dentist: null,
    dentistPreference: "random",
    startAt: clinicDate(3, 8),
    patientNote: "Khám định kỳ.",
    channel: "Online",
    status: "scheduled",
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const completedAppointment = await getCollection(COLLECTIONS.appointments).insertOne({
    ...appointmentBase,
    service: serviceSnapshot(services[1]),
    room: roomSnapshot(rooms[0]),
    dentist: publicUser(dentists[0]),
    dentistPreference: "selected",
    startAt: clinicDate(-2, 10),
    patientNote: "Trám răng sâu nhẹ.",
    channel: "Online",
    status: "completed",
    createdAt: clinicDate(-5, 8),
    updatedAt: new Date()
  });

  const completedAppointmentDoc = {
    _id: completedAppointment.insertedId,
    service: serviceSnapshot(services[1]),
    room: roomSnapshot(rooms[0]),
    dentist: publicUser(dentists[0]),
    startAt: clinicDate(-2, 10),
    status: "completed"
  };

  await getCollection(COLLECTIONS.invoices).insertOne({
    patient: patient._id,
    appointment: completedAppointmentDoc,
    total: 450000,
    paidAmount: 200000,
    status: "partial",
    invoiceDate: new Date(),
    seedKey,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const treatmentRecord = await getCollection(COLLECTIONS.treatmentRecords).insertOne({
    patient: patient._id,
    appointment: completedAppointmentDoc,
    dentist: publicUser(dentists[0]),
    diagnosis: "Răng hàm có lỗ sâu nhỏ.",
    treatmentResult: "Đã làm sạch và trám phục hồi.",
    treatmentPlan: "Tái khám sau 6 tháng để kiểm tra miếng trám.",
    seedKey,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  await getCollection(COLLECTIONS.treatmentPlans).insertOne({
    patient: patient._id,
    treatmentRecord: {
      _id: treatmentRecord.insertedId,
      appointment: completedAppointmentDoc
    },
    dentist: publicUser(dentists[0]),
    planDetail: "Theo dõi vùng răng đã trám, vệ sinh răng miệng định kỳ và tái khám đúng hẹn.",
    estimatedCost: 0,
    status: "active",
    seedKey,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  await Promise.all([
    getCollection(COLLECTIONS.reviews).insertOne({
      appointment: completedAppointment.insertedId,
      patient: publicUser(patient),
      dentist: publicUser(dentists[0]),
      service: serviceSnapshot(services[1]),
      rating: 5,
      ratingDentist: 5,
      ratingService: 5,
      comment: "Bác sĩ tư vấn rõ ràng, thao tác nhẹ nhàng.",
      seedKey,
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    getCollection(COLLECTIONS.reviews).insertOne({
      appointment: toObjectId("6a2edfd0202d314004c5a2c7"),
      patient: { fullName: "Trần Thị Bình" },
      dentist: publicUser(dentists[1]),
      service: serviceSnapshot(services[0]),
      rating: 4,
      ratingDentist: 5,
      ratingService: 4,
      comment: "Quy trình nhanh và nhân viên hỗ trợ tốt.",
      seedKey,
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    getCollection(COLLECTIONS.reviews).insertOne({
      appointment: toObjectId("6a2edfd0202d314004c5a2c8"),
      patient: { fullName: "Lê Minh Châu" },
      dentist: publicUser(dentists[2]),
      service: serviceSnapshot(services[2]),
      rating: 5,
      ratingDentist: 5,
      ratingService: 5,
      comment: "Kết quả tốt và được hướng dẫn chăm sóc kỹ.",
      seedKey,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  ]);

  await getCollection(COLLECTIONS.notifications).insertOne({
    user: patient._id,
    title: "Chào mừng đến với SmileCare",
    message: "Đây là thông báo chưa đọc dùng để test Sprint 1 và giao diện bệnh nhân.",
    isRead: false,
    seedKey,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  await closeMongoDB();
  console.log("Seed done. Patient login: 0911000001 / Password123!");
  console.log(`Created sample appointment: ${scheduledAppointment.insertedId.toString()}`);
}

seed().catch(async (error) => {
  console.error(error);
  await closeMongoDB();
  process.exit(1);
});
