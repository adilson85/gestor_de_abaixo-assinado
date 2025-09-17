import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
  currentImage?: string;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  onImageRemove,
  currentImage,
  maxSize = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className = '',
}) => {
  const [error, setError] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError('');
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError(`Arquivo muito grande. Tamanho máximo: ${maxSize}MB`);
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Tipo de arquivo não suportado. Use JPG, PNG ou WebP');
      } else {
        setError('Erro ao fazer upload da imagem');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      onImageUpload(acceptedFiles[0]);
    }
  }, [onImageUpload, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': acceptedTypes,
    },
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    multiple: false,
  });

  const handleRemove = () => {
    setError('');
    onImageRemove();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {currentImage ? (
        <div className="relative">
          <div className="relative group">
            <img
              src={currentImage}
              alt="Abaixo-assinado"
              className="w-full h-64 object-cover rounded-lg border border-gray-200"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              type="button"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-gray-600 text-center">
            Clique na imagem para alterar
          </p>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${error ? 'border-red-500 bg-red-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4">
            {isDragActive ? (
              <Upload size={48} className="text-blue-500" />
            ) : (
              <ImageIcon size={48} className="text-gray-400" />
            )}
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Solte a imagem aqui' : 'Arraste uma imagem ou clique para selecionar'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                JPG, PNG ou WebP até {maxSize}MB
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </div>
  );
};
