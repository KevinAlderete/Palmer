# Palmer

Editor visual construido con Astro y Tailwind. El codigo exportado del disenador usa Bootstrap solo para la salida.

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages

Este proyecto debe desplegarse con GitHub Actions, no con Jekyll.

Configura el repositorio en GitHub:

1. Entra a `Settings` > `Pages`.
2. En `Build and deployment`, cambia `Source` a `GitHub Actions`.
3. Ve a `Actions`.
4. Ejecuta el workflow `Deploy to GitHub Pages`.

Si GitHub Pages queda en `Deploy from a branch`, GitHub intentara compilar `src/pages/index.astro` con Jekyll y mostrara el error `Invalid YAML front matter`.
