const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Specialty = require('./models/Specialty');
const DoctorProfile = require('./models/DoctorProfile');
const Review = require('./models/Review');

dotenv.config();

const SPECIALTIES = [
  { name: 'Tim mạch', description: 'Chẩn đoán và điều trị tăng huyết áp, rối loạn nhịp tim, suy tim và bệnh động mạch vành.', icon: 'HeartPulse' },
  { name: 'Nhi khoa', description: 'Chăm sóc sức khỏe toàn diện, tiêm chủng và điều trị bệnh lý cho trẻ sơ sinh và trẻ nhỏ.', icon: 'Baby' },
  { name: 'Cơ xương khớp', description: 'Điều trị thoái hóa khớp, thoát vị đĩa đệm, loãng xương và chấn thương thể thao.', icon: 'Bone' },
  { name: 'Thần kinh', description: 'Khám và điều trị đau nửa đầu, mất ngủ, tai biến mạch máu não và rối loạn tiền đình.', icon: 'Brain' },
  { name: 'Tiêu hóa', description: 'Chuyên khoa dạ dày, tá tràng, đại tràng, gan mật và nội soi tiêu hóa.', icon: 'Activity' },
  { name: 'Da liễu', description: 'Khám chữa viêm da dị ứng, mụn trứng cá, vảy nến và chăm sóc thẩm mỹ da chuyên sâu.', icon: 'Sparkles' }
];

const DOCTOR_DATA = [
  {
    name: 'BSCKII. Nguyễn Văn An',
    email: 'doctor.an@medcare.vn',
    phone: '0981234561',
    specialtyIndex: 0, // Tim mạch
    degree: 'Bác sĩ Chuyên khoa II',
    hospital: 'Bệnh viện Bạch Mai - MedCare Clinic',
    consultationFee: 350000,
    experienceYears: 18,
    averageRating: 4.9,
    reviewCount: 142,
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80',
    bio: 'Nguyên Phó Trưởng khoa Tim mạch Viện Tim Hà Nội. Chuyên gia đầu ngành trong điều trị tăng huyết áp vô căn và rối loạn nhịp tim.',
    workingDays: [1, 3, 5] // T2, T4, T6
  },
  {
    name: 'ThS.BS. Trần Thị Mai',
    email: 'doctor.mai@medcare.vn',
    phone: '0981234562',
    specialtyIndex: 1, // Nhi khoa
    degree: 'Thạc sĩ Bác sĩ Nhi',
    hospital: 'Bệnh viện Nhi Trung Ương',
    consultationFee: 300000,
    experienceYears: 12,
    averageRating: 5.0,
    reviewCount: 98,
    avatar: 'https://images.unsplash.com/photo-1594824813572-98e841753947?auto=format&fit=crop&w=300&q=80',
    bio: 'Bác sĩ tận tâm với hơn 12 năm kinh nghiệm khám chữa các bệnh lý đường hô hấp, tiêu hóa và tư vấn dinh dưỡng cho trẻ nhỏ.',
    workingDays: [2, 4, 6] // T3, T5, T7
  },
  {
    name: 'TS.BS. Lê Hoàng Nam',
    email: 'doctor.nam@medcare.vn',
    phone: '0981234563',
    specialtyIndex: 2, // Cơ xương khớp
    degree: 'Tiến sĩ Y khoa',
    hospital: 'Viện Chấn thương Chỉnh hình',
    consultationFee: 400000,
    experienceYears: 20,
    averageRating: 4.8,
    reviewCount: 76,
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=300&q=80',
    bio: 'Từng tu nghiệp chuyên sâu tại Pháp về phẫu thuật nội soi khớp và phục hồi chức năng vận động cho bệnh nhân thoái hóa.',
    workingDays: [1, 2, 3, 4, 5]
  },
  {
    name: 'BSCKI. Vũ Phương Linh',
    email: 'doctor.linh@medcare.vn',
    phone: '0981234564',
    specialtyIndex: 3, // Thần kinh
    degree: 'Bác sĩ Chuyên khoa I',
    hospital: 'Bệnh viện Đại học Y Hà Nội',
    consultationFee: 320000,
    experienceYears: 10,
    averageRating: 4.9,
    reviewCount: 54,
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80',
    bio: 'Chuyên gia điều trị các hội chứng đau đầu mạn tính, rối loạn giấc ngủ, suy nhược thần kinh và di chứng hậu đột quỵ.',
    workingDays: [1, 3, 6]
  },
  {
    name: 'ThS.BS. Đặng Quốc Toàn',
    email: 'doctor.toan@medcare.vn',
    phone: '0981234565',
    specialtyIndex: 4, // Tiêu hóa
    degree: 'Thạc sĩ Nội soi Tiêu hóa',
    hospital: 'Bệnh viện Hữu nghị Việt Đức',
    consultationFee: 350000,
    experienceYears: 15,
    averageRating: 4.7,
    reviewCount: 88,
    avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=300&q=80',
    bio: 'Bác sĩ có thế mạnh trong chẩn đoán sớm ung thư đường tiêu hóa, điều trị loét dạ dày HP kháng thuốc và viêm đại tràng co thắt.',
    workingDays: [2, 4, 5, 7]
  },
  {
    name: 'BSCKI. Hoàng Mỹ Duyên',
    email: 'doctor.duyen@medcare.vn',
    phone: '0981234566',
    specialtyIndex: 5, // Da liễu
    degree: 'Bác sĩ Chuyên khoa Da liễu',
    hospital: 'Bệnh viện Da liễu TW - MedCare',
    consultationFee: 280000,
    experienceYears: 8,
    averageRating: 4.9,
    reviewCount: 112,
    avatar: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=300&q=80',
    bio: 'Chuyên khoa thẩm mỹ nội khoa, điều trị mụn trứng cá chuyên sâu, sẹo rỗ, nám da và các bệnh lý dị ứng tự miễn.',
    workingDays: [1, 2, 4, 6]
  }
];

const DEFAULT_SLOTS = [
  '08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '09:30 - 10:00',
  '14:00 - 14:30', '14:30 - 15:00', '15:00 - 15:30', '15:30 - 16:00'
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medcare_db';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('Clearing old Specialties and DoctorProfiles...');
    await Specialty.deleteMany({});
    await DoctorProfile.deleteMany({});

    console.log('Creating Specialties...');
    const createdSpecialties = await Specialty.insertMany(SPECIALTIES);
    console.log(`Created ${createdSpecialties.length} specialties.`);

    console.log('Creating Doctors...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123456', salt);

    for (const doc of DOCTOR_DATA) {
      // Tìm hoặc tạo tài khoản User
      let user = await User.findOne({ email: doc.email });
      if (!user) {
        user = await User.create({
          fullName: doc.name,
          email: doc.email,
          password: passwordHash,
          phone: doc.phone,
          role: 'doctor',
          avatar: doc.avatar
        });
      }

      const assignedSpec = createdSpecialties[doc.specialtyIndex];

      const workingHours = doc.workingDays.map(day => ({
        dayOfWeek: day,
        slots: DEFAULT_SLOTS
      }));

      await DoctorProfile.create({
        userId: user._id,
        specialtyId: assignedSpec._id,
        degree: doc.degree,
        consultationFee: doc.consultationFee,
        experienceYears: doc.experienceYears,
        hospital: doc.hospital,
        bio: doc.bio,
        averageRating: doc.averageRating,
        reviewCount: doc.reviewCount,
        workingHours
      });
    }

    console.log('All Doctor Profiles seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDB();
