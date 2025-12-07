import express from 'express';
import baseRoutes from './routes/base.routes.js';

const app = express();
app.use(express.json());

app.use('/api', baseRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
