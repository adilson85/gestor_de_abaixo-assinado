import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, Globe2, Link2, Save } from 'lucide-react';
import { generateSlug, validateName } from '../utils/validation';
import { getPetitions, savePetition } from '../utils/supabase-storage';
import { ImageUpload } from '../components/ImageUpload';
import { deleteImage, uploadImage } from '../utils/image-storage';
import { getPublicPetitionUrl } from '../utils/public-url';
import { getPublicationChecklist, isPublicationReady, validatePetitionSlug } from '../utils/publication-readiness';

export const CreatePetition: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [existingSlugs, setExistingSlugs] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [collectionDate, setCollectionDate] = useState('');
  const [responsible, setResponsible] = useState('');
  const [availableOnline, setAvailableOnline] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    const loadExistingSlugs = async () => {
      const petitions = await getPetitions();
      setExistingSlugs(petitions.map((petition) => petition.slug.toLowerCase()));
    };

    loadExistingSlugs();
  }, []);

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    setUploadError('');
    if (errors.imageUrl) {
      setErrors((prev) => ({ ...prev, imageUrl: '' }));
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(undefined);
    setUploadError('');
    if (errors.imageUrl) {
      setErrors((prev) => ({ ...prev, imageUrl: '' }));
    }
  };

  const normalizedSlug = slug.trim().toLowerCase();
  const slugError = validatePetitionSlug(normalizedSlug);
  const slugTaken = normalizedSlug ? existingSlugs.includes(normalizedSlug) : false;
  const publicationChecklist = getPublicationChecklist({
    name,
    slug: normalizedSlug,
    description,
    imageUrl: imagePreview,
    isSlugUnique: !slugTaken,
  });
  const publicationReady = isPublicationReady({
    name,
    slug: normalizedSlug,
    description,
    imageUrl: imagePreview,
    isSlugUnique: !slugTaken,
  });
  const previewUrl = getPublicPetitionUrl(normalizedSlug || 'slug-da-campanha');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const newErrors: { [key: string]: string } = {};

    const nameError = validateName(name);
    if (nameError) newErrors.name = nameError;

    const latestSlugs =
      existingSlugs.length > 0
        ? existingSlugs
        : (await getPetitions()).map((petition) => petition.slug.toLowerCase());
    const slugAlreadyExists = normalizedSlug ? latestSlugs.includes(normalizedSlug) : false;

    if (slugError) {
      newErrors.slug = slugError;
    } else if (slugAlreadyExists) {
      newErrors.slug = 'Já existe uma campanha com esta URL pública';
    }

    if (availableOnline && !imageFile) {
      newErrors.imageUrl = 'Envie uma imagem de capa para publicar este abaixo-assinado online';
    }

    if (availableOnline && !publicationReady) {
      newErrors.general = 'Preencha o checklist de publicação antes de ativar a página pública.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    let imageUrl: string | undefined;

    try {
      if (availableOnline && imageFile) {
        const uploadResult = await uploadImage(imageFile);
        if (!uploadResult.success || !uploadResult.url) {
          setUploadError(uploadResult.error || 'Erro ao fazer upload da imagem de capa');
          setIsLoading(false);
          return;
        }

        imageUrl = uploadResult.url;
        setUploadError('');
      }

      const savedPetition = await savePetition({
        name: name.trim(),
        slug: normalizedSlug,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        collectionDate: collectionDate ? new Date(collectionDate) : undefined,
        responsible: responsible.trim() || undefined,
        imageUrl,
        availableOnline,
      });

      if (savedPetition) {
        navigate('/petitions');
        return;
      }

      if (imageUrl) {
        await deleteImage(imageUrl);
      }
      setErrors({ general: 'Erro ao criar abaixo-assinado. Tente novamente.' });
    } catch (error) {
      if (imageUrl) {
        await deleteImage(imageUrl);
      }
      console.error('Error creating petition:', error);
      setErrors({ general: 'Erro ao criar abaixo-assinado. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/petitions')}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <ArrowLeft size={20} />
          Voltar para lista
        </button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Criar Abaixo-Assinado</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-300">
          Cadastre a campanha e prepare a página pública com checklist de publicação antes de divulgar.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {errors.general ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/30">
                <p className="text-sm text-red-600 dark:text-red-300">{errors.general}</p>
              </div>
            ) : null}

            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome do Abaixo-Assinado *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => {
                  const value = e.target.value;
                  setName(value);
                  if (!slugEdited) {
                    setSlug(generateSlug(value));
                  }
                  if (errors.name || errors.general) {
                    setErrors((prev) => ({ ...prev, name: '', general: '' }));
                  }
                }}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-300 ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Digite o nome do abaixo-assinado"
              />
              {errors.name ? <p className="mt-1 text-sm text-red-600 dark:text-red-300">{errors.name}</p> : null}
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Descrição
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.general) {
                    setErrors((prev) => ({ ...prev, general: '' }));
                  }
                }}
                rows={4}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-300"
                placeholder="Explique o objetivo da mobilização e o que está em jogo."
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Para publicação online, use pelo menos 24 caracteres de contexto.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="location" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Local da Coleta
                </label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-300"
                  placeholder="Ex: Praça Central, Escola Municipal..."
                />
              </div>

              <div>
                <label htmlFor="collectionDate" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Data da Coleta
                </label>
                <input
                  type="date"
                  id="collectionDate"
                  value={collectionDate}
                  onChange={(e) => setCollectionDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="responsible" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Responsável pela Coleta
              </label>
              <input
                type="text"
                id="responsible"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-300"
                placeholder="Nome do responsável pela coleta"
              />
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/30">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="availableOnline"
                  checked={availableOnline}
                  onChange={(e) => {
                    setAvailableOnline(e.target.checked);
                    if (!e.target.checked) {
                      setUploadError('');
                      setErrors((prev) => ({ ...prev, imageUrl: '', slug: '', general: '' }));
                    }
                  }}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="availableOnline" className="block text-sm font-medium text-blue-900 dark:text-blue-100">
                    Disponibilizar para Assinatura Online
                  </label>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-200">
                    Ative quando a campanha estiver pronta para divulgação pública com link próprio, capa e contexto mínimo.
                  </p>
                </div>
              </div>
            </div>

            {availableOnline ? (
              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Publicação online</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      Revise a URL pública, envie a capa e confirme os requisitos antes de publicar.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="slug" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      URL pública da campanha *
                    </label>
                    <div className="flex items-center rounded-lg border border-gray-300 bg-white px-3 focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-gray-700">
                      <Link2 size={16} className="text-gray-400" />
                      <input
                        id="slug"
                        type="text"
                        value={slug}
                        onChange={(e) => {
                          setSlugEdited(true);
                          setSlug(generateSlug(e.target.value));
                          if (errors.slug || errors.general) {
                            setErrors((prev) => ({ ...prev, slug: '', general: '' }));
                          }
                        }}
                        className="w-full bg-transparent px-3 py-2 text-sm text-gray-900 outline-none dark:text-white"
                        placeholder="url-da-campanha"
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{previewUrl}</p>
                    {slugError ? <p className="mt-1 text-sm text-red-600 dark:text-red-300">{slugError}</p> : null}
                    {!slugError && slugTaken ? (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-300">Essa URL já está em uso.</p>
                    ) : null}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Capa da página pública *</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      Essa imagem será usada como capa do abaixo-assinado publicado no site.
                    </p>

                    <div className="mt-4">
                      <ImageUpload
                        onImageUpload={handleImageUpload}
                        onImageRemove={handleImageRemove}
                        currentImage={imagePreview}
                        maxSize={5}
                        acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                        recommendedAspectRatio={16 / 9}
                        recommendedAspectLabel="16:9"
                        recommendedResolution="1200 x 675 px"
                      />
                    </div>

                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      A imagem será ajustada automaticamente para o formato 16:9.
                    </p>

                    {errors.imageUrl ? <p className="mt-2 text-sm text-red-600 dark:text-red-300">{errors.imageUrl}</p> : null}
                    {uploadError ? (
                      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-700 dark:bg-red-900/30">
                        <p className="text-sm text-red-600 dark:text-red-300">{uploadError}</p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <aside className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-gray-800">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-200">
                    <Globe2 size={16} />
                    Prévia da publicação
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Prévia da capa" className="aspect-video w-full object-cover" />
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-slate-950 via-blue-900 to-cyan-500 p-5 text-white">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">Prévia pública</p>
                        <p className="mt-3 text-xl font-semibold leading-tight">{name || 'Nome da campanha'}</p>
                      </div>
                    )}

                    <div className="space-y-3 p-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          URL pública
                        </p>
                        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 break-all">{previewUrl}</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-950 dark:text-white">
                          {name || 'Sua campanha aparecerá aqui'}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {description.trim()
                            ? description.trim().slice(0, 180) + (description.trim().length > 180 ? '...' : '')
                            : 'Adicione uma descrição para mostrar o contexto da mobilização antes de publicar.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">Checklist de publicação</p>
                    <div className="mt-4 space-y-3">
                      {publicationChecklist.map((item) => (
                        <div key={item.id} className="flex items-start gap-3">
                          {item.complete ? (
                            <CheckCircle2 size={18} className="mt-0.5 text-emerald-600 dark:text-emerald-300" />
                          ) : (
                            <Circle size={18} className="mt-0.5 text-slate-400 dark:text-slate-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.label}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className={`mt-4 rounded-xl px-3 py-2 text-sm font-medium ${publicationReady ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200'}`}>
                      {publicationReady
                        ? 'Pronto para publicar online.'
                        : 'Complete o checklist para liberar a divulgação pública.'}
                    </div>
                  </div>
                </aside>
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex items-center justify-end gap-4 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => navigate('/petitions')}
              className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={20} />
              {isLoading ? 'Salvando...' : 'Cadastrar Abaixo-Assinado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
