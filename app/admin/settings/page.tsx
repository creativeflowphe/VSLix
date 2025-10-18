'use client';

import AdminLayout from '@/components/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-[#8b5cf6]" />
                </div>
                <div>
                  <CardTitle className="text-white">Configurações Gerais</CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure as opções do sistema
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-400">
                <p>Funcionalidade em breve</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
