import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'node:test';
import {
  cloudinaryParamsToSign,
  createCloudinaryUploadSignature,
  sanitizeCloudinaryFolder,
  signCloudinaryUploadParams,
} from '../src/utils/cloudinarySignature.ts';

function sha1(value) {
  return createHash('sha1').update(value).digest('hex');
}

describe('Cloudinary upload signatures', () => {
  it('normalizes folder names into safe Cloudinary paths', () => {
    assert.equal(sanitizeCloudinaryFolder(' Personal Site / Projects / My Demo '), 'personal-site/projects/my-demo');
    assert.equal(sanitizeCloudinaryFolder('../bad path//cover images'), 'bad-path/cover-images');
    assert.equal(sanitizeCloudinaryFolder(''), 'personal-site/uploads');
  });

  it('builds the sorted Cloudinary signature payload and excludes reserved keys', () => {
    assert.equal(
      cloudinaryParamsToSign({
        timestamp: '1778857386',
        folder: 'personal-site/projects',
        api_key: 'not-signed',
        file: 'not-signed',
        signature: 'not-signed',
      }),
      'folder=personal-site/projects&timestamp=1778857386',
    );
  });

  it('signs upload parameters with SHA-1 using the Cloudinary algorithm', async () => {
    const params = {
      timestamp: '1778857386',
      folder: 'personal-site/projects',
    };

    assert.equal(
      await signCloudinaryUploadParams(params, 'demo-secret'),
      sha1('folder=personal-site/projects&timestamp=1778857386demo-secret'),
    );
  });

  it('returns signed direct-upload details for the browser upload flow', async () => {
    const body = await createCloudinaryUploadSignature({
      cloudName: 'demo-cloud',
      apiKey: 'demo-key',
      apiSecret: 'demo-secret',
      folder: 'Personal Site / Projects',
      resourceType: 'auto',
      now: () => 1778857386000,
    });

    assert.equal(body.cloudName, 'demo-cloud');
    assert.equal(body.apiKey, 'demo-key');
    assert.equal(body.uploadUrl, 'https://api.cloudinary.com/v1_1/demo-cloud/auto/upload');
    assert.equal(body.params.folder, 'personal-site/projects');
    assert.equal(body.params.timestamp, '1778857386');
    assert.equal(
      body.params.signature,
      await signCloudinaryUploadParams(
        {
          folder: body.params.folder,
          timestamp: body.params.timestamp,
        },
        'demo-secret',
      ),
    );
  });
});
