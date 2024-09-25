import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAsync } from '../hooks/useAsync'
import { getPost } from '../services/posts'

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

    function createLocalComment(comment) {
        setComments((prevComments) => {
            return [comment, ...prevComments]
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
    function deleteLocalComment(id) {
        setComments((prev) => {
            return prev.filter((comment) => comment.id !== id)
        })
    }

    function toggleLocalCommentLike(id, addLike) {
        setComments((prevComments) => {
            return prevComments.map((comment) => {
                if (id === comment.id) {
                    if (addLike) {
                        return {
                            ...comment,
                            likeCount: comment.likeCount + 1,
                            likedByMe: true,
                        }
                    } else {
                        return {
                            ...comment,
                            likeCount: comment.likeCount - 1,
                            likedByMe: false,
                        }
                    }
                } else {
                    return comment
                }
            })
        })
    }

    useEffect(() => {
        if (post?.comments == null) return
        setComments(post.comments)
    }, [post?.comments])

    function getReplies(parentId) {
        return commentsByParentId[parentId]
    }

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
