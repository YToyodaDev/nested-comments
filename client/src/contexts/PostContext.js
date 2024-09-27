import { createContext, useContext, useMemo, useState, useEffect } from 'react'

import {
    createComment,
    deleteComment,
    toggleCommentLike,
    updateComment,
} from '../api/comments'
import { useParams } from 'react-router-dom'
import { useAsync, useAsyncFn } from '../hooks/useAsync'
import { getPost } from '../api/posts'

const Context = createContext()

function PostProvider({ children }) {
    const { id } = useParams()
    const { loading, error, value: post } = useAsync(() => getPost(id), [id])
    const [comments, setComments] = useState([])

    const commentsByParentId = useMemo(() => {
        const group = {}
        comments.forEach((comment) => {
            group[comment.parentId] ||= []
            group[comment.parentId].push(comment)
        })
        return group
    }, [comments])

    async function executeApiCall(
        apiFunction,
        setIsLoading = undefined,
        setError = () => null
    ) {
        setIsLoading(true)
        try {
            const data = await apiFunction()
            setError(null)
            return data
        } catch (error) {
            setError(error)
            return Promise.reject(error)
        } finally {
            setIsLoading(false)
        }
    }

    function onCommentReply(args, setIsLoading, setError) {
        return executeApiCall(
            () =>
                createComment({
                    postId: args.postId,
                    message: args.message,
                    parentId: args.id,
                }),
            setIsLoading,
            setError
        ).then((comment) => {
            createLocalComment(comment)
        })
    }

    function createLocalComment(comment) {
        setComments((prevComments) => {
            return [comment, ...prevComments]
        })
    }
    function onCommentUpdate(args, setIsLoading, setError) {
        return executeApiCall(
            () =>
                updateComment({
                    id: args.id,
                    postId: args.postId,
                    message: args.message,
                }),
            setIsLoading,
            setError
        ).then((comment) => {
            updateLocalComment(args.id, comment.message)
        })
    }

    function updateLocalComment(id, message) {
        setComments((prevComments) => {
            return prevComments.map((comment) => {
                if (comment.id === id) {
                    return { ...comment, message }
                } else {
                    return comment
                }
            })
        })
    }
    function onCommentDelete(args, setIsLoading, setError) {
        return executeApiCall(
            () => deleteComment({ id: args.id, postId: args.postId }),
            setIsLoading,
            setError
        ).then((comment) => deleteLocalComment(comment.id))
    }

    function deleteLocalComment(id) {
        setComments((prev) => {
            return prev.filter((comment) => comment.id !== id)
        })
    }

    function onToggleCommentLike(args, setIsLoading) {
        return executeApiCall(
            () => toggleCommentLike({ id: args.id, postId: args.postId }),
            setIsLoading
        ).then(({ addLike }) => toggleLocalCommentLike(args.id, addLike))
    }

    function toggleLocalCommentLike(id, addLike) {
        setComments((prevComments) =>
            prevComments.map((comment) =>
                id === comment.id
                    ? {
                          ...comment,
                          likeCount: comment.likeCount + (addLike ? 1 : -1),
                          likedByMe: addLike,
                      }
                    : comment
            )
        )
    }

    function getReplies(parentId) {
        return commentsByParentId[parentId]
    }

    useEffect(() => {
        if (post?.comments == null) return
        setComments(post.comments)
    }, [post])

    return (
        <Context.Provider
            value={{
                post: { id, ...post },
                rootComments: commentsByParentId[null],
                getReplies,
                createLocalComment,
                updateLocalComment,
                deleteLocalComment,
                toggleLocalCommentLike,
                onToggleCommentLike,
                onCommentDelete,
                onCommentUpdate,
                onCommentReply,
            }}
        >
            {loading ? (
                <h1>Loading</h1>
            ) : error ? (
                <h1 className="error-msg">{error}</h1>
            ) : (
                children
            )}
        </Context.Provider>
    )
}

function usePost() {
    const context = useContext(Context)
    if (!context) return console.log('usePost was called outside the context ')
    return context
}

export { PostProvider, usePost }
