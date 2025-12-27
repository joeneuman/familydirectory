# Component Images

This folder contains images that are imported directly into Vue components.

## Usage

Import images in your components:

```vue
<script setup>
import logo from '@/assets/images/logo.png';
import background from '@/assets/images/background.jpg';
</script>

<template>
  <img :src="logo" alt="Logo" />
  <div :style="{ backgroundImage: `url(${background})` }"></div>
</template>
```

## Notes

- Images imported here are processed by Vite
- They get optimized and hashed filenames in production
- Use `@/` alias which points to `src/`
- Better for images that are component-specific




