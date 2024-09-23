import { PrismaClient } from '@prisma/client';
import sensible from '@fastify/sensible';
import dotenv from 'dotenv';
import fastify from 'fastify';
import cors from '@fastify/cors';
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();


dotenv.config();
const app = fastify();
app.register(sensible);
app.register(cors,{
  origin: process.env.CLIENT_URL,
  credentials: true
})
app.get('/posts', async (req, res) => {
  return await commitToDB(
    prisma.post.findMany({
      select: {
        id: true,
        title: true,
      },
    })
  );
});

async function commitToDB(promise) {
  const [error, data] = await app.to(promise);
  if (error) return app.httpErrors.internalServerError(error.message);
  return data;
}

app.listen({ port: process.env.PORT }, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
