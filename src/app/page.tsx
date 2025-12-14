'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Registrar vista del home
    console.log('🏠 Registrando vista del home...');
    fetch('/api/estadisticas/vista-home', {
      method: 'POST',
    })
      .then((res) => {
        console.log('✅ Respuesta:', res.status);
        return res.json();
      })
      .then((data) => console.log('✅ Datos:', data))
      .catch((error) => console.error('❌ Error registrando vista:', error));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navbar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">OpenAttendify</span>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/registro"
                className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-extrabold text-gray-900 sm:text-6xl md:text-7xl">
              Gestiona la asistencia de tu equipo
              <span className="block text-primary-600">de forma inteligente</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              OpenAttendify es la solución moderna para el control de asistencias de empleados.
              Simplifica la gestión, mejora la productividad y mantén un registro preciso.
            </p>
          </div>
          <div className="flex flex-col space-y-6">
            <div className="relative">
              <Image
                src="/big_img.png"
                alt="Dashboard OpenAttendify"
                width={800}
                height={600}
                className="rounded-2xl shadow-2xl"
                priority
              />
            </div>
            <div className="flex space-x-4">
              <Link
                href="/registro"
                className="flex-1 bg-primary-600 text-white hover:bg-primary-700 px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 text-center"
              >
                Comenzar Gratis
              </Link>
              <Link
                href="#features"
                className="flex-1 bg-white text-primary-600 hover:bg-gray-50 px-8 py-4 rounded-lg text-lg font-semibold shadow-lg border-2 border-primary-600 transition-all duration-200 text-center"
              >
                Ver Características
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900">Características Principales</h2>
          <p className="mt-4 text-xl text-gray-600">
            Todo lo que necesitas para gestionar tu equipo
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestión de Empleados</h3>
            <p className="text-gray-600">
              Administra la información de tus empleados de forma centralizada y segura.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Control de Asistencias</h3>
            <p className="text-gray-600">
              Registra entradas y salidas con precisión. Múltiples métodos de registro disponibles.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Reportes y Análisis</h3>
            <p className="text-gray-600">
              Genera reportes detallados y obtén insights sobre la asistencia de tu equipo.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Multi-Empresa</h3>
            <p className="text-gray-600">
              Gestiona múltiples empresas desde una sola cuenta. Perfecto para consultoras.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Seguro y Confiable</h3>
            <p className="text-gray-600">
              Tus datos están protegidos con las mejores prácticas de seguridad.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Rápido y Eficiente</h3>
            <p className="text-gray-600">
              Interfaz intuitiva y rápida. Ahorra tiempo en la gestión diaria.
            </p>
          </div>
        </div>
      </div>

      {/* Open Source Section */}
      <div className="bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <div className="inline-flex items-center px-4 py-2 bg-primary-600 rounded-full mb-6">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Código Abierto</span>
              </div>
              <h2 className="text-4xl font-bold mb-6">
                Proyecto de Código Abierto
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                OpenAttendify es un proyecto de código abierto construido con las últimas tecnologías.
                Creemos en la transparencia, la colaboración y en construir software que todos puedan usar, 
                modificar y mejorar.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-primary-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h4 className="font-semibold mb-1">100% Gratis y Libre</h4>
                    <p className="text-gray-400">Sin costos ocultos ni limitaciones artificiales</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-primary-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h4 className="font-semibold mb-1">Comunidad Activa</h4>
                    <p className="text-gray-400">Únete a desarrolladores de todo el mundo</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-primary-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h4 className="font-semibold mb-1">Personalizable</h4>
                    <p className="text-gray-400">Adapta el código a tus necesidades específicas</p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-4">
                <a
                  href="https://github.com/falconsoft3d/OpenAttendify"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-white text-gray-900 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  Ver en GitHub
                </a>
                <a
                  href="https://github.com/falconsoft3d/OpenAttendify/stargazers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-primary-600 text-white hover:bg-primary-700 px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Dar Estrella
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700">
                <div className="flex items-center mb-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <pre className="text-green-400 text-sm overflow-x-auto">
                  <code>{`# Clonar el repositorio
git clone https://github.com/falconsoft3d/OpenAttendify.git

# Instalar dependencias
cd OpenAttendify
npm install

# Configurar base de datos
npx prisma migrate dev

# Iniciar servidor
npm run dev`}</code>
                </pre>
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-primary-600 rounded-full opacity-20 blur-3xl"></div>
              <div className="absolute -top-4 -left-4 w-32 h-32 bg-blue-600 rounded-full opacity-20 blur-3xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Listo para comenzar?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Únete a las empresas que ya confían en OpenAttendify
          </p>
          <Link
            href="/registro"
            className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold shadow-lg inline-block transition-all duration-200 transform hover:scale-105"
          >
            Crear Cuenta Gratis
          </Link>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Contacto
            </h2>
            <p className="text-xl text-gray-600">
              ¿Tienes alguna pregunta? Estamos aquí para ayudarte
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sitio Web</h3>
              <a
                href="https://www.marlonfalcon.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                www.marlonfalcon.com
              </a>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
              <a
                href="mailto:mfalconsoft@gmail.com"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                mfalconsoft@gmail.com
              </a>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Teléfono</h3>
              <a
                href="tel:+34662470645"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                +34 662 470 645
              </a>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ubicación</h3>
              <p className="text-gray-700 font-medium">España</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400 mb-4">
              © 2025 OpenAttendify. Sistema de Gestión de Asistencias de Código Abierto.
            </p>
            <div className="space-x-6">
              <Link
                href="/terminos"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Términos y Condiciones
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
