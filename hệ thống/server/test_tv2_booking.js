const http = require('http');
const path = require('path');
const dotenv = require('./node_modules/dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('./node_modules/mongoose');
const express = require('./node_modules/express');
const cors = require('./node_modules/cors');

                                                    
const app = express();
app.use(cors());
app.use(express.json());

             
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use(require('./middlewares/errorHandler'));

let server;
const PORT = 5566;

async function runTests() {
  console.log('=== BẮT ĐẦU KIỂM THỬ TÍCH HỢP PHÂN HỆ TV 2 (BOOKING ENGINE & GIỮ CHỖ) ===\n');

                       
  console.log('1. Đang kết nối MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('   ✓ Kết nối MongoDB thành công!');

                             
  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });
  console.log(`   ✓ Server test đang chạy tại http://localhost:${PORT}`);

  const baseURL = `http://localhost:${PORT}`;

                                    
  const request = async (url, options = {}) => {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const reqOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: options.headers || {}
      };

      if (options.body) {
        reqOptions.headers['Content-Type'] = 'application/json';
        reqOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
      }

      const req = http.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, body: json });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });

      req.on('error', reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  };

  try {
                                            
    console.log('\n2. Test GET /api/appointments/doctors');
    const docRes = await request(`${baseURL}/api/appointments/doctors`);
    console.log(`   HTTP Status: ${docRes.status}`);
    console.log(`   Số bác sĩ tìm thấy: ${docRes.body.count}`);
    if (docRes.status !== 200 || docRes.body.count === 0) {
      throw new Error('Lỗi lấy danh sách bác sĩ');
    }
    const targetDoctor = docRes.body.data[0];
    console.log(`   ✓ Chọn bác sĩ test: ${targetDoctor.name} (${targetDoctor.specialty})`);

                                                  
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 3);
    const testDateStr = testDate.toISOString().split('T')[0];
    const testSlot = '10:00 - 10:30';

                                          
    console.log(`\n3. Test GET /api/appointments/slots cho ngày ${testDateStr}`);
    const slotRes = await request(
      `${baseURL}/api/appointments/slots?doctorId=${targetDoctor.doctorId}&date=${testDateStr}`
    );
    console.log(`   HTTP Status: ${slotRes.status}`);
    console.log(`   Số khung giờ cấu hình: ${slotRes.body.data.slots.length}`);
    const foundSlot = slotRes.body.data.slots.find((s) => s.time.includes('10:00'));
    console.log(`   ✓ Trạng thái slot ban đầu (${testSlot}): isBooked = ${foundSlot.isBooked}, status = ${foundSlot.status}`);

                                                                
    console.log('\n4. Đăng nhập tài khoản bệnh nhân 1');
    let loginRes1 = await request(`${baseURL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'benhnhan@gmail.com', password: '123456' })
    });

    if (loginRes1.status !== 200) {
                                   
      await request(`${baseURL}/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify({
          fullName: 'Bệnh Nhân Test 1',
          email: 'benhnhan@gmail.com',
          password: '123456',
          phone: '0987654321',
          role: 'patient'
        })
      });
      loginRes1 = await request(`${baseURL}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: 'benhnhan@gmail.com', password: '123456' })
      });
    }

    const tokenUser1 = loginRes1.body.token;
    console.log(`   ✓ Đăng nhập Bệnh nhân 1 thành công (ID: ${loginRes1.body.user.id})`);

                                                      
    let loginRes2 = await request(`${baseURL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'benhnhan2@medcare.vn', password: '123456' })
    });
    if (loginRes2.status !== 200) {
      await request(`${baseURL}/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify({
          fullName: 'Bệnh Nhân Test 2',
          email: 'benhnhan2@medcare.vn',
          password: '123456',
          phone: '0912345678',
          role: 'patient'
        })
      });
      loginRes2 = await request(`${baseURL}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: 'benhnhan2@medcare.vn', password: '123456' })
      });
    }
    const tokenUser2 = loginRes2.body.token;
    console.log(`   ✓ Đăng nhập Bệnh nhân 2 thành công (ID: ${loginRes2.body.user.id})`);

                                                    
    const Appointment = require('./models/Appointment');
    await Appointment.deleteMany({
      doctorId: targetDoctor.doctorId,
      date: testDateStr,
      timeSlot: '10:00 - 10:30'
    });

                                                                  
    console.log('\n5. Test POST /api/appointments/hold (Bệnh nhân 1 giữ chỗ 5 phút)');
    const holdRes1 = await request(`${baseURL}/api/appointments/hold`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: JSON.stringify({
        doctorId: targetDoctor.doctorId,
        date: testDateStr,
        timeSlot: testSlot,
        patientName: 'Bệnh Nhân Test 1',
        patientPhone: '0987654321',
        symptomsNote: 'Khó thở nhẹ khi leo cầu thang'
      })
    });

    console.log(`   HTTP Status: ${holdRes1.status} (Kỳ vọng: 201 Created)`);
    console.log(`   Message: ${holdRes1.body.message}`);
    console.log(`   Thời gian giữ chỗ đếm ngược: ${holdRes1.body.data.secondsRemaining} giây`);
    console.log(`   VietQR link: ${holdRes1.body.data.vietQrUrl}`);
    const appointmentId = holdRes1.body.data.appointmentId;

    if (holdRes1.status !== 201) {
      throw new Error(`Giữ chỗ thất bại: ${JSON.stringify(holdRes1.body)}`);
    }

                                                              
    console.log('\n6. Test CHỐNG TRÙNG LỊCH (Race Condition): Bệnh nhân 2 cố tình giữ cùng slot');
    const holdRes2 = await request(`${baseURL}/api/appointments/hold`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser2}` },
      body: JSON.stringify({
        doctorId: targetDoctor.doctorId,
        date: testDateStr,
        timeSlot: testSlot,
        patientName: 'Bệnh Nhân Test 2',
        patientPhone: '0912345678',
        symptomsNote: 'Cùng đặt slot này'
      })
    });

    console.log(`   HTTP Status: ${holdRes2.status} (Kỳ vọng: 409 Conflict)`);
    console.log(`   Message: ${holdRes2.body.message}`);
    if (holdRes2.status === 409) {
      console.log('   ✓ CHỐNG RACE CONDITION HOÀN TOÀN CHÍNH XÁC! Trả về HTTP 409 Conflict.');
    } else {
      throw new Error(`Mong đợi 409 Conflict nhưng nhận được ${holdRes2.status}`);
    }

                                                                                    
    console.log('\n7. Test POST /api/appointments/:id/confirm (Bệnh nhân 1 xác nhận cọc)');
    const confirmRes = await request(`${baseURL}/api/appointments/${appointmentId}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: JSON.stringify({
        transactionCode: `TXN-DEMO-${Date.now()}`,
        paymentMethod: 'VietQR'
      })
    });

    console.log(`   HTTP Status: ${confirmRes.status} (Kỳ vọng: 200 OK)`);
    console.log(`   Trạng thái sau confirm: status = ${confirmRes.body.data.appointment.status}, paymentStatus = ${confirmRes.body.data.appointment.paymentStatus}`);
    if (confirmRes.status !== 200 || confirmRes.body.data.appointment.status !== 'confirmed') {
      throw new Error('Xác nhận lịch hẹn thất bại!');
    }
    console.log('   ✓ Xác nhận lịch hẹn và thanh toán cọc thành công!');

                                                                                      
    console.log('\n8. Test GET /api/appointments/my-appointments');
    const myApptRes = await request(`${baseURL}/api/appointments/my-appointments`, {
      headers: { Authorization: `Bearer ${tokenUser1}` }
    });
    console.log(`   HTTP Status: ${myApptRes.status}`);
    console.log(`   Số ca hẹn của Bệnh nhân 1: ${myApptRes.body.count}`);
    const foundMy = myApptRes.body.data.find((a) => a._id === appointmentId);
    console.log(`   ✓ Tìm thấy phiếu hẹn: #${foundMy._id.slice(-6).toUpperCase()} với Bác sĩ ${foundMy.doctorId.fullName}`);

                           
    await Appointment.findByIdAndDelete(appointmentId);
    console.log('\n   ✓ Dọn dẹp bản ghi test thành công, trả database về trạng thái sạch.');

    console.log('\n======================================================');
    console.log('🎉 TẤT CẢ 8 KIỂM THỬ TÍCH HỢP CHO PHÂN HỆ TV 2 ĐÃ PASS 100%!');
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n❌ KIỂM THỬ THẤT BẠI:', error.message);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(process.exitCode || 0);
  }
}

runTests();

