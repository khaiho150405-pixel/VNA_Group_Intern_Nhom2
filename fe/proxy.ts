import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// NEXT.JS 16 BẮT BUỘC ĐỔI TÊN HÀM THÀNH proxy
export function proxy(request: NextRequest) { 
  const token = request.cookies.get('accessToken')?.value;
  // Pages that should be accessible without a token (auth-related screens)
  const unauthAllowed = ['/login', '/forgot-password'];
  const isAuthPage = unauthAllowed.some((p) => request.nextUrl.pathname.startsWith(p));

  // 1. Chặn người dùng chưa đăng nhập
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Chặn người đã đăng nhập quay lại màn hình login
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url)); 
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|static).*)'],
};