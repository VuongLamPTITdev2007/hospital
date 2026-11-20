const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Specialty = require('./models/Specialty');
const DoctorProfile = require('./models/DoctorProfile');
const Review = require('./models/Review');

dotenv.config();

// 8 Chuyên khoa y tế phổ biến tại Hà Nội
const SPECIALTIES = [
  { name: 'Tim mạch', description: 'Chẩn đoán và điều trị tăng huyết áp, suy tim, bệnh mạch vành và can thiệp tim mạch.', icon: 'HeartPulse' },
  { name: 'Nhi khoa', description: 'Khám chữa bệnh lý sơ sinh, hô hấp, tiêu hóa và tư vấn dinh dưỡng toàn diện cho trẻ nhỏ.', icon: 'Baby' },
  { name: 'Cơ xương khớp', description: 'Điều trị thoái hóa khớp, thoát vị đĩa đệm, viêm khớp dạng thấp và chấn thương chỉnh hình.', icon: 'Bone' },
  { name: 'Tiêu hóa - Gan mật', description: 'Nội soi không đau, chẩn đoán ung thư sớm đường tiêu hóa, viêm gan virus và trào ngược dạ dày.', icon: 'Activity' },
  { name: 'Thần kinh', description: 'Điều trị đau nửa đầu Migraine, rối loạn tiền đình, mất ngủ mạn tính và di chứng đột quỵ.', icon: 'Brain' },
  { name: 'Da liễu', description: 'Khám chữa mụn trứng cá, viêm da cơ địa, vảy nến, sẹo rỗ và thẩm mỹ laser nội khoa.', icon: 'Sparkles' },
  { name: 'Sản phụ khoa', description: 'Khám thai định kỳ, sàng lọc dị tật trước sinh, phụ khoa tổng quát và tầm soát ung thư cổ tử cung.', icon: 'Users' },
  { name: 'Hô hấp - Phổi', description: 'Điều trị hen phế quản, COPD, viêm phổi, ho kéo dài và bệnh lý ngưng thở khi ngủ.', icon: 'Stethoscope' }
];

