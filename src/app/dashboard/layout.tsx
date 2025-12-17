'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface User {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  avatarUrl?: string | null;
}

interface Counts {
  empresas: number;
  empleados: number;
  asistencias: number;
  usuarios: number;
  proyectos: number;
  solicitudes: number;
  informaciones: number;
  documentaciones: number;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Counts>({
    empresas: 0,
    empleados: 0,
    asistencias: 0,
    usuarios: 0,
    proyectos: 0,
    solicitudes: 0,
    informaciones: 0,
    documentaciones: 0,
  });

  useEffect(() => {
    checkAuth();
    loadCounts();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadCounts = async () => {
    try {
      const [empresasRes, empleadosRes, asistenciasRes, usuariosRes, proyectosRes, solicitudesRes, informacionesRes, documentacionesRes] = await Promise.all([
        fetch('/api/empresas'),
        fetch('/api/empleados'),
        fetch('/api/asistencias'),
        fetch('/api/usuarios'),
        fetch('/api/proyectos', { credentials: 'include' }),
        fetch('/api/solicitudes', { credentials: 'include' }),
        fetch('/api/informaciones', { credentials: 'include' }),
        fetch('/api/documentaciones', { credentials: 'include' }),
      ]);

      const [empresas, empleados, asistencias, usuarios, proyectos, solicitudes, informaciones, documentaciones] = await Promise.all([
        empresasRes.json(),
        empleadosRes.json(),
        asistenciasRes.json(),
        usuariosRes.json(),
        proyectosRes.json(),
        solicitudesRes.json(),
        informacionesRes.json(),
        documentacionesRes.json(),
      ]);

      setCounts({
        empresas: empresas.length || 0,
        empleados: empleados.length || 0,
        asistencias: asistencias.length || 0,
        usuarios: usuarios.length || 0,
        proyectos: proyectos.length || 0,
        solicitudes: solicitudes.solicitudes?.length || 0,
        informaciones: informaciones.informaciones?.length || 0,
        documentaciones: documentaciones.length || 0,
      });
    } catch (error) {
      console.error('Error cargando contadores:', error);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg fixed h-full">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b">
            <Link href="/dashboard" className="text-2xl font-bold text-primary-600">
              OpenAttendify
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <Link
              href="/dashboard"
              className="flex items-center space-x-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 px-4 py-3 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-medium">Dashboard</span>
            </Link>

            <Link
              href="/dashboard/empresas"
              className="flex items-center space-x-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 px-4 py-3 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="font-medium">Empresas</span>
              {counts.empresas > 0 && (
                <span className="ml-auto bg-primary-100 text-primary-600 text-xs font-semibold px-2 py-1 rounded-full">
                  {counts.empresas}
                </span>
              )}
            </Link>

            <Link
              href="/dashboard/empleados"
              className="flex items-center space-x-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 px-4 py-3 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="font-medium">Empleados</span>
              {counts.empleados > 0 && (
                <span className="ml-auto bg-primary-100 text-primary-600 text-xs font-semibold px-2 py-1 rounded-full">
                  {counts.empleados}
                </span>
              )}
            </Link>

            <Link
              href="/dashboard/proyectos"
              className="flex items-center space-x-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 px-4 py-3 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium">Proyectos</span>
              {counts.proyectos > 0 && (
                <span className="ml-auto bg-primary-100 text-primary-600 text-xs font-semibold px-2 py-1 rounded-full">
                  {counts.proyectos}
                </span>
              )}
            </Link>

            <Link
              href="/dashboard/asistencias"
              className="flex items-center space-x-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 px-4 py-3 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="font-medium">Asistencias</span>
              {counts.asistencias > 0 && (
                <span className="ml-auto bg-primary-100 text-primary-600 text-xs font-semibold px-2 py-1 rounded-full">
                  {counts.asistencias}
                </span>
              )}
            </Link>

            <Link
              href="/dashboard/solicitudes"
              className="flex items-center space-x-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 px-4 py-3 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium">Solicitudes</span>
              {counts.solicitudes > 0 && (
                <span className="ml-auto bg-primary-100 text-primary-600 text-xs font-semibold px-2 py-1 rounded-full">
                  {counts.solicitudes}
                </span>
              )}
            </Link>

            <Link
              href="/dashboard/informaciones"
              className="flex items-center space-x-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 px-4 py-3 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Informaciones</span>
              {counts.informaciones > 0 && (
                <span className="ml-auto bg-primary-100 text-primary-600 text-xs font-semibold px-2 py-1 rounded-full">
                  {counts.informaciones}
                </span>
              )}
            </Link>

            <Link
              href="/dashboard/documentaciones"
              className="flex items-center space-x-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 px-4 py-3 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium">Documentación</span>
              {counts.documentaciones > 0 && (
                <span className="ml-auto bg-primary-100 text-primary-600 text-xs font-semibold px-2 py-1 rounded-full">
                  {counts.documentaciones}
                </span>
              )}
            </Link>

            <Link
              href="/dashboard/usuarios"
              className="flex items-center space-x-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 px-4 py-3 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium">Usuarios</span>
              {counts.usuarios > 0 && (
                <span className="ml-auto bg-primary-100 text-primary-600 text-xs font-semibold px-2 py-1 rounded-full">
                  {counts.usuarios}
                </span>
              )}
            </Link>

            <Link
              href="/dashboard/integraciones"
              className="flex items-center space-x-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 px-4 py-3 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-medium">Integraciones</span>
            </Link>

            <Link
              href="/dashboard/configuracion"
              className="flex items-center space-x-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 px-4 py-3 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium">Configuración</span>
            </Link>
          </nav>

          {/* Logo section */}
          <div className="p-6 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="OpenAttendify Logo"
              width={120}
              height={120}
              className="rounded-2xl shadow-lg"
              priority
            />
          </div>

          {/* User section */}
          <div className="p-4 border-t">
            <Link 
              href="/dashboard/perfil"
              className="flex items-center justify-between mb-3 hover:bg-primary-50 px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.nombre}
                    className="w-8 h-8 rounded-full object-cover border-2 border-primary-200"
                  />
                ) : (
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.nombre?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">{user?.nombre}</p>
                  <p className="text-xs text-gray-500">{user?.rol}</p>
                </div>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
