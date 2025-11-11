import { useState } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiCar } from "react-icons/fi";
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
    <PageContainer
      title="Meus Veículos"
      description="Gerencie os veículos cadastrados para oferecer caronas"
    >
      {/* Botão de adicionar novo veículo */}
      <div className="mb-6">
        <Button
          onClick={() => {
            setEditingVehicle(null);
            setModalOpen(true);
          }}
          className="gap-2"
        >
          <FiPlus /> Adicionar veículo
        </Button>
      </div>

      {/* Lista de veículos ou empty state */}
      {vehicles.length === 0 ? (
        <EmptyState
          icon={FiCar}
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
            <Card key={vehicle.id} className="flex flex-col">
              {/* Cabeçalho do card com modelo e ações */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FiCar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{vehicle.modelo}</h3>
                    <p className="text-sm text-gray-600 uppercase">{vehicle.placa}</p>
                  </div>
                </div>
              </div>

              {/* Informações do veículo */}
              <div className="space-y-2 flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cor:</span>
                  <span className="font-medium">{vehicle.cor}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ano:</span>
                  <span className="font-medium">{vehicle.ano}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Capacidade:</span>
                  <Badge variant="primary">{vehicle.capacidade} passageiros</Badge>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(vehicle)}
                  className="flex-1 gap-2"
                >
                  <FiEdit2 className="w-4 h-4" /> Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirm(vehicle)}
                  className="flex-1 gap-2 text-red-600 hover:bg-red-50"
                >
                  <FiTrash2 className="w-4 h-4" /> Excluir
                </Button>
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
  );
}

export default VehiclesPage;
