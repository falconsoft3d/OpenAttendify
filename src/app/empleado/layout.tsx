'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function EmpleadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // No mostrar el layout en la página de login
  if (pathname === '/empleado/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700">
      {/* Navegación inferior */}
      <div className="pb-20">
        {children}
      </div>

      {/* Menú de navegación fijo en la parte inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around items-center h-16">
          <Link
            href="/empleado"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              pathname === '/empleado'
                ? 'text-blue-600'
                : 'text-gray-600'
            }`}
          >
            <svg
              className="w-6 h-6 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-xs font-medium">Inicio</span>
          </Link>

          <Link
            href="/empleado/historial"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              pathname === '/empleado/historial'
                ? 'text-blue-600'
                : 'text-gray-600'
            }`}
          >
            <svg
              className="w-6 h-6 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            <span className="text-xs font-medium">Historial</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
