import Link from 'next/link';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navbar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                OpenAttendify
              </Link>
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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Términos y Condiciones
          </h1>

          <div className="space-y-6 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Uso del Servicio
              </h2>
              <p>
                OpenAttendify es un sistema de gestión de asistencias de código abierto 
                proporcionado "tal cual" para fines demostrativos y de desarrollo.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Servidor de Demostración
              </h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
                <p className="font-semibold text-yellow-900 mb-2">⚠️ Importante:</p>
                <ul className="list-disc list-inside space-y-2 text-yellow-800">
                  <li>
                    Este servidor es únicamente para <strong>fines de prueba y demostración</strong>.
                  </li>
                  <li>
                    <strong>NO debe usarse para proyectos en producción o datos reales</strong>.
                  </li>
                  <li>
                    Para proyectos reales, debes montar tu propia instancia del servidor 
                    en tu propia infraestructura.
                  </li>
                  <li>
                    No garantizamos la disponibilidad, seguridad o persistencia de datos 
                    en este servidor de demostración.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Soporte Técnico
              </h2>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
                <p className="text-blue-900">
                  <strong>El soporte técnico NO está incluido</strong> a menos que contrates 
                  un servicio de soporte específico. Este es un proyecto de código abierto 
                  mantenido por la comunidad. Puedes buscar ayuda en:
                </p>
                <ul className="list-disc list-inside mt-3 space-y-1 text-blue-800">
                  <li>Documentación del proyecto</li>
                  <li>Foros y comunidades de GitHub</li>
                  <li>Contratar servicios profesionales de consultoría (por separado)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Privacidad y Datos
              </h2>
              <p>
                Al usar este servidor de demostración, reconoces que:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-2 ml-4">
                <li>Los datos pueden ser eliminados en cualquier momento sin previo aviso.</li>
                <li>No debes introducir información sensible o personal real.</li>
                <li>Este servidor puede ser reiniciado o dado de baja en cualquier momento.</li>
                <li>No nos hacemos responsables de la pérdida de datos almacenados aquí.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Instalación Propia
              </h2>
              <p>
                Para usar OpenAttendify en producción, debes:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-2 ml-4">
                <li>Clonar el repositorio desde GitHub</li>
                <li>Configurar tu propia base de datos PostgreSQL</li>
                <li>Implementar las medidas de seguridad apropiadas</li>
                <li>Mantener actualizaciones y backups regulares</li>
                <li>Cumplir con las leyes de protección de datos de tu región</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Limitación de Responsabilidad
              </h2>
              <p>
                Este software se proporciona "tal cual", sin garantías de ningún tipo, 
                expresas o implícitas. En ningún caso los autores o titulares de derechos 
                serán responsables por daños o perjuicios derivados del uso del software.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Código Abierto
              </h2>
              <p>
                OpenAttendify es un proyecto de código abierto. Eres libre de:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-2 ml-4">
                <li>Usar el código para cualquier propósito</li>
                <li>Modificar el código según tus necesidades</li>
                <li>Distribuir el código y tus modificaciones</li>
                <li>Contribuir mejoras al proyecto principal</li>
              </ul>
            </section>

            <section className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-600">
                <strong>Última actualización:</strong> 14 de diciembre de 2025
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Al registrarte y usar este servicio, aceptas estos términos y condiciones.
              </p>
            </section>
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/registro"
              className="bg-primary-600 text-white hover:bg-primary-700 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Volver al Registro
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white shadow-lg mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p>
              OpenAttendify - Sistema de Gestión de Asistencias de Código Abierto
            </p>
            <div className="mt-2 space-x-4">
              <Link href="/terminos" className="text-primary-600 hover:text-primary-700">
                Términos y Condiciones
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
