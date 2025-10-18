'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Settings, Loader2, Video } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const [antiDownload, setAntiDownload] = useState(false);
  const [abTesting, setAbTesting] = useState(false);
  const [defaultColor, setDefaultColor] = useState('#8b5cf6');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configs')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setAntiDownload(data.anti_download);
        setAbTesting(data.ab_testing);
        setDefaultColor(data.default_color);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Erro ao carregar configurações');
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const { data: existingConfig } = await supabase
        .from('configs')
        .select('id')
        .maybeSingle();

      if (existingConfig) {
        const { error } = await supabase
          .from('configs')
          .update({
            anti_download: antiDownload,
            ab_testing: abTesting,
            default_color: defaultColor,
          })
          .eq('id', existingConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('configs')
          .insert({
            anti_download: antiDownload,
            ab_testing: abTesting,
            default_color: defaultColor,
          });

        if (error) throw error;
      }

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
              <Video className="w-6 h-6 text-[#8b5cf6]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Configuração</h1>
              <p className="text-gray-400">Configure as opções padrão dos vídeos</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <motion.div variants={cardVariants} className="lg:col-span-2">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-[#8b5cf6]" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Configurações de Vídeo</CardTitle>
                    <CardDescription className="text-gray-400">
                      Configure recursos padrão para todos os vídeos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-border/50">
                  <div className="space-y-0.5">
                    <Label htmlFor="anti-download" className="text-white">
                      Anti-Download
                    </Label>
                    <p className="text-sm text-gray-400">
                      Proteção contra download de vídeos
                    </p>
                  </div>
                  <Switch
                    id="anti-download"
                    checked={antiDownload}
                    onCheckedChange={setAntiDownload}
                    className="data-[state=checked]:bg-[#10b981]"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-border/50">
                  <div className="space-y-0.5">
                    <Label htmlFor="ab-testing" className="text-white">
                      A/B Testing Global
                    </Label>
                    <p className="text-sm text-gray-400">
                      Ativar testes A/B em todos os vídeos
                    </p>
                  </div>
                  <Switch
                    id="ab-testing"
                    checked={abTesting}
                    onCheckedChange={setAbTesting}
                    className="data-[state=checked]:bg-[#10b981]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-color" className="text-white">
                    Cor Padrão da Barra de Progresso
                  </Label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Input
                        id="default-color"
                        type="text"
                        value={defaultColor}
                        onChange={(e) => setDefaultColor(e.target.value)}
                        placeholder="#8b5cf6"
                        className="bg-white/5 border-border/50 text-white pl-12"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                      <div
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded border-2 border-white/20"
                        style={{ backgroundColor: defaultColor }}
                      />
                    </div>
                    <input
                      type="color"
                      value={defaultColor}
                      onChange={(e) => setDefaultColor(e.target.value)}
                      className="w-14 h-10 rounded border border-border/50 cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Esta cor será aplicada por padrão em novos vídeos
                  </p>
                </div>

                <Button
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="w-full bg-[#8b5cf6] hover:bg-[#8b5cf6]/90 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Configurações'
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
