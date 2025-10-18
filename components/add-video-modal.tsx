'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Upload, X, Video } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const videoSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  file: z.instanceof(File).refine(
    (file) => file.type === 'video/mp4',
    'Apenas arquivos MP4 são permitidos'
  ).refine(
    (file) => file.size <= 500 * 1024 * 1024,
    'Arquivo deve ter menos de 500MB'
  ),
  autoplay: z.boolean(),
  showFakeBar: z.boolean(),
  barColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
});

interface AddVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddVideoModal({ open, onOpenChange }: AddVideoModalProps) {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [autoplay, setAutoplay] = useState(true);
  const [showFakeBar, setShowFakeBar] = useState(false);
  const [barColor, setBarColor] = useState('#8b5cf6');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setFile(null);
    setAutoplay(true);
    setShowFakeBar(false);
    setBarColor('#8b5cf6');
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
      if (droppedFile.size > 500 * 1024 * 1024) {
        toast.error('Arquivo deve ter menos de 500MB');
        return;
      }
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'video/mp4') {
        toast.error('Apenas arquivos MP4 são permitidos');
        return;
      }
      if (selectedFile.size > 500 * 1024 * 1024) {
        toast.error('Arquivo deve ter menos de 500MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error('Selecione um arquivo de vídeo');
      return;
    }

    try {
      const validatedData = videoSchema.parse({
        name,
        file,
        autoplay,
        showFakeBar,
        barColor,
      });

      setIsSubmitting(true);

      toast.loading('Fazendo upload do vídeo...', { id: 'upload' });

      const uploadFormData = new FormData();
      uploadFormData.append('file', validatedData.file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      // Lê o body UMA VEZ só como texto
      const uploadBodyText = await uploadResponse.text();
      if (!uploadResponse.ok) {
        console.error('Upload error:', uploadResponse.status, uploadBodyText);
        toast.error(`Erro no upload ${uploadResponse.status}: ${uploadBodyText.slice(0, 100)}`);
        return;
      }

      let uploadData;
      try {
        uploadData = JSON.parse(uploadBodyText);
      } catch (parseErr) {
        console.error('JSON parse error for upload:', parseErr);
        toast.error('Resposta inválida do upload.');
        return;
      }

      toast.loading('Salvando informações do vídeo...', { id: 'upload' });

      const saveResponse = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: validatedData.name,
          url: uploadData.url,
          autoplay: validatedData.autoplay,
          showFakeBar: validatedData.showFakeBar,
          barColor: validatedData.barColor,
          duration: uploadData.duration || 0,
          format: uploadData.format || 'mp4',
          width: uploadData.width || 0,
          height: uploadData.height || 0,
          bytes: uploadData.bytes || 0,
        }),
      });

      // Lê o body UMA VEZ só como texto para save também
      const saveBodyText = await saveResponse.text();
      if (!saveResponse.ok) {
        console.error('Save error:', saveResponse.status, saveBodyText);
        toast.error(`Erro ao salvar ${saveResponse.status}: ${saveBodyText.slice(0, 100)}`);
        return;
      }

      let saveData;
      try {
        saveData = JSON.parse(saveBodyText);
      } catch (parseErr) {
        console.error('JSON parse error for save:', parseErr);
        toast.error('Resposta inválida do save.');
        return;
      }

      toast.success('Vídeo adicionado com sucesso!', {
        id: 'upload',
        description: `${validatedData.name} foi adicionado à sua biblioteca`,
      });

      resetForm();
      onOpenChange(false);

      window.location.reload();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message, { id: 'upload' });
      } else if (error instanceof Error) {
        toast.error(error.message, { id: 'upload' });
      } else {
        toast.error('Erro ao adicionar vídeo', { id: 'upload' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open && !isSubmitting) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <AnimatePresence>
        {open && (
          <DialogContent className="bg-[#0a0a0a] border-border/50 max-w-2xl max-h-[90vh] overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle className="text-white text-2xl">Adicionar Vídeo</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Faça upload de um novo vídeo MP4 (máx. 500MB) e configure as opções
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">
                    Nome do Vídeo
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Digite o nome do vídeo"
                    className="bg-white/5 border-border/50 text-white placeholder:text-gray-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Arquivo de Vídeo</Label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                      relative border-2 border-dashed rounded-lg p-8 transition-all
                      ${isDragging
                        ? 'border-[#8b5cf6] bg-[#8b5cf6]/10'
                        : 'border-border/50 bg-white/5'
                      }
                      ${file ? 'border-[#10b981]' : ''}
                    `}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      accept="video/mp4"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {!file ? (
                      <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center cursor-pointer"
                      >
                        <motion.div
                          animate={{ y: isDragging ? -10 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Upload className="w-12 h-12 text-gray-400 mb-4" />
                        </motion.div>
                        <p className="text-white font-medium mb-1">
                          Clique ou arraste um arquivo MP4
                        </p>
                        <p className="text-sm text-gray-400">
                          Máximo 500MB
                        </p>
                      </label>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
                            <Video className="w-6 h-6 text-[#10b981]" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{file.name}</p>
                            <p className="text-sm text-gray-400">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setFile(null)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-border/50">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoplay" className="text-white">
                        Autoplay
                      </Label>
                      <p className="text-sm text-gray-400">
                        Reproduzir automaticamente
                      </p>
                    </div>
                    <Switch
                      id="autoplay"
                      checked={autoplay}
                      onCheckedChange={setAutoplay}
                      className="data-[state=checked]:bg-[#8b5cf6]"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-border/50">
                    <div className="space-y-0.5">
                      <Label htmlFor="fake-bar" className="text-white">
                        Barra Fake
                      </Label>
                      <p className="text-sm text-gray-400">
                        Mostrar barra falsa
                      </p>
                    </div>
                    <Switch
                      id="fake-bar"
                      checked={showFakeBar}
                      onCheckedChange={setShowFakeBar}
                      className="data-[state=checked]:bg-[#8b5cf6]"
                    />
                  </div>
                </div>

                <motion.div
                  initial={false}
                  animate={{
                    height: showFakeBar ? 'auto' : 0,
                    opacity: showFakeBar ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2">
                    <Label htmlFor="bar-color" className="text-white">
                      Cor da Barra
                    </Label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Input
                          id="bar-color"
                          type="text"
                          value={barColor}
                          onChange={(e) => setBarColor(e.target.value)}
                          placeholder="#8b5cf6"
                          className="bg-white/5 border-border/50 text-white pl-12"
                          pattern="^#[0-9A-Fa-f]{6}$"
                        />
                        <div
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded border-2 border-white/20"
                          style={{ backgroundColor: barColor }}
                        />
                      </div>
                      <input
                        type="color"
                        value={barColor}
                        onChange={(e) => setBarColor(e.target.value)}
                        className="w-14 h-10 rounded border border-border/50 cursor-pointer"
                      />
                    </div>
                  </div>
                </motion.div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleClose(false)}
                    disabled={isSubmitting}
                    className="flex-1 border-border/50 text-white hover:bg-white/5"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !file || !name}
                    className="flex-1 bg-[#10b981] hover:bg-[#10b981]/90 text-white"
                  >
                    {isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Upload className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      'Salvar Vídeo'
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
