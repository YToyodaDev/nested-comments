import fastify from 'fastify';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
dotenv.config();

const app = fastify();
app.register(sensible);
app.register(cookie, { secret: process.env.COOKIE_SECRET });
app.register(cors, {
  origin: process.env.CLIENT_URL,
  credentials: true,
});

const prisma = new PrismaClient();

const CURRENT_USER_ID = (
  await prisma.user.findFirst({ where: { name: 'Yasu' } })
).id;

// const CURRENT_USER_ID = 'jess';
const COMMENT_SELECT_FIELDS = {
  id: true,
  message: true,
  parentId: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
    },
  },
};
// acts as a middleware
app.addHook('onRequest', (req, res, done) => {
  if (req.cookies.userId !== CURRENT_USER_ID) {
    req.cookies.userId = CURRENT_USER_ID;
    res.clearCookie('userId');
    res.setCookie('userId', CURRENT_USER_ID);
  }
  done();
});
// GET Posts
// SELECT id, title
// FROM Post;
app.get('/posts', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
      },
    });
    return posts;
  } catch (error) {
    return res.send(app.httpErrors.internalServerError(error.message));
  }
});
// GET Post
app.get('/posts/:id', async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      select: {
        body: true,
        title: true,
        comments: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            ...COMMENT_SELECT_FIELDS,
            _count: { select: { likes: true } },
          },
        },
      },
    });

    const likes = await prisma.like.findMany({
      where: {
        userId: req.cookies.userId,
        commentId: { in: post.comments.map((comment) => comment.id) },
      },
    });

    const postWithLikes = {
      ...post,
      comments: post.comments.map((comment) => {
        const { _count, ...commentFields } = comment;
        return {
          ...commentFields,
          likedByMe: likes.find((like) => like.commentId === comment.id),
          likeCount: _count.likes,
        };
      }),
    };

    return postWithLikes;
  } catch (error) {
    return res.send(app.httpErrors.internalServerError(error.message));
  }
});
// CREATE comment
app.post('/posts/:id/comments', async (req, res) => {
  if (!req.body.message) {
    return res.send(app.httpErrors.badRequest('Message is required'));
  }

  try {
    const comment = await prisma.comment.create({
      data: {
        message: req.body.message,
        userId: req.cookies.userId,
        parentId: req.body.parentId,
        postId: req.params.id,
      },
      select: COMMENT_SELECT_FIELDS,
    });

    return {
      ...comment,
      likeCount: 0,
      likedByMe: false,
    };
  } catch (error) {
    return res.send(app.httpErrors.internalServerError(error.message));
  }
});
// UPDATE Comment
app.put('/posts/:postId/comments/:commentId', async (req, res) => {
  if (!req.body.message) {
    return res.send(app.httpErrors.badRequest('Message is required'));
  }

  try {
    const { userId } = await prisma.comment.findUnique({
      where: { id: req.params.commentId },
      select: { userId: true },
    });

    if (userId !== req.cookies.userId) {
      return res.send(
        app.httpErrors.unauthorized(
          'You do not have permission to edit this message'
        )
      );
    }

    const updatedComment = await prisma.comment.update({
      where: { id: req.params.commentId },
      data: { message: req.body.message },
      select: { message: true },
    });

    return updatedComment;
  } catch (error) {
    return res.send(app.httpErrors.internalServerError(error.message));
  }
});
// DELETE comment
app.delete('/posts/:postId/comments/:commentId', async (req, res) => {
  try {
    const { userId } = await prisma.comment.findUnique({
      where: { id: req.params.commentId },
      select: { userId: true },
    });

    if (userId !== req.cookies.userId) {
      return res.send(
        app.httpErrors.unauthorized(
          'You do not have permission to delete this message'
        )
      );
    }

    const deletedComment = await prisma.comment.delete({
      where: { id: req.params.commentId },
      select: { id: true },
    });

    return deletedComment;
  } catch (error) {
    return res.send(app.httpErrors.internalServerError(error.message));
  }
});
// LIKE Post
app.post('/posts/:postId/comments/:commentId/toggleLike', async (req, res) => {
  const data = {
    commentId: req.params.commentId,
    userId: req.cookies.userId,
  };

  try {
    const like = await prisma.like.findUnique({
      where: { userId_commentId: data },
    });

    if (!like) {
      await prisma.like.create({ data });
      return { addLike: true };
    } else {
      await prisma.like.delete({ where: { userId_commentId: data } });
      return { addLike: false };
    }
  } catch (error) {
    return res.send(app.httpErrors.internalServerError(error.message));
  }
});

app.listen({ port: process.env.PORT });
