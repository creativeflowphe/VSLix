'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/components/admin-layout';
import { Upload, Copy, Settings, Cloud, Database, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

interface Config {
  id: string;
  anti_download: boolean;
  ab_testing: boolean;
  default_color: string;
  updated_at: string;
}

export default function ConfigPage() {
  const [antiDownload, setAntiDownload] = useState(false);
  const [abTesting, setAbTesting] = useState(false);
  const [defaultColor, setDefaultColor] = useState('#8b5cf6');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  const { data: statsData } = useSWR('/api/videos/count', fetcher, {
    refreshInterval: 10000,
  });

  useEffect(() => {
    loadConfig();
    checkSupabaseStatus();
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

  const checkSupabaseStatus = async () => {
    try {
      const { error } = await supabase
        .from('videos')
        .select('id')
        .limit(1);

      setSupabaseStatus(error ? 'error' : 'ok');
    } catch (error) {
      setSupabaseStatus('error');
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type !== 'video/mp4') {
        toast.error('Apenas arquivos MP4 são permitidos');
        return;
      }
      setUploadFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'video/mp4') {
        toast.error('Apenas arquivos MP4 são permitidos');
        return;
      }
      setUploadFile(selectedFile);
    }
  };

  const handleTestUpload = async () => {
    if (!uploadFile) {
      toast.error('Selecione um arquivo primeiro');
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

    if (!cloudName || !apiKey) {
      toast.error('Variáveis de ambiente do Cloudinary não configuradas');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('upload_preset', 'ml_default');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        toast.success('Upload realizado com sucesso!', {
          description: data.secure_url,
          duration: 5000,
        });
        setUploadFile(null);
      } else {
        throw new Error('Upload falhou');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload para o Cloudinary');
    } finally {
      setIsUploading(false);
    }
  };

  const envVarsConfig = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'your-secret-key',
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
    NEXT_PUBLIC_CLOUDINARY_API_KEY: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || 'your-api-key',
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || 'your-api-secret',
  };

  const handleCopyEnvVars = () => {
    const vercelJson = JSON.stringify(
      Object.entries(envVarsConfig).map(([key, value]) => ({
        key,
        value,
        target: ['production', 'preview', 'development'],
      })),
      null,
      2
    );

    navigator.clipboard.writeText(vercelJson);
    toast.success('JSON copiado para o clipboard!', {
      description: 'Cole no Vercel em Settings > Environment Variables',
    });
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
              <Settings className="w-6 h-6 text-[#8b5cf6]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Configurações Gerais</h1>
              <p className="text-gray-400">Gerencie as configurações globais da plataforma</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <motion.div variants={cardVariants}>
            <Card className="border-border/50 h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
                    <Cloud className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Cloudinary Setup</CardTitle>
                    <CardDescription className="text-gray-400">
                      Configure e teste o upload de vídeos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white text-sm">Variáveis de Ambiente Necessárias</Label>
                  <div className="space-y-1 text-xs text-gray-400 bg-white/5 p-3 rounded-lg border border-border/50">
                    <p>• NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</p>
                    <p>• NEXT_PUBLIC_CLOUDINARY_API_KEY</p>
                    <p>• CLOUDINARY_API_SECRET</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Test Upload</Label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                      relative border-2 border-dashed rounded-lg p-6 transition-all
                      ${isDragging
                        ? 'border-[#10b981] bg-[#10b981]/10'
                        : 'border-border/50 bg-white/5'
                      }
                      ${uploadFile ? 'border-[#10b981]' : ''}
                    `}
                  >
                    <input
                      type="file"
                      id="test-upload"
                      accept="video/mp4"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {!uploadFile ? (
                      <label
                        htmlFor="test-upload"
                        className="flex flex-col items-center justify-center cursor-pointer"
                      >
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-white text-sm font-medium mb-1">
                          Clique ou arraste um MP4
                        </p>
                        <p className="text-xs text-gray-400">
                          Para testar a integração
                        </p>
                      </label>
                    ) : (
                      <div className="text-center">
                        <p className="text-white text-sm font-medium">{uploadFile.name}</p>
                        <p className="text-xs text-gray-400">
                          {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleTestUpload}
                  disabled={!uploadFile || isUploading}
                  className="w-full bg-[#10b981] hover:bg-[#10b981]/90 text-white"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Test Upload
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="border-border/50 h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-[#8b5cf6]" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Features Globais</CardTitle>
                    <CardDescription className="text-gray-400">
                      Configure recursos padrão da plataforma
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

          <motion.div variants={cardVariants}>
            <Card className="border-border/50 h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                      <Copy className="w-5 h-5 text-[#8b5cf6]" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Env Vars Guide</CardTitle>
                      <CardDescription className="text-gray-400">
                        Variáveis de ambiente necessárias
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Object.entries(envVarsConfig).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-white text-xs">{key}</Label>
                      <Input
                        value={value}
                        readOnly
                        className="bg-white/5 border-border/50 text-gray-400 text-xs font-mono"
                      />
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleCopyEnvVars}
                  variant="outline"
                  className="w-full border-border/50 text-white hover:bg-white/5"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy to Vercel (JSON)
                </Button>

                <div className="text-xs text-gray-400 bg-white/5 p-3 rounded-lg border border-border/50">
                  <p className="font-medium text-white mb-1">Como usar:</p>
                  <p>1. Cole o JSON copiado no Vercel</p>
                  <p>2. Settings → Environment Variables</p>
                  <p>3. Import from JSON</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="border-border/50 h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
                    <Database className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Supabase Status</CardTitle>
                    <CardDescription className="text-gray-400">
                      Status da conexão e estatísticas
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-border/50">
                  <div>
                    <p className="text-white font-medium">Conexão</p>
                    <p className="text-sm text-gray-400">Status do banco de dados</p>
                  </div>
                  {supabaseStatus === 'checking' ? (
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  ) : supabaseStatus === 'ok' ? (
                    <Badge className="bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      OK
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                      <XCircle className="w-4 h-4 mr-1" />
                      Erro
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-white/5 border border-border/50">
                    <p className="text-gray-400 text-sm mb-1">Total Vídeos</p>
                    <p className="text-2xl font-bold text-white">
                      {statsData?.count || 0}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-border/50">
                    <p className="text-gray-400 text-sm mb-1">Views Hoje</p>
                    <p className="text-2xl font-bold text-white">
                      {statsData?.views || 0}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={checkSupabaseStatus}
                  variant="outline"
                  className="w-full border-border/50 text-white hover:bg-white/5"
                >
                  <Database className="mr-2 h-4 w-4" />
                  Revalidar Conexão
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
