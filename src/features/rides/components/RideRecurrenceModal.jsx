import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ridesService } from '../services/ridesService';

const DAYS_OF_WEEK = [
  { id: 1, label: 'Segunda' },
  { id: 2, label: 'Terça' },
  { id: 3, label: 'Quarta' },
  { id: 4, label: 'Quinta' },
  { id: 5, label: 'Sexta' },
  { id: 6, label: 'Sábado' },
  { id: 7, label: 'Domingo' },
];

const INTERVALS = [
  { id: 1, label: 'A cada 1 dia' },
  { id: 2, label: 'A cada 5 dias' },
  { id: 3, label: 'A cada 7 dias (semanal)' },
  { id: 4, label: 'A cada 15 dias (quinzenal)' },
  { id: 5, label: 'A cada 30 dias (mensal)' },
];

export default function RideRecurrenceModal({ ride, onClose }) {
  const [type, setType] = useState('weekly'); // 'weekly' or 'interval'
  const [selectedDays, setSelectedDays] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [selectedInterval, setSelectedInterval] = useState(3);
  const [loading, setLoading] = useState(false);

  const handleWeeklySubmit = async () => {
    if (selectedDays.length === 0) {
      toast.error('Selecione pelo menos um dia da semana');
      return;
    }

    setLoading(true);
    try {
      await ridesService.scheduleRideWeekly({
        ride: ride.id,
        dia_semana_agendamento: selectedDays
      });
      toast.success('Recorrência semanal agendada!');
      onClose();
    } catch (error) {
      toast.error('Erro ao agendar recorrência');
    } finally {
      setLoading(false);
    }
  };

  const handleIntervalSubmit = async () => {
    if (!startDate) {
      toast.error('Selecione uma data de início');
      return;
    }

    setLoading(true);
    try {
      await ridesService.scheduleRideInterval({
        ride: ride.id,
        dataInicio: startDate,
        intervalo_dias: selectedInterval
      });
      toast.success('Recorrência por intervalo agendada!');
      onClose();
    } catch (error) {
      toast.error('Erro ao agendar recorrência');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (id) => {
    setSelectedDays(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-fatecride-blue">Agendar Recorrência</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setType('weekly')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              type === 'weekly' ? 'bg-white text-fatecride-blue shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Dias da Semana
          </button>
          <button
            onClick={() => setType('interval')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              type === 'interval' ? 'bg-white text-fatecride-blue shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Intervalo Fixo
          </button>
        </div>

        {type === 'weekly' ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Selecione em quais dias esta carona se repete:</p>
            <div className="grid grid-cols-2 gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.id}
                  onClick={() => toggleDay(day.id)}
                  className={`py-2 px-3 rounded border text-sm transition-all ${
                    selectedDays.includes(day.id)
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleWeeklySubmit}
              disabled={loading}
              className="w-full bg-fatecride-blue text-white py-3 rounded-lg font-semibold hover:bg-fatecride-blue-dark transition-colors disabled:opacity-50 mt-4"
            >
              {loading ? 'Agendando...' : 'Confirmar Agendamento'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequência</label>
              <select
                value={selectedInterval}
                onChange={(e) => setSelectedInterval(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                {INTERVALS.map(interval => (
                  <option key={interval.id} value={interval.id}>{interval.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleIntervalSubmit}
              disabled={loading}
              className="w-full bg-fatecride-blue text-white py-3 rounded-lg font-semibold hover:bg-fatecride-blue-dark transition-colors disabled:opacity-50 mt-4"
            >
              {loading ? 'Agendando...' : 'Confirmar Agendamento'}
            </button>
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 text-center uppercase tracking-wider">
            Configurando carona para: {ride.origin?.cidade} → {ride.destination?.cidade}
          </p>
        </div>
      </div>
    </div>
  );
}