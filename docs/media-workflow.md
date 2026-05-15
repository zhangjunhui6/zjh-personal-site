# Media Workflow

This site supports three media source styles in `Cover`, `Media`, and legacy Journal `Images` fields:

- Local static paths: `/images/...` and `/videos/...`.
- Full hosted URLs: Cloudinary, YouTube poster images, or any public CDN URL.
- Future R2 keys: `images/...` or `r2:/images/...` resolved through `PUBLIC_MEDIA_BASE_URL`.

The current default is local static files plus Cloudinary Free. R2 is optional and can wait until Cloudflare billing is available.

## Option 1: Local Static Files

Use local files for images, diagrams, and short demo videos that are safe to keep in the repository.

Recommended paths:

```text
public/images/notes/<slug>/cover.webp
public/images/journal/<slug>/001.webp
public/videos/projects/<slug>/demo.mp4
public/videos/projects/<slug>/demo-poster.webp
```

Use these values in Keystatic:

```text
/images/notes/<slug>/cover.webp
/images/journal/<slug>/001.webp
/videos/projects/<slug>/demo.mp4
/videos/projects/<slug>/demo-poster.webp
```

Keep files small:

- Images: prefer `.webp`.
- Videos: prefer compressed `.mp4` or `.webm`.
- Cloudflare Pages has a per-asset size limit, so local videos should stay short.

## Option 2: Cloudinary Free

Use Cloudinary for files you do not want in Git, larger media experiments, or media that benefits from hosted management. Cloudinary Free does not require a credit card.

The preferred workflow is to upload directly inside Keystatic. `Cover`, `Media` source fields, and legacy Journal `Images` fields show an upload button next to the URL input. The browser uploads the file directly to Cloudinary after the site API creates a signed upload request.

Configure these variables locally and in Cloudflare Pages:

```text
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
MEDIA_UPLOAD_TOKEN=<private editor upload token>
```

The `MEDIA_UPLOAD_TOKEN` is a private shared token for the editor UI. Enter it once in the Keystatic upload field; it is saved in the browser's local storage and sent only to the same-origin signature endpoint.

The upload flow is:

```text
Keystatic upload button
  -> /api/media-upload-signature
  -> browser direct upload to Cloudinary
  -> secure_url is written back into the content field
```

Manual Cloudinary uploads still work as a fallback: copy the public delivery URL and paste the full URL into Keystatic `Source`, `Cover`, or `Video poster`.

Examples:

```text
https://res.cloudinary.com/<cloud-name>/image/upload/v.../cover.webp
https://res.cloudinary.com/<cloud-name>/video/upload/v.../demo.mp4
```

Because these are full URLs, `PUBLIC_MEDIA_BASE_URL` is not needed.

## Optional Later: Cloudflare R2

If R2 is enabled later, configure a public R2 domain as `PUBLIC_MEDIA_BASE_URL` locally and in Cloudflare Pages.

Recommended R2 object keys:

```text
images/notes/<slug>/cover.webp
images/journal/<slug>/001.webp
videos/projects/<slug>/demo.mp4
videos/projects/<slug>/demo-poster.webp
```

Supported field values:

```text
images/notes/demo/cover.webp
r2:/videos/projects/demo/demo.mp4
https://media.example.com/images/notes/demo/cover.webp
/images/robotics/vla/openvla-architecture.svg
```

Relative R2 keys are resolved against `PUBLIC_MEDIA_BASE_URL`. Full URLs and local public paths are used as-is.

## Keystatic Fields

Use `Cover` for the primary image on Notes and Projects.

Use `Media` for galleries or videos:

- `Type`: `Image` or `Video`.
- `Source`: local public path, Cloudinary URL, R2 key, `r2:/` key, or an uploaded Cloudinary asset.
- `Alt text`: image alt text.
- `Caption`: visible caption below the media.
- `Video poster`: poster image for video items.
- `Title`: optional accessible label, especially useful for videos.

Journal still keeps the old `Images` list for compatibility. New entries should prefer `Media`.
