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

      // Lê o body UMA VEZ como text para evitar "stream already read"
      const uploadBodyText = await uploadResponse.text();
      if (!uploadResponse.ok) {
        console.error('Upload error:', uploadResponse.status, uploadBodyText);
        toast.error(`Erro no upload ${uploadResponse.status}: ${uploadBodyText.slice(0, 100)}...`);
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
          video_url: uploadData.url, // Muda de 'url' para 'video_url' pra bater com DB
          autoplay: validatedData.autoplay,
          show_fake_bar: validatedData.showFakeBar, // Mapeia pro nome da column
          bar_color: validatedData.barColor, // Usa 'bar_color' pra bater com DB
          // Não salva campos extras pra evitar "column not found"
        }),
      });

      const saveBodyText = await saveResponse.text();
      if (!saveResponse.ok) {
        console.error('Save error:', saveResponse.status, saveBodyText);
        toast.error(`Erro ao salvar ${saveResponse.status}: ${saveBodyText.slice(0, 100)}...`);
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
        const firstError = error.errors
