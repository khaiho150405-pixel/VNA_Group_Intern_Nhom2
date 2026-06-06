import React from 'react';

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">
        Hệ thống Quản trị VNA Group
      </h1>
      <p className="text-gray-600">
        Đây là trang Dashboard. Bạn đang xem trang này vì đã đăng nhập thành công!
      </p>
    </div>
  );
}