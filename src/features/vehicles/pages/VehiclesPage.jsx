import { useState } from "react";
import { HiPlus, HiPencil, HiTrash, HiTruck } from "react-icons/hi";
import { PageContainer } from "@shared/components/layout/PageContainer";
import { Card } from "@shared/components/ui/Card";
import { Button } from "@shared/components/ui/Button";
import { Modal } from "@shared/components/ui/Modal";
import { Badge } from "@shared/components/ui/Badge";
import { Alert } from "@shared/components/ui/Alert";
import { EmptyState } from "@shared/components/ui/EmptyState";
import { LoadingScreen } from "@shared/components/ui/LoadingScreen";
import { VehicleForm } from "../components/VehicleForm";
import { useVehicles } from "../hooks/useVehicles";

/**
 * VehiclesPage - Página de gerenciamento de veículos (apenas motoristas)
 * 
 * CRUD completo: listagem, criação, edição e exclusão.
 * Usa Modal para formulários sem sair da página.
 * React Query gerencia cache e sincronização automática.
 */

export function VehiclesPage() {
  const {
    vehicles,
    isLoading,
    error,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    isCreating,
    isUpdating,
    isDeleting,
  } = useVehicles();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  /**
   * Handler unificado para criar/editar
   * editingVehicle determina qual operação executar
   */
  const handleSubmit = async (data) => {
    try {
      if (editingVehicle) {
        await updateVehicle({ id: editingVehicle.id, data });
      } else {
        await createVehicle(data);
      }
      setModalOpen(false);
      setEditingVehicle(null);
    } catch (err) {
      console.error("Erro ao salvar veículo:", err);
    }
  };

  /**
   * Abre modal em modo edição
   * Preenche formulário com dados do veículo selecionado
   */
  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setModalOpen(true);
  };

  /**
   * Confirmação de exclusão
   * Previne exclusão acidental com modal de confirmação
   */
  const handleDelete = async () => {
    try {
      await deleteVehicle(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Erro ao deletar veículo:", err);
    }
  };

  // Loading inicial
  if (isLoading) return <LoadingScreen />;

  // Erro ao carregar
  if (error) {
    return (
      <PageContainer>
        <Alert variant="danger">
          Erro ao carregar veículos: {error.message}
        </Alert>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer
        title="Meus Veículos"
        description="Gerencie os veículos cadastrados para oferecer caronas"
      >
      {/* Botão de adicionar novo veículo */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Meus Veículos</h2>
          <p className="text-sm text-gray-500">Gerencie veículos que você usa para oferecer caronas</p>
        </div>
        <div>
          <Button
            onClick={() => {
              setEditingVehicle(null);
              setModalOpen(true);
            }}
            className="gap-2 px-4 py-2"
          >
            <HiPlus className="w-5 h-5" />
            <span>Adicionar veículo</span>
          </Button>
        </div>
      </div>

      {/* Lista de veículos ou empty state */}
      {vehicles.length === 0 ? (
        <EmptyState
          icon={FiTruck}
          title="Nenhum veículo cadastrado"
          description="Adicione um veículo para começar a oferecer caronas"
          action={
            <Button onClick={() => setModalOpen(true)} className="gap-2">
              <FiPlus /> Adicionar primeiro veículo
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="flex flex-col hover:shadow-lg transform hover:-translate-y-1 transition">
              <div className="relative">
                <div className="absolute right-3 top-3 flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(vehicle)}
                    aria-label={`Editar ${vehicle.modelo}`}
                    title="Editar"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
                  >
                    <HiPencil className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(vehicle)}
                    aria-label={`Excluir ${vehicle.modelo}`}
                    title="Excluir"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-red-50"
                  >
                    <HiTrash className="w-4 h-4 text-red-600" />
                  </button>
                </div>

                <div className="flex items-center gap-3 p-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg flex items-center justify-center">
                    <HiTruck className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{vehicle.modelo}</h3>
                    <p className="text-sm text-gray-500 uppercase">{vehicle.placa}</p>
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4 pt-2 flex-1">
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>
                    <div className="text-xs text-gray-500">Cor</div>
                    <div className="font-medium text-gray-800">{vehicle.cor || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Ano</div>
                    <div className="font-medium text-gray-800">{vehicle.ano || '—'}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <Badge variant="primary">{vehicle.capacidade} passageiros</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de criar/editar veículo */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingVehicle(null);
        }}
        title={editingVehicle ? "Editar veículo" : "Novo veículo"}
      >
        <VehicleForm
          initialData={editingVehicle}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false);
            setEditingVehicle(null);
          }}
          isLoading={isCreating || isUpdating}
        />
      </Modal>

      {/* Modal de confirmação de exclusão */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar exclusão"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Tem certeza que deseja excluir o veículo{" "}
            <strong>{deleteConfirm?.modelo}</strong> (placa{" "}
            <strong>{deleteConfirm?.placa}</strong>)?
          </p>
          <Alert variant="warning">
            Esta ação não pode ser desfeita. Verifique se não há caronas ativas com este veículo.
          </Alert>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
    </>
  );
}

export default VehiclesPage;
