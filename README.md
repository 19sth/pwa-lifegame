# lifegame

Define tasks you want to stay consistent with. Log scheduled days, keep a streak, and see when that streak breaks.

```
$ npm install
$ npm start
```

Open http://localhost:3000/pwa-lifegame/

```
$ npm test -- --watchAll=false
$ npm run build
```

Published, after merge to `main`, at https://19sth.github.io/pwa-lifegame/

To list it on https://19sth.com, add this entry to the `apps` array in `src/app/page.tsx` of [19sth.github.io](https://github.com/19sth/19sth.github.io):

```tsx
{
  title: "Lifegame",
  description: "Define tasks you want to stay consistent with, and see when a streak breaks.",
  link: "https://19sth.github.io/pwa-lifegame/",
},
```
