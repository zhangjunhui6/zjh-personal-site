# Media Workflow

This site supports three media source styles in `Cover`, `Media`, and legacy Journal `Images` fields:

- Editor-uploaded repository media: `/media/...`.
- Local static paths: `/images/...` and `/videos/...`.
- Full hosted URLs: Cloudinary, YouTube poster images, or any public CDN URL.
- Future R2 keys: `images/...` or `r2:/images/...` resolved through `PUBLIC_MEDIA_BASE_URL`.

The current default is Keystatic editor upload into `public/media`. R2 is optional and can wait until Cloudflare billing is available.

## Option 1: Keystatic Editor Uploads

Use the `Choose file` button in Keystatic for normal images and short videos. Keystatic saves the selected file into the GitHub repository, writes the generated `/media/...` path into frontmatter, and Cloudflare Pages redeploys the site from `main`.

Generated paths follow this shape:

```text
public/media/notes/<slug>/cover.webp
public/media/notes/<slug>/media/0/src.webp
public/media/journal/<slug>/images/0.webp
public/media/projects/<slug>/media/0/src.mp4
public/media/projects/<slug>/media/0/poster.webp
```

The saved field values look like this:

```text
/media/notes/<slug>/cover.webp
/media/projects/<slug>/media/0/src.mp4
```

Keep files small:

- Images: prefer `.webp`, `.avif`, `.jpg`, or `.png`.
- Videos: prefer compressed `.mp4` or `.webm`.
- This path is best for personal-site media, diagrams, screenshots, and short demos.

## Option 2: Local Static Files

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

## Option 3: Cloudinary Free URLs

Cloudinary delivery URLs still work anywhere a media URL is accepted. Use this for files you do not want in Git, larger media experiments, or media that benefits from hosted management.

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
- `Source`: choose a file, local public path, Cloudinary URL, R2 key, or `r2:/` key.
- `Alt text`: image alt text.
- `Caption`: visible caption below the media.
- `Video poster`: choose a file or paste a poster image URL for video items.
- `Title`: optional accessible label, especially useful for videos.

Journal still keeps the old `Images` list for compatibility. New entries should prefer `Media`.
