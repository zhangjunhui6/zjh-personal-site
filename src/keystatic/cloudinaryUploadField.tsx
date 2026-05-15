import type { BasicFormField, FormFieldInputProps, FormFieldStoredValue } from '@keystatic/core';
import React, { useEffect, useId, useRef, useState } from 'react';

type CloudinaryResourceType = 'image' | 'video' | 'auto';

type CloudinaryUploadFieldOptions = {
  label: string;
  description?: string;
  validation?: {
    isRequired?: boolean;
  };
  folder: string;
  accept?: string;
  resourceType?: CloudinaryResourceType;
};

type CloudinarySignatureResponse = {
  cloudName: string;
  apiKey: string;
  uploadUrl: string;
  params: Record<string, string>;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  error?: {
    message?: string;
  };
};

const TOKEN_STORAGE_KEY = 'zjh-personal-site:media-upload-token';

export function cloudinaryUploadField(options: CloudinaryUploadFieldOptions): BasicFormField<string, string, string> {
  const isRequired = options.validation?.isRequired === true;

  return {
    kind: 'form',
    label: options.label,
    Input(props) {
      return <CloudinaryUploadInput {...props} {...options} isRequired={isRequired} />;
    },
    defaultValue() {
      return '';
    },
    parse(value) {
      return parseStoredString(value);
    },
    serialize(value) {
      const trimmed = value.trim();

      return {
        value: trimmed === '' ? undefined : trimmed,
      };
    },
    validate(value) {
      return validateValue(value, options.label, isRequired);
    },
    reader: {
      parse(value) {
        return validateValue(parseStoredString(value), options.label, isRequired);
      },
    },
  };
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

function validateValue(value: string, label: string, isRequired: boolean) {
  const trimmed = value.trim();

  if (isRequired && trimmed.length === 0) {
    throw new Error(`${label} is required.`);
  }

  return trimmed;
}

function CloudinaryUploadInput(
  props: FormFieldInputProps<string> &
    CloudinaryUploadFieldOptions & {
      isRequired: boolean;
    },
) {
  const inputId = useId();
  const tokenId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [token, setToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const requiredError = props.forceValidation && props.isRequired && props.value.trim().length === 0 ? `${props.label} is required.` : '';
  const visibleError = error || requiredError;

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? '';
    setToken(storedToken);
    setShowTokenInput(storedToken.length === 0);
  }, []);

  async function uploadFile(file: File) {
    const uploadToken = token.trim();

    if (!uploadToken) {
      setError('Enter the media upload token before uploading.');
      setShowTokenInput(true);
      return;
    }

    setIsUploading(true);
    setError('');
    setStatus(`Uploading ${file.name}...`);

    try {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, uploadToken);
      const signature = await requestUploadSignature(uploadToken, props.folder, props.resourceType ?? 'auto');
      const uploadResult = await uploadToCloudinary(file, signature);

      if (!uploadResult.secure_url) {
        throw new Error('Cloudinary did not return a secure URL.');
      }

      props.onChange(uploadResult.secure_url);
      setStatus(`Uploaded ${file.name}.`);
      setShowTokenInput(false);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.');
      setStatus('');
    } finally {
      setIsUploading(false);
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
        value={props.value}
        onChange={(event) => props.onChange(event.currentTarget.value)}
        placeholder="Paste a URL, or upload to Cloudinary"
        style={{ ...styles.textInput, ...(visibleError ? styles.invalidInput : {}) }}
      />
      <div style={styles.actions}>
        <input
          ref={fileInputRef}
          type="file"
          accept={props.accept ?? 'image/*'}
          hidden
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';

            if (file) {
              void uploadFile(file);
            }
          }}
        />
        <button type="button" style={styles.button} disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
        {token && !showTokenInput ? (
          <button type="button" style={styles.secondaryButton} onClick={() => setShowTokenInput(true)}>
            Change token
          </button>
        ) : null}
      </div>
      {showTokenInput ? (
        <div style={styles.tokenRow}>
          <label htmlFor={tokenId} style={styles.tokenLabel}>
            Upload token
          </label>
          <input
            id={tokenId}
            type="password"
            value={token}
            onChange={(event) => setToken(event.currentTarget.value)}
            placeholder="MEDIA_UPLOAD_TOKEN"
            style={styles.tokenInput}
          />
        </div>
      ) : null}
      {status ? <p style={styles.status}>{status}</p> : null}
      {visibleError ? <p style={styles.error}>{visibleError}</p> : null}
      {props.value && isPreviewableImage(props.value) ? (
        <div style={styles.preview}>
          <img src={props.value} alt="" style={styles.previewImage} />
        </div>
      ) : null}
    </div>
  );
}

function isPreviewableImage(value: string) {
  return /\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i.test(value) || value.includes('/image/upload/');
}

async function requestUploadSignature(token: string, folder: string, resourceType: CloudinaryResourceType) {
  const response = await fetch('/api/media-upload-signature', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ folder, resourceType }),
  });
  const data = (await response.json()) as CloudinarySignatureResponse & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? 'Could not create a Cloudinary upload signature.');
  }

  return data;
}

async function uploadToCloudinary(file: File, signature: CloudinarySignatureResponse) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signature.apiKey);

  for (const [key, value] of Object.entries(signature.params)) {
    formData.append(key, value);
  }

  const response = await fetch(signature.uploadUrl, {
    method: 'POST',
    body: formData,
  });
  const data = (await response.json()) as CloudinaryUploadResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? 'Cloudinary upload failed.');
  }

  return data;
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
  tokenRow: {
    display: 'grid',
    gap: 4,
  },
  tokenLabel: {
    color: '#5f6368',
    fontSize: 12,
    fontWeight: 600,
  },
  tokenInput: {
    border: '1px solid #c7cdd4',
    borderRadius: 6,
    font: 'inherit',
    minHeight: 34,
    padding: '6px 10px',
    width: '100%',
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
