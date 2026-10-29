import { mkdir, copyFile, cp } from 'node:fs/promises';
await mkdir(new URL('dist/', import.meta.url), { recursive: true });
for (const name of ['index.html', 'styles.css', 'app.js', 'blog-reader.js', 'software-update.js', 'floppy-assistant.js', 'favicon.ico']) {
  await copyFile(new URL(name, import.meta.url), new URL(`dist/${name}`, import.meta.url));
}
await cp(new URL('assets/', import.meta.url), new URL('dist/assets/', import.meta.url), { recursive: true });
console.log('Built static portfolio in dist/');
