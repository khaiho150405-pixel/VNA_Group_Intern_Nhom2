"use client";
import React from 'react';
import ThemeProvider from '@core/contexts/ThemeProvider';
import { useLoginStyles } from '@tts/logic/login/style';

// 1. Tách ra một Component con. 
// Vì nó nằm dưới ThemeProvider nên hàm useLoginStyles sẽ lấy được theme an toàn!
const AuthLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const classes = useLoginStyles();

  return (
    <div className={classes.root}>
      {/* Bức ảnh tĩnh bên trái */}
      <div className={classes.imageSection}></div>

      {/* Khối form linh hoạt bên phải */}
      <div className={classes.formSection}>
        {children}
      </div>
    </div>
  );
};

// 2. Component Layout chính thức xuất ra cho Next.js
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        {/* Bọc ThemeProvider ở lớp ngoài cùng */}
        <ThemeProvider>
          <AuthLayoutContent>
            {children}
          </AuthLayoutContent>
        </ThemeProvider>
      </body>
    </html>
  );
}