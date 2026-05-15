import type { AssetFormField, FormFieldInputProps, FormFieldStoredValue } from '@keystatic/core';
import React, { useEffect, useId, useRef, useState } from 'react';

type RepoMediaAsset = {
  data: Uint8Array;
  extension: string;
  filename: string;
};

export type RepoMediaValue = {
  src: string;
  asset: RepoMediaAsset | null;
};

type RepoMediaFieldOptions = {
  label: string;
  description?: string;
  validation?: {
    isRequired?: boolean;
  };
  directory: string;
  publicPath: string;
  accept?: string;
};

const emptyValue = (): RepoMediaValue => ({ src: '', asset: null });

export function repoMediaField(options: RepoMediaFieldOptions): AssetFormField<RepoMediaValue, RepoMediaValue, string> {
  const isRequired = options.validation?.isRequired === true;

  return {
    kind: 'form',
    formKind: 'asset',
    label: options.label,
    directory: trimTrailingSlash(options.directory),
    Input(props) {
      return <RepoMediaInput {...props} {...options} isRequired={isRequired} />;
    },
    defaultValue: emptyValue,
    filename(value, args) {
      return localAssetFilename(value, options.publicPath, args.slug);
    },
    parse(value, args) {
      const src = parseStoredString(value);
      const filename = localAssetFilename(value, options.publicPath, args.slug);

      if (!src) {
        return emptyValue();
      }

      return {
        src,
        asset:
          filename && args.asset
            ? {
                data: args.asset,
                extension: extensionFromFilename(filename),
                filename,
              }
            : null,
      };
    },
    serialize(value, args) {
      if (value.asset) {
        const extension = value.asset.extension || extensionFromFilename(value.asset.filename) || 'bin';
        const filename = args.suggestedFilenamePrefix
          ? `${args.suggestedFilenamePrefix}.${extension}`
          : ensureFilenameExtension(value.asset.filename, extension);

        return {
          value: `${publicPrefix(options.publicPath, args.slug)}${filename}`,
          asset: {
            filename,
            content: value.asset.data,
          },
        };
      }

      const src = value.src.trim();

      return {
        value: src === '' ? undefined : src,
        asset: undefined,
      };
    },
    validate(value) {
      return validateValue(value, options.label, isRequired);
    },
    reader: {
      parse(value) {
        const src = parseStoredString(value);
        validateValue({ src, asset: null }, options.label, isRequired);

        return src;
      },
    },
  };
}

export function repoMediaValueLabel(value: RepoMediaValue | null | undefined) {
  return value?.asset?.filename || value?.src || '';
}

function RepoMediaInput(
  props: FormFieldInputProps<RepoMediaValue> &
    RepoMediaFieldOptions & {
      isRequired: boolean;
    },
) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const requiredError =
    props.forceValidation && props.isRequired && !hasMediaValue(props.value) ? `${props.label} is required.` : '';
  const visibleError = error || requiredError;
  const visibleValue = props.value.asset ? props.value.asset.filename : props.value.src;
  const previewSrc = previewUrl || (isPreviewableImage(props.value.src) ? props.value.src : '');

  useEffect(() => {
    if (!props.value.asset || !isPreviewableImage(props.value.asset.filename)) {
      setPreviewUrl('');
      return;
    }

    const blob = new Blob([arrayBufferFromBytes(props.value.asset.data)], {
      type: mimeTypeFromExtension(props.value.asset.extension),
    });
    const objectUrl = URL.createObjectURL(blob);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [props.value.asset]);

  async function stageFile(file: File) {
    setError('');
    setStatus('');

    try {
      const data = new Uint8Array(await file.arrayBuffer());
      const filename = sanitizeFilename(file.name);
      const extension = extensionFromFilename(filename) || extensionFromMimeType(file.type) || 'bin';

      props.onChange({
        src: props.value.src,
        asset: {
          data,
          extension,
          filename: ensureFilenameExtension(filename, extension),
        },
      });
      setStatus(`Ready to save ${file.name}.`);
    } catch (stageError) {
      setError(stageError instanceof Error ? stageError.message : 'Could not read the selected file.');
    }
  }

  return (
    <div style={styles.wrapper}>
      <label htmlFor={inputId} style={styles.label}>
        {props.label}
        {props.isRequired ? <span aria-hidden="true"> *</span> : null}
      </label>
      {props.description ? <p style={styles.description}>{props.description}</p> : null}
      <input
        id={inputId}
        autoFocus={props.autoFocus}
        value={visibleValue}
        onChange={(event) => {
          props.onChange({ src: event.currentTarget.value, asset: null });
          setStatus('');
          setError('');
        }}
        placeholder="Paste a URL, or choose a file"
        style={{ ...styles.textInput, ...(visibleError ? styles.invalidInput : {}) }}
      />
      <div style={styles.actions}>
        <input
          ref={fileInputRef}
          type="file"
          accept={props.accept}
          hidden
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';

            if (file) {
              void stageFile(file);
            }
          }}
        />
        <button type="button" style={styles.button} onClick={() => fileInputRef.current?.click()}>
          Choose file
        </button>
        {props.value.asset ? (
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => {
              props.onChange({ src: props.value.src, asset: null });
              setStatus('');
            }}
          >
            Clear selected file
          </button>
        ) : null}
      </div>
      {status ? <p style={styles.status}>{status}</p> : null}
      {visibleError ? <p style={styles.error}>{visibleError}</p> : null}
      {previewSrc ? (
        <div style={styles.preview}>
          <img src={previewSrc} alt="" style={styles.previewImage} />
        </div>
      ) : null}
    </div>
  );
}

