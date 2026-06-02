import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiCalendar, FiClock, FiPlus, FiTrash2, FiRepeat } from 'react-icons/fi';
import { PageContainer } from '@shared/components/layout/PageContainer';
import { Card } from '@shared/components/ui/Card';
import { Button } from '@shared/components/ui/Button';
import { Spinner } from '@shared/components/ui/Spinner';
import { useAuthStore } from '@features/auth/stores/authStore';
import { ridesService } from '../services/ridesService';

/**
 * RideSchedulingPage
 * Permite ao motorista agendar recorrências para caronas existentes.
 * 
 * Guia de Endpoints:
 * - POST /agendar-ride-dia-semana (Dias específicos)
 * - POST /agendar-compromisso-intervalo-dias (Intervalo fixo)
 * 
 * Nota: intervalo_dias deve ser o ID da entidade IntervaloDias (Ex: 1=Diário, 2=Semanal)
 */

export function RideSchedulingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeRides, setActiveRides] = useState([]);
  const [weeklySchedules, setWeeklySchedules] = useState([]);
  const [intervalSchedules, setIntervalSchedules] = useState([]);
  
  // Form States
  const [scheduleType, setScheduleType] = useState('WEEKLY'); // 'WEEKLY' ou 'INTERVAL'
  const [formData, setFormData] = useState({
    ride: '',
    dia_semana_agendamento: [],
    dataInicio: '',
    intervalo_dias: 1
  });

  const DIAS = [
    { id: 1, name: 'MONDAY', display: 'Seg' },
    { id: 2, name: 'TUESDAY', display: 'Ter' },
    { id: 3, name: 'WEDNESDAY', display: 'Qua' },
    { id: 4, name: 'THURSDAY', display: 'Qui' },
    { id: 5, name: 'FRIDAY', display: 'Sex' },
    { id: 6, name: 'SATURDAY', display: 'Sáb' },
    { id: 7, name: 'SUNDAY', display: 'Dom' },
  ];

  const INTERVALOS = [
    { id: 1, label: 'Diário (1 dia)' },
    { id: 2, label: 'A cada 5 dias' },
    { id: 3, label: 'Semanal (7 dias)' },
    { id: 4, label: 'Quinzenal (15 dias)' },
    { id: 5, label: 'Mensal (30 dias)' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (user?.tipo === 'PASSAGEIRO') {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [rides, weekly, interval] = await Promise.all([
        ridesService.getActive(),
        ridesService.getScheduledWeekly(),
        ridesService.getScheduledInterval()
      ]);
      setActiveRides(Array.isArray(rides) ? rides : []);
      setWeeklySchedules(Array.isArray(weekly) ? weekly : []);
      setIntervalSchedules(Array.isArray(interval) ? interval : []);
    } catch (error) {
      toast.error('Erro ao carregar dados de agendamento');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (diaId) => {
    setFormData(prev => ({
      ...prev,
      dia_semana_agendamento: prev.dia_semana_agendamento.includes(diaId)
        ? prev.dia_semana_agendamento.filter(id => id !== diaId)
        : [...prev.dia_semana_agendamento, diaId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.ride) return toast.error('Selecione uma carona base.');
    if (scheduleType === 'WEEKLY' && formData.dia_semana_agendamento.length === 0) {
      return toast.error('Selecione pelo menos um dia da semana.');
    }

    try {
      if (scheduleType === 'WEEKLY') {
        await ridesService.scheduleRideWeekly({
          ride: Number(formData.ride),
          dia_semana_agendamento: formData.dia_semana_agendamento
        });
      } else {
        await ridesService.scheduleRideInterval({
          ride: Number(formData.ride),
          dataInicio: formData.dataInicio,
          intervalo_dias: Number(formData.intervalo_dias)
        });
      }
      toast.success('Agendamento criado com sucesso!');
      loadData();
    } catch (error) {
      toast.error('Erro ao criar agendamento');
    }
  };

  const handleDeactivateWeekly = async (id, dias) => {
    if (!window.confirm('Deseja desativar este agendamento semanal para todos os dias selecionados?')) return;
    
    try {
      await ridesService.desactivateScheduleWeekly(id, dias);
      toast.success('Agendamento atualizado');
      loadData();
    } catch (error) {
      toast.error('Erro ao desativar');
    }
  };

  const handleDeactivateInterval = async (id) => {
    if (!window.confirm('Deseja desativar este agendamento por intervalo?')) return;

    try {
      await ridesService.desactivateScheduleInterval(id);
      toast.success('Agendamento desativado');
      loadData();
    } catch (error) {
      toast.error('Erro ao desativar agendamento');
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Spinner size="lg" /></div>;

  if (user?.tipo === 'PASSAGEIRO') {
    return (
      <PageContainer title="Acesso Negado">
        <Card className="p-8 text-center">Apenas motoristas podem gerenciar agendamentos.</Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Recorrência de Caronas" description="Configure agendamentos automáticos para suas caronas">
      <div className="flex justify-end mb-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/caronas-ativas')} 
          className="text-gray-500"
        >
          Voltar para Caronas Ativas
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulário de Criação */}
        <Card className="lg:col-span-1 p-6 h-fit">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FiPlus className="text-fatecride-blue" /> Novo Agendamento
          </h3>
          
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
            <button 
              onClick={() => setScheduleType('WEEKLY')}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${scheduleType === 'WEEKLY' ? 'bg-white shadow text-fatecride-blue' : 'text-gray-500'}`}
            >Dias da Semana</button>
            <button 
              type="button"
              onClick={() => setScheduleType('INTERVAL')}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${scheduleType === 'INTERVAL' ? 'bg-white shadow text-fatecride-blue' : 'text-gray-500'}`}
            >Intervalo de Dias</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Carona Base</label>
              <select 
                className="w-full p-2 border rounded-md text-sm"
                value={formData.ride}
                onChange={e => setFormData({...formData, ride: e.target.value})}
                required
              >
                <option value="">Selecione uma carona...</option>
                {activeRides.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.origin?.cidade || 'Origem'} → {r.destination?.cidade || 'Destino'}
                    {r.data_hora ? ` (${new Date(r.data_hora).toLocaleDateString()})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {scheduleType === 'WEEKLY' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">Dias da Semana</label>
                  <div className="flex flex-wrap gap-1">
                    {DIAS.map(dia => (
                      <button
                        key={dia.id}
                        type="button"
                        onClick={() => handleToggleDay(dia.id)}
                        className={`px-2 py-1 text-[10px] font-bold rounded border transition-colors ${formData.dia_semana_agendamento.includes(dia.id) ? 'bg-fatecride-blue text-white border-fatecride-blue' : 'bg-white text-gray-400 border-gray-200'}`}
                      >
                        {dia.display}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Data de Início</label>
                  <input type="date" className="w-full p-2 border rounded-md" value={formData.dataInicio} onChange={e => setFormData({...formData, dataInicio: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Frequência do Intervalo</label>
                  <select 
                    className="w-full p-2 border rounded-md text-sm"
                    value={formData.intervalo_dias}
                    onChange={e => setFormData({...formData, intervalo_dias: e.target.value})}
                    required
                  >
                    {INTERVALOS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <Button type="submit" className="w-full bg-fatecride-blue">Criar Agendamento</Button>
          </form>
        </Card>

        {/* Listagem de Agendamentos */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h3 className="text-md font-bold mb-3 flex items-center gap-2 text-gray-700">
              <FiRepeat /> Agendamentos Semanais
            </h3>
            <div className="grid gap-3">
              {weeklySchedules.length === 0 && <p className="text-sm text-gray-400 italic">Nenhum agendamento semanal.</p>}
              {weeklySchedules.map(sch => {
                const rideInfo = activeRides.find(r => Number(r.id) === Number(sch.ride));
                return (
                  <Card key={sch.ride} className="p-4 border-l-4 border-green-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          {rideInfo ? `${rideInfo.origin?.cidade} → ${rideInfo.destination?.cidade}` : `Carona #${sch.ride}`}
                        </p>
                        <div className="flex gap-1 mt-2">
                          {sch.dia_semana_agendamento?.sort((a,b) => a-b).map(id => {
                            const day = DIAS.find(d => d.id === id);
                            return <span key={id} className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-bold">
                              {day?.display || id}
                            </span>
                          })}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeactivateWeekly(sch.ride, sch.dia_semana_agendamento)}
                        className="text-red-400 hover:text-red-600 p-2 transition-colors"
                        title="Remover agendamento"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="text-md font-bold mb-3 flex items-center gap-2 text-gray-700">
              <FiCalendar /> Agendamentos por Intervalo
            </h3>
            <div className="grid gap-3">
              {intervalSchedules.length === 0 && <p className="text-sm text-gray-400 italic">Nenhum agendamento por intervalo.</p>}
              {intervalSchedules.map(sch => (
                <Card key={sch.id} className={`p-4 border-l-4 ${sch.ativo !== false ? 'border-blue-500' : 'border-gray-300 opacity-60'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        Inicia em: {sch.dataInicio ? new Date(sch.dataInicio).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500 uppercase font-bold mt-1">
                        Frequência: {INTERVALOS.find(i => i.id === Number(sch.intervaloDiasId || sch.intervalo_dias))?.label || 'Personalizado'}
                      </p>
                    </div>
                    {sch.ativo !== false && (
                      <button 
                        onClick={() => handleDeactivateInterval(sch.id)}
                        className="text-red-400 hover:text-red-600 p-2"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>

      </div>
    </PageContainer>
  );
}