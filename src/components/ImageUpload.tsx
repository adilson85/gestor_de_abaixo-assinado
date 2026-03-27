import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
  currentImage?: string;
  maxSize?: number;
  acceptedTypes?: string[];
  className?: string;
  recommendedAspectRatio?: number;
  recommendedAspectLabel?: string;
  recommendedResolution?: string;
}

const getImageDimensions = (file: File): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      resolve({ width: image.width, height: image.height });
      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Não foi possível ler as dimensões da imagem.'));
    };

    image.src = objectUrl;
  });

const centerCropImageToAspectRatio = async (file: File, targetAspectRatio: number): Promise<{ file: File; wasCropped: boolean }> => {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const instance = new Image();
      instance.onload = () => resolve(instance);
      instance.onerror = () => reject(new Error('Não foi possível processar a imagem.'));
      instance.src = objectUrl;
    });

    const currentAspectRatio = image.width / image.height;
    const ratioDifference = Math.abs(currentAspectRatio - targetAspectRatio) / targetAspectRatio;

    if (ratioDifference <= 0.01) {
      return { file, wasCropped: false };
    }

    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = image.width;
    let sourceHeight = image.height;

    if (currentAspectRatio > targetAspectRatio) {
      sourceWidth = image.height * targetAspectRatio;
      sourceX = (image.width - sourceWidth) / 2;
    } else {
      sourceHeight = image.width / targetAspectRatio;
      sourceY = (image.height - sourceHeight) / 2;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(sourceWidth);
    canvas.height = Math.round(sourceHeight);

    const context = canvas.getContext('2d');
    if (!context) {
      return { file, wasCropped: false };
    }

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const outputType = file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg';

    const croppedBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, outputType, 0.92);
    });

    if (!croppedBlob) {
      return { file, wasCropped: false };
    }

    const fileExtension = outputType.split('/')[1] || 'jpg';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const croppedFile = new File([croppedBlob], `${baseName}.${fileExtension}`, {
      type: outputType,
      lastModified: Date.now(),
    });

    return { file: croppedFile, wasCropped: true };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  onImageRemove,
  currentImage,
  maxSize = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className = '',
  recommendedAspectRatio,
  recommendedAspectLabel,
  recommendedResolution,
}) => {
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const onDrop = useCallback(
    async (
      acceptedFiles: File[],
      rejectedFiles: Array<{ file: File; errors: Array<{ code: string; message: string }> }>
    ) => {
      setError('');
      setNotice('');

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

      const file = acceptedFiles[0];
      if (!file) {
        return;
      }

      try {
        let finalFile = file;
        let wasCropped = false;

        if (recommendedAspectRatio) {
          const result = await centerCropImageToAspectRatio(file, recommendedAspectRatio);
          finalFile = result.file;
          wasCropped = result.wasCropped;

          if (!wasCropped) {
            const { width, height } = await getImageDimensions(file);
            const currentAspectRatio = width / height;
            const ratioDifference = Math.abs(currentAspectRatio - recommendedAspectRatio) / recommendedAspectRatio;
            if (ratioDifference > 0.08) {
              setNotice(
                `Esta imagem foge do formato recomendado${recommendedAspectLabel ? ` (${recommendedAspectLabel})` : ''}, mas foi mantida como está.`
              );
            }
          }
        }

        if (wasCropped && recommendedAspectLabel) {
          setNotice(`A imagem foi ajustada automaticamente para o formato ${recommendedAspectLabel}.`);
        }

        onImageUpload(finalFile);
      } catch (processingError) {
        console.error('Erro ao processar imagem:', processingError);
        setError('Não foi possível preparar a imagem de capa.');
      }
    },
    [maxSize, onImageUpload, recommendedAspectLabel, recommendedAspectRatio]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': acceptedTypes,
    },
    maxSize: maxSize * 1024 * 1024,
    multiple: false,
  });

  const handleRemove = () => {
    setError('');
    setNotice('');
    onImageRemove();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {(recommendedAspectLabel || recommendedResolution) && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {recommendedAspectLabel ? (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
              Proporção sugerida: {recommendedAspectLabel}
            </span>
          ) : null}
          {recommendedResolution ? (
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              Resolução ideal: {recommendedResolution}
            </span>
          ) : null}
        </div>
      )}

      {currentImage ? (
        <div className="relative">
          <div className="group relative">
            <img
              src={currentImage}
              alt="Abaixo-assinado"
              className="aspect-video w-full rounded-lg border border-gray-200 object-cover dark:border-gray-600"
            />
            <button
              onClick={handleRemove}
              className="absolute right-2 top-2 rounded-full bg-red-500 p-2 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
              type="button"
              title="Remover imagem"
            >
              <X size={20} />
            </button>
          </div>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Passe o mouse sobre a imagem para ver o botão de remover
          </p>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            aspect-video flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors
            ${
              isDragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500'
            }
            ${error ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4">
            {isDragActive ? (
              <Upload size={48} className="text-blue-500" />
            ) : (
              <ImageIcon size={48} className="text-gray-400 dark:text-gray-500" />
            )}
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {isDragActive ? 'Solte a imagem aqui' : 'Arraste uma imagem ou clique para selecionar'}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                JPG, PNG ou WebP até {maxSize}MB
              </p>
            </div>
          </div>
        </div>
      )}

      {error ? (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={16} />
          {error}
        </div>
      ) : null}

      {notice && !error ? (
        <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
          <AlertCircle size={16} />
          {notice}
        </div>
      ) : null}
    </div>
  );
};