function parseStoredString(value: FormFieldStoredValue) {
  if (value === undefined) {
    return '';
  }

  if (typeof value !== 'string') {
    throw new Error('Must be a string');
  }

  return value;
}

function validateValue(value: RepoMediaValue, label: string, isRequired: boolean) {
  const src = value.src.trim();

  if (isRequired && !value.asset && src.length === 0) {
    throw new Error(`${label} is required.`);
  }

  return { ...value, src };
}

function hasMediaValue(value: RepoMediaValue) {
  return value.asset !== null || value.src.trim().length > 0;
}

function localAssetFilename(value: FormFieldStoredValue, publicPath: string, slug: string | undefined) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const prefix = publicPrefix(publicPath, slug);

  if (!value.startsWith(prefix)) {
    return undefined;
  }

  const filename = value.slice(prefix.length);

  return filename.length > 0 ? filename : undefined;
}

function publicPrefix(publicPath: string, slug: string | undefined) {
  const base = trimTrailingSlash(publicPath);

  return `${base}/${slug ? `${slug}/` : ''}`;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function sanitizeFilename(filename: string) {
  const cleaned = filename
    .trim()
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    ?.replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return cleaned || 'media.bin';
}

function ensureFilenameExtension(filename: string, extension: string) {
  return extensionFromFilename(filename) ? filename : `${filename}.${extension}`;
}

function extensionFromFilename(filename: string) {
  return filename.match(/\.([^.]+)$/)?.[1]?.toLowerCase() ?? '';
}

function extensionFromMimeType(mimeType: string) {
  const mimeMap: Record<string, string> = {
    'image/avif': 'avif',
    'image/gif': 'gif',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/svg+xml': 'svg',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
  };

  return mimeMap[mimeType] ?? '';
}

function mimeTypeFromExtension(extension: string) {
  const mimeMap: Record<string, string> = {
    avif: 'image/avif',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    webp: 'image/webp',
  };

  return mimeMap[extension] ?? 'application/octet-stream';
}

function arrayBufferFromBytes(bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);

  return buffer;
}

function isPreviewableImage(value: string) {
  return /\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i.test(value) || value.includes('/image/upload/');
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'grid',
    gap: 8,
    maxWidth: 680,
  },
  label: {
    color: '#202124',
    fontSize: 14,
    fontWeight: 600,
  },
  description: {
    color: '#5f6368',
    fontSize: 13,
    lineHeight: 1.45,
    margin: 0,
  },
  textInput: {
    border: '1px solid #c7cdd4',
    borderRadius: 6,
    font: 'inherit',
    minHeight: 38,
    padding: '7px 10px',
    width: '100%',
  },
  invalidInput: {
    borderColor: '#d93025',
  },
  actions: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    background: '#202124',
    border: '1px solid #202124',
    borderRadius: 6,
    color: '#fff',
    cursor: 'pointer',
    font: 'inherit',
    fontSize: 13,
    fontWeight: 600,
    padding: '7px 12px',
  },
  secondaryButton: {
    background: '#fff',
    border: '1px solid #c7cdd4',
    borderRadius: 6,
    color: '#202124',
    cursor: 'pointer',
    font: 'inherit',
    fontSize: 13,
    padding: '7px 12px',
  },
  status: {
    color: '#137333',
    fontSize: 13,
    margin: 0,
  },
  error: {
    color: '#d93025',
    fontSize: 13,
    margin: 0,
  },
  preview: {
    border: '1px solid #e2e5e9',
    borderRadius: 6,
    display: 'inline-flex',
    justifySelf: 'start',
    padding: 6,
  },
  previewImage: {
    display: 'block',
    maxHeight: 160,
    maxWidth: '100%',
  },
};
