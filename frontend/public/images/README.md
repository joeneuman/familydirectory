# Website Images

This folder contains static images used throughout the website.

## Structure

- **Root level**: Logos, favicons, and general website images
- **backgrounds/**: Background images for pages or sections
- **icons/**: Icon images (if not using an icon font)

## Usage

Images in this folder are accessible at the root path:

```html
<!-- In HTML/Vue templates -->
<img src="/images/logo.png" alt="Logo" />

<!-- In CSS -->
background-image: url('/images/backgrounds/hero.jpg');
```

## Notes

- Files in `public/` are copied as-is to the build output
- Use relative paths starting with `/images/` to reference these files
- Images are served directly, not processed by Vite




