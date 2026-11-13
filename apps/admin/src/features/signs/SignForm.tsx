'use client';

import {
  SaveSignRequest,
  SIGN_MAX_IMAGES,
  SignImageContentType,
  type AdminSign,
} from '@libras/contracts';
import { useState, type ChangeEvent, type FormEvent } from 'react';

import { errorMessage } from '@/shared/api/errorMessage';
import {
  Button,
  Card,
  ErrorBanner,
  hintClassName,
  inputClassName,
  labelClassName,
  textareaClassName,
} from '@/shared/ui';

import { imageProblem, UploadError, uploadSignImage } from './signsApi';
import { SignThumb } from './SignThumb';

interface SignFormProps {
  initial?: AdminSign;
  onSave: (sign: SaveSignRequest) => Promise<void>;
  onCancel: () => void;
}

const accept = SignImageContentType.options.join(',');

// An empty description means "not written yet", which the API stores as null.
function toRequest(label: string, imageUrls: string[], alt: string, description: string) {
  return SaveSignRequest.safeParse({
    label,
    imageUrls,
    alt,
    description: description.trim() === '' ? null : description,
  });
}

export function SignForm({ initial, onSave, onCancel }: SignFormProps) {
  const [label, setLabel] = useState(initial?.label ?? '');
  const [imageUrls, setImageUrls] = useState<string[]>(initial?.imageUrls ?? []);
  const [alt, setAlt] = useState(initial?.alt ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [uploading, setUploading] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = toRequest(label, imageUrls, alt, description);
  const room = SIGN_MAX_IMAGES - imageUrls.length;

  async function addImages(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])].slice(0, room);
    event.target.value = '';
    const problem = files.map(imageProblem).find((message) => message !== null);
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);
    setUploading((count) => count + files.length);
    // One at a time, so the frames keep the order in which they were chosen.
    for (const file of files) {
      try {
        const url = await uploadSignImage(file);
        setImageUrls((urls) => [...urls, url]);
      } catch (failure) {
        setError(failure instanceof UploadError ? failure.message : errorMessage(failure));
      } finally {
        setUploading((count) => count - 1);
      }
    }
  }

  function move(index: number, step: -1 | 1) {
    setImageUrls((urls) => {
      const next = [...urls];
      const [url] = next.splice(index, 1);
      if (url !== undefined) next.splice(index + step, 0, url);
      return next;
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!request.success) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(request.data);
    } catch (failure) {
      setError(errorMessage(failure));
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-6" onSubmit={submit}>
      {error && <ErrorBanner>{error}</ErrorBanner>}

      <Card className="grid max-w-3xl gap-5">
        <label className={labelClassName}>
          Nome do sinal
          <input
            className={`${inputClassName} max-w-sm`}
            value={label}
            maxLength={40}
            required
            onChange={(event) => setLabel(event.target.value)}
          />
          <span className={hintClassName}>
            O que o sinal significa, como aparece nas opções dos exercícios (ex.: “A”, “Obrigado”).
          </span>
        </label>

        <fieldset className="grid gap-2">
          <legend className="font-semibold">Imagens</legend>
          <p className={hintClassName}>
            WebP, PNG ou JPEG de até 1 MB. Um sinal com movimento tem uma imagem por etapa, na ordem
            em que é feito.
          </p>
          {imageUrls.length > 0 && (
            <ol className="flex flex-wrap gap-3">
              {imageUrls.map((url, index) => (
                <li key={url} className="grid justify-items-center gap-1">
                  <SignThumb url={url} alt={`Etapa ${index + 1}`} />
                  <span className="text-[12px] text-text-muted">Etapa {index + 1}</span>
                  <div className="flex">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Mover etapa ${index + 1} para trás`}
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      ←
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Mover etapa ${index + 1} para frente`}
                      disabled={index === imageUrls.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      →
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Remover etapa ${index + 1}`}
                      onClick={() => setImageUrls((urls) => urls.filter((_, i) => i !== index))}
                    >
                      ✕
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {room > 0 && (
            <label className="inline-flex min-h-10 cursor-pointer items-center justify-self-start rounded-md bg-surface px-4 font-bold text-text-body shadow-[inset_0_0_0_1px_var(--color-border)] focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-accent">
              {uploading > 0 ? 'Enviando…' : '+ Adicionar imagem'}
              <input
                type="file"
                accept={accept}
                multiple
                className="sr-only"
                disabled={uploading > 0}
                onChange={(event) => void addImages(event)}
              />
            </label>
          )}
        </fieldset>

        <label className={labelClassName}>
          Texto alternativo
          <input
            className={inputClassName}
            value={alt}
            maxLength={200}
            required
            onChange={(event) => setAlt(event.target.value)}
          />
          <span className={hintClassName}>
            Lido por leitores de tela. Descreva a mão (ex.: “Mão fechada, polegar ao lado”), nunca o
            significado: ele entregaria a resposta dos exercícios.
          </span>
        </label>

        <label className={labelClassName}>
          Descrição <span className="font-normal text-text-muted">(opcional)</span>
          <textarea
            className={textareaClassName}
            value={description}
            maxLength={500}
            onChange={(event) => setDescription(event.target.value)}
          />
          <span className={hintClassName}>
            Como executar o sinal, exibido abaixo das imagens. Deixe em branco enquanto não houver
            revisão de um especialista em Libras.
          </span>
        </label>
      </Card>

      <div className="flex gap-2">
        <Button
          variant="primary"
          type="submit"
          disabled={!request.success || saving || uploading > 0}
        >
          {saving ? 'Salvando…' : 'Salvar sinal'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
