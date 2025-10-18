'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import useSWR from 'swr';
import { toast } from 'sonner';
import { VideoTable } from '@/components/video-table';
import AdminLayout from '@/components/admin-layout';
import { AddVideoModal } from '@/components/add-video-modal';
import { useModal } from '@/contexts/modal-context';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function DashboardPage() {
  const router = useRouter();
  const { isAddVideoModalOpen, openAddVideoModal, closeAddVideoModal } = useModal();
  const { data, error, isLoading } = useSWR('/api/videos/count', fetcher, {
    refreshInterval: 30000,
  });

  if (error) {
    toast.error('Erro ao carregar dados');
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-[#8b5cf6]/20 bg-gradient-to-br from-[#8b5cf6]/5 to-transparent">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total de Vídeos Rodando
              </CardTitle>
              <Video className="h-5 w-5 text-[#8b5cf6]" />
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-4xl font-bold text-white"
              >
                {isLoading ? '...' : data?.count || 0}
              </motion.div>
              <p className="text-xs text-gray-500 mt-2">
                Vídeos ativos no sistema
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Vídeos</CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  Gerencie todos os seus vídeos
                </p>
              </div>
              <Button
                className="bg-[#10b981] hover:bg-[#10b981]/90 text-white"
                onClick={openAddVideoModal}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Vídeo
              </Button>
            </CardHeader>
            <CardContent>
              <VideoTable />
            </CardContent>
          </Card>
        </motion.div>

        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-[#8b5cf6] text-white shadow-lg shadow-[#8b5cf6]/50 flex items-center justify-center"
          onClick={openAddVideoModal}
        >
          <Plus className="h-6 w-6" />
        </motion.button>

        <AddVideoModal
          open={isAddVideoModalOpen}
          onOpenChange={closeAddVideoModal}
        />
      </div>
    </AdminLayout>
  );
}
