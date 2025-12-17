'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function EmpleadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [documentosFaltantes, setDocumentosFaltantes] = useState(0);
  const [informacionesNuevas, setInformacionesNuevas] = useState(0);

  useEffect(() => {
    // Cargar el conteo de documentos faltantes e informaciones nuevas
    if (pathname !== '/empleado/login') {
      cargarDocumentosFaltantes();
      cargarInformacionesNuevas();
    }
  }, [pathname]);

  const cargarDocumentosFaltantes = async () => {
    try {
      const response = await fetch('/api/empleado/tipos-documentacion', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        // Contar tipos que no tienen documento o están vencidos
        const faltantes = data.filter((tipo: any) => {
          if (!tipo.tiene) return true;
          if (tipo.documentoActual) {
            const vencido = new Date(tipo.documentoActual.fechaVencimiento) < new Date();
            return vencido;
          }
          return false;
        }).length;
        setDocumentosFaltantes(faltantes);
      }
    } catch (error) {
      console.error('Error al cargar documentos faltantes:', error);
    }
  };

  const cargarInformacionesNuevas = async () => {
    try {
      const response = await fetch('/api/empleado/informaciones', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const ahora = new Date();
        const tresDiasAtras = new Date(ahora.getTime() - 3 * 24 * 60 * 60 * 1000);
        
        // Contar informaciones creadas en los últimos 3 días
        const nuevas = data.informaciones.filter((info: any) => {
          const fechaCreacion = new Date(info.createdAt);
          return fechaCreacion >= tresDiasAtras;
        }).length;
        
        setInformacionesNuevas(nuevas);
      }
    } catch (error) {
      console.error('Error al cargar informaciones nuevas:', error);
    }
  };

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

          <Link
            href="/empleado/solicitudes"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              pathname === '/empleado/solicitudes'
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-xs font-medium">Solicitudes</span>
          </Link>

          <Link
            href="/empleado/informaciones"
            className={`flex flex-col items-center justify-center flex-1 h-full relative ${
              pathname === '/empleado/informaciones'
                ? 'text-blue-600'
                : 'text-gray-600'
            }`}
          >
            {informacionesNuevas > 0 && (
              <span className="absolute top-1 right-3 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {informacionesNuevas}
              </span>
            )}
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xs font-medium">Información</span>
          </Link>

          <Link
            href="/empleado/documentacion"
            className={`flex flex-col items-center justify-center flex-1 h-full relative ${
              pathname === '/empleado/documentacion'
                ? 'text-blue-600'
                : 'text-gray-600'
            }`}
          >
            {documentosFaltantes > 0 && (
              <span className="absolute top-1 right-3 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {documentosFaltantes}
              </span>
            )}
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-xs font-medium">Documentos</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
