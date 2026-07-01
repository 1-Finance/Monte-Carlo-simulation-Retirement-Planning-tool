import { createApp } from './app';

const PORT = process.env.PORT || 3001;

createApp().then((app) => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
});