// Danh sách Bác sĩ đầu ngành uy tín tại các Bệnh viện lớn ở Hà Nội
const HANOI_DOCTORS = [
  {
    name: 'PGS.TS.BS. Nguyễn Lân Hiếu',
    email: 'lanhieu.nguyen@medcare.vn',
    phone: '0912111001',
    specialtyIndex: 0, // Tim mạch
    degree: 'Phó Giáo sư, Tiến sĩ, Bác sĩ Cao cấp',
    hospital: 'Bệnh viện Đại học Y Hà Nội (Số 1 Tôn Thất Tùng, Đống Đa)',
    consultationFee: 450000,
    experienceYears: 25,
    averageRating: 5.0,
    reviewCount: 215,
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=350&q=80',
    bio: 'Giám đốc Bệnh viện Đại học Y Hà Nội. Chuyên gia đầu ngành can thiệp tim bẩm sinh và tim mạch can thiệp tại Việt Nam với nhiều năm tu nghiệp tại Pháp và Mỹ.',
    workingDays: [1, 3, 5] // T2, T4, T6
  },
  {
    name: 'PGS.TS.BS. Nguyễn Tiến Dũng',
    email: 'tiendung.nguyen@medcare.vn',
    phone: '0912111002',
    specialtyIndex: 1, // Nhi khoa
    degree: 'Phó Giáo sư, Tiến sĩ Bác sĩ Nhi',
    hospital: 'Bệnh viện Bạch Mai (Số 78 Giải Phóng, Phương Mai, Đống Đa)',
    consultationFee: 350000,
    experienceYears: 32,
    averageRating: 4.9,
    reviewCount: 180,
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=350&q=80',
    bio: 'Nguyên Trưởng khoa Nhi - Bệnh viện Bạch Mai. Chuyên gia điều trị viêm phổi nặng, dị ứng, suy dinh dưỡng và kháng sinh đồ nhi khoa.',
    workingDays: [2, 4, 6] // T3, T5, T7
  },
  {
    name: 'PGS.TS.BS. Nguyễn Vĩnh Ngọc',
    email: 'vinhngoc.nguyen@medcare.vn',
    phone: '0912111003',
    specialtyIndex: 2, // Cơ xương khớp
    degree: 'Phó Giáo sư, Tiến sĩ Y khoa',
    hospital: 'Bệnh viện Bạch Mai & Đại học Y Hà Nội',
    consultationFee: 400000,
    experienceYears: 28,
    averageRating: 4.9,
    reviewCount: 164,
    avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=350&q=80',
    bio: 'Phó Chủ tịch Hội Thấp khớp học Hà Nội. Bác sĩ nổi tiếng về điều trị thoái hóa khớp gối, viêm cột sống dính khớp, gút và các bệnh lý tự miễn mô liên kết.',
    workingDays: [1, 2, 4, 5]
  },
  {
    name: 'GS.TS.BS. Đào Văn Long',
    email: 'vanlong.dao@medcare.vn',
    phone: '0912111004',
    specialtyIndex: 3, // Tiêu hóa
    degree: 'Giáo sư, Tiến sĩ Y học',
    hospital: 'Bệnh viện Đại học Y Hà Nội (Nguyên Giám đốc BV)',
    consultationFee: 500000,
    experienceYears: 35,
    averageRating: 5.0,
    reviewCount: 240,
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=350&q=80',
    bio: 'Nguyên Trưởng khoa Tiêu hóa BV Bạch Mai, Nguyên Giám đốc BV ĐH Y Hà Nội. Chuyên gia hàng đầu Việt Nam về tầm soát ung thư sớm dạ dày, đại tràng và điều trị HP kháng thuốc.',
    workingDays: [2, 4, 6]
  },
  {
    name: 'PGS.TS.BS. Nguyễn Văn Liệu',
    email: 'vanlieu.nguyen@medcare.vn',
    phone: '0912111005',
    specialtyIndex: 4, // Thần kinh
    degree: 'Phó Giáo sư, Bác sĩ Chuyên khoa Thần kinh',
    hospital: 'Bệnh viện Bạch Mai & Đại học Y Hà Nội',
    consultationFee: 400000,
    experienceYears: 30,
    averageRating: 4.8,
    reviewCount: 132,
    avatar: 'https://images.unsplash.com/photo-1594824813572-98e841753947?auto=format&fit=crop&w=350&q=80',
    bio: 'Chuyên gia đầu ngành về nội thần kinh. Chuyên khám chữa chứng đau nửa đầu, mất ngủ kéo dài, Parkinson, rối loạn tiền đình và thoái hóa hệ thần kinh trung ương.',
    workingDays: [1, 3, 5, 7]
  },
  {
    name: 'PGS.TS.BS. Phạm Thị Lan',
    email: 'thilan.pham@medcare.vn',
    phone: '0912111006',
    specialtyIndex: 5, // Da liễu
    degree: 'Phó Giáo sư, Tiến sĩ Da liễu',
    hospital: 'Bệnh viện Da liễu Trung ương (Số 15A Phương Mai, Đống Đa)',
    consultationFee: 350000,
    experienceYears: 22,
    averageRating: 4.9,
    reviewCount: 195,
    avatar: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=350&q=80',
    bio: 'Giảng viên cao cấp Bộ môn Da liễu Đại học Y Hà Nội, Chuyên gia Bệnh viện Da liễu TW. Thế mạnh điều trị mụn trứng cá nặng, viêm da cơ địa và thẩm mỹ nội khoa.',
    workingDays: [1, 2, 4, 6]
  },
  {
    name: 'PGS.TS.BS. Vũ Bá Quyết',
    email: 'baquyet.vu@medcare.vn',
    phone: '0912111007',
    specialtyIndex: 6, // Sản phụ khoa
    degree: 'Phó Giáo sư, Tiến sĩ Bác sĩ Sản phụ khoa',
    hospital: 'Bệnh viện Phụ sản Trung ương (Số 43 Tràng Thi, Hoàn Kiếm)',
    consultationFee: 450000,
    experienceYears: 34,
    averageRating: 5.0,
    reviewCount: 220,
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=350&q=80',
    bio: 'Nguyên Giám đốc Bệnh viện Phụ sản Trung ương. Chuyên gia phẫu thuật nội soi sản phụ khoa hàng đầu Việt Nam, điều trị u xơ tử cung, vô sinh hiếm muộn và thai kỳ nguy cơ cao.',
    workingDays: [2, 4, 5, 6]
  },
  {
    name: 'PGS.TS.BS. Chu Thị Hạnh',
    email: 'thihanh.chu@medcare.vn',
    phone: '0912111008',
    specialtyIndex: 7, // Hô hấp
    degree: 'Phó Giáo sư, Tiến sĩ Bác sĩ Hô hấp',
    hospital: 'Trung tâm Hô hấp - Bệnh viện Bạch Mai',
    consultationFee: 380000,
    experienceYears: 26,
    averageRating: 4.8,
    reviewCount: 110,
    avatar: 'https://images.unsplash.com/photo-1594824813572-98e841753947?auto=format&fit=crop&w=350&q=80',
    bio: 'Phó Chủ tịch Hội Hô hấp Việt Nam, Phó Giám đốc Trung tâm Hô hấp BV Bạch Mai. Chuyên gia điều trị hen phế quản, COPD, giãn phế quản và bệnh phổi mô kẽ.',
    workingDays: [1, 3, 5]
  }
];

const DEFAULT_SLOTS = [
  '08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '09:30 - 10:00',
  '14:00 - 14:30', '14:30 - 15:00', '15:00 - 15:30', '15:30 - 16:00'
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medcare_db';
    console.log(`Connecting to MongoDB: ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('Clearing old Specialties and DoctorProfiles...');
    await Specialty.deleteMany({});
    await DoctorProfile.deleteMany({});

    console.log('Creating Specialties...');
    const createdSpecialties = await Specialty.insertMany(SPECIALTIES);
    console.log(`Created ${createdSpecialties.length} specialties.`);

    console.log('Creating Hanoi Doctors...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123456', salt);

    for (const doc of HANOI_DOCTORS) {
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

    console.log('Successfully seeded 8 top-tier Hanoi Doctors into MongoDB!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDB();
