import express from 'express';
import passport from 'passport';
import adminRouter from './routes/admin.js';
import './middleware/auth.js';

const app = express();
app.use(express.json());
app.use(passport.initialize());

app.use('/api/admin', adminRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});

export default app;
