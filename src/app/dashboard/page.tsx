'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Stats {
  totalEmpresas: number;
  totalEmpleados: number;
  asistenciasHoy: number;
}

interface Asistencia {
  id: string;
  checkIn: string;
  checkOut: string | null;
}

type PeriodoGrafico = 'dia' | 'semana' | 'mes' | 'año';

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalEmpresas: 0,
    totalEmpleados: 0,
    asistenciasHoy: 0,
  });
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodoGrafico, setPeriodoGrafico] = useState<PeriodoGrafico>('dia');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('🔄 Cargando datos...');
      const [statsRes, asistenciasRes] = await Promise.all([
        fetch('/api/dashboard/stats', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }),
        fetch('/api/asistencias', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        console.log('✅ Estadísticas cargadas:', data);
        setStats(data);
      }

      if (asistenciasRes.ok) {
        const data = await asistenciasRes.json();
        console.log('✅ Asistencias cargadas:', data.length);
        setAsistencias(data);
      }

      if (!statsRes.ok && statsRes.status === 401) {
        console.warn('🚪 No autenticado, redirigiendo a login...');
        window.location.href = '/login';
        return;
      }

      setError(null);
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Calcular horas trabajadas
  const calcularHoras = (checkIn: string, checkOut: string | null): number => {
    if (!checkOut) return 0;
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(0, diff / (1000 * 60 * 60));
  };

  // Filtrar asistencias por periodo
  const filtrarPorPeriodo = (fecha: Date, periodo: 'hoy' | 'ayer' | 'semana' | 'mes') => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    switch (periodo) {
      case 'hoy':
        return fecha >= hoy;
      case 'ayer':
        const ayer = new Date(hoy);
        ayer.setDate(ayer.getDate() - 1);
        return fecha >= ayer && fecha < hoy;
      case 'semana':
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        return fecha >= inicioSemana;
      case 'mes':
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        return fecha >= inicioMes;
    }
  };

  // Calcular KPIs
  const horasHoy = asistencias
    .filter(a => filtrarPorPeriodo(new Date(a.checkIn), 'hoy'))
    .reduce((total, a) => total + calcularHoras(a.checkIn, a.checkOut), 0);

  const horasAyer = asistencias
    .filter(a => filtrarPorPeriodo(new Date(a.checkIn), 'ayer'))
    .reduce((total, a) => total + calcularHoras(a.checkIn, a.checkOut), 0);

  const horasSemana = asistencias
    .filter(a => filtrarPorPeriodo(new Date(a.checkIn), 'semana'))
    .reduce((total, a) => total + calcularHoras(a.checkIn, a.checkOut), 0);

  const horasMes = asistencias
    .filter(a => filtrarPorPeriodo(new Date(a.checkIn), 'mes'))
    .reduce((total, a) => total + calcularHoras(a.checkIn, a.checkOut), 0);

  // Formatear horas
  const formatearHoras = (horas: number): string => {
    const h = Math.floor(horas);
    const m = Math.round((horas - h) * 60);
    return `${h}h ${m}m`;
  };

  // Preparar datos para el gráfico
  const prepararDatosGrafico = () => {
    const hoy = new Date();
    let labels: string[] = [];
    let datos: number[] = [];

    switch (periodoGrafico) {
      case 'dia':
        // Últimos 7 días
        for (let i = 6; i >= 0; i--) {
          const fecha = new Date(hoy);
          fecha.setDate(hoy.getDate() - i);
          fecha.setHours(0, 0, 0, 0);
          
          const fechaSiguiente = new Date(fecha);
          fechaSiguiente.setDate(fecha.getDate() + 1);
          
          const horasDia = asistencias
            .filter(a => {
              const fechaAsistencia = new Date(a.checkIn);
              return fechaAsistencia >= fecha && fechaAsistencia < fechaSiguiente;
            })
            .reduce((total, a) => total + calcularHoras(a.checkIn, a.checkOut), 0);
          
          labels.push(fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }));
          datos.push(horasDia);
        }
        break;

      case 'semana':
        // Últimas 8 semanas
        for (let i = 7; i >= 0; i--) {
          const inicioSemana = new Date(hoy);
          inicioSemana.setDate(hoy.getDate() - hoy.getDay() - (i * 7));
          inicioSemana.setHours(0, 0, 0, 0);
          
          const finSemana = new Date(inicioSemana);
          finSemana.setDate(inicioSemana.getDate() + 7);
          
          const horasSemana = asistencias
            .filter(a => {
              const fechaAsistencia = new Date(a.checkIn);
              return fechaAsistencia >= inicioSemana && fechaAsistencia < finSemana;
            })
            .reduce((total, a) => total + calcularHoras(a.checkIn, a.checkOut), 0);
          
          labels.push(`Sem ${inicioSemana.getDate()}/${inicioSemana.getMonth() + 1}`);
          datos.push(horasSemana);
        }
        break;

      case 'mes':
        // Últimos 12 meses
        for (let i = 11; i >= 0; i--) {
          const mes = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
          const mesSiguiente = new Date(mes.getFullYear(), mes.getMonth() + 1, 1);
          
          const horasMes = asistencias
            .filter(a => {
              const fechaAsistencia = new Date(a.checkIn);
              return fechaAsistencia >= mes && fechaAsistencia < mesSiguiente;
            })
            .reduce((total, a) => total + calcularHoras(a.checkIn, a.checkOut), 0);
          
          labels.push(mes.toLocaleDateString('es-ES', { month: 'short' }));
          datos.push(horasMes);
        }
        break;

      case 'año':
        // Últimos 5 años
        const añoActual = hoy.getFullYear();
        for (let i = 4; i >= 0; i--) {
          const año = añoActual - i;
          const inicioAño = new Date(año, 0, 1);
          const finAño = new Date(año + 1, 0, 1);
          
          const horasAño = asistencias
            .filter(a => {
              const fechaAsistencia = new Date(a.checkIn);
              return fechaAsistencia >= inicioAño && fechaAsistencia < finAño;
            })
            .reduce((total, a) => total + calcularHoras(a.checkIn, a.checkOut), 0);
          
          labels.push(año.toString());
          datos.push(horasAño);
        }
        break;
    }

    return { labels, datos };
  };

  const { labels, datos } = prepararDatosGrafico();

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Horas trabajadas',
        data: datos,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `Horas: ${formatearHoras(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `${value}h`,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md">
          <h3 className="font-semibold mb-2">Error al cargar estadísticas</h3>
          <p>{error}</p>
          <button
            onClick={loadData}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Cards Originales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Empresas</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalEmpresas}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Empleados</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalEmpleados}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Asistencias Hoy</p>
              <p className="text-3xl font-bold text-gray-900">{stats.asistenciasHoy}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs de Horas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow p-6 text-white">
          <p className="text-indigo-100 text-sm mb-1">Horas Hoy</p>
          <p className="text-3xl font-bold">{formatearHoras(horasHoy)}</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg shadow p-6 text-white">
          <p className="text-cyan-100 text-sm mb-1">Horas Ayer</p>
          <p className="text-3xl font-bold">{formatearHoras(horasAyer)}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow p-6 text-white">
          <p className="text-emerald-100 text-sm mb-1">Horas esta Semana</p>
          <p className="text-3xl font-bold">{formatearHoras(horasSemana)}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow p-6 text-white">
          <p className="text-amber-100 text-sm mb-1">Horas este Mes</p>
          <p className="text-3xl font-bold">{formatearHoras(horasMes)}</p>
        </div>
      </div>

      {/* Gráfico de Líneas */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Tendencia de Horas Trabajadas</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriodoGrafico('dia')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                periodoGrafico === 'dia'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Día
            </button>
            <button
              onClick={() => setPeriodoGrafico('semana')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                periodoGrafico === 'semana'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setPeriodoGrafico('mes')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                periodoGrafico === 'mes'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setPeriodoGrafico('año')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                periodoGrafico === 'año'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Año
            </button>
          </div>
        </div>
        <div style={{ height: '400px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/empresas"
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-all"
          >
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="font-medium text-gray-900">Nueva Empresa</span>
          </Link>

          <Link
            href="/dashboard/empleados"
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-all"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="font-medium text-gray-900">Nuevo Empleado</span>
          </Link>

          <Link
            href="/dashboard/asistencias"
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-all"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <span className="font-medium text-gray-900">Registrar Asistencia</span>
          </Link>

          <Link
            href="/dashboard/asistencias"
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-all"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="font-medium text-gray-900">Ver Reportes</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
