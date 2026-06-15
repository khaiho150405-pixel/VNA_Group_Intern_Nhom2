const ExcelJS = require('./BE/node_modules/exceljs');
const path = require('path');

async function generateTemplate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Import Doanh Nghiệp');

  // Define columns
  worksheet.columns = [
    { header: 'Tên doanh nghiệp*', key: 'name', width: 40 },
    { header: 'Mã số thuế*', key: 'taxCode', width: 20 },
    { header: 'Email*', key: 'email', width: 30 },
    { header: 'Mã loại hình*', key: 'loaiHinh', width: 20 },
    { header: 'Mã ngành nghề*', key: 'businessLine', width: 20 },
    { header: 'Tỉnh/Thành ĐKKD*', key: 'province', width: 20 },
    { header: 'Phường/Xã ĐKKD*', key: 'ward', width: 25 },
    { header: 'Địa chỉ ĐKKD*', key: 'address', width: 40 },
    { header: 'Tên nước ngoài', key: 'name2', width: 30 },
    { header: 'Ngày cấp GPKD (YYYY-MM-DD)', key: 'gpkdDate', width: 25 },
    { header: 'SĐT cơ quan', key: 'officePhone', width: 15 },
    { header: 'Tỉnh/TP hoạt động', key: 'opProvince', width: 20 },
    { header: 'Phường/Xã hoạt động', key: 'opWard', width: 25 },
    { header: 'Địa điểm kinh doanh', key: 'opAddress', width: 40 },
    { header: 'Người đứng đầu DN', key: 'headName', width: 30 },
    { header: 'SĐT người đứng đầu', key: 'headPhone', width: 20 },
  ];

  // Add sample data
  worksheet.addRow({
    name: 'Công ty Cổ phần Công nghệ Quốc tế VNA',
    taxCode: '9100008882',
    email: 'vna@gmail.com',
    loaiHinh: 'TNHH',
    businessLine: '4669',
    province: 'Thành phố Hồ Chí Minh',
    ward: 'Phường Hiệp Bình Phước',
    address: '162 đường số 2, khu đô thị Vạn Phúc',
    name2: 'VNA Group',
    gpkdDate: '2020-01-01',
    officePhone: '0281234567',
    opProvince: 'Thành phố Hồ Chí Minh',
    opWard: 'Phường Hiệp Bình Phước',
    opAddress: 'Vạn Phúc City',
    headName: 'Nguyễn Văn A',
    headPhone: '0912345678',
  });

  // Style header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  const filePath = path.join(process.cwd(), 'DoanhNghiep_Mau_Import.xlsx');
  await workbook.xlsx.writeFile(filePath);
  console.log(`Đã tạo file mẫu thành công tại: ${filePath}`);
}

generateTemplate().catch(console.error);
