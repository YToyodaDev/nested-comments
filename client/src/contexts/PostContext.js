import {
    createContext,
    useContext,
    useMemo,
    useReducer,
    useEffect,
} from 'react'
import { useParams } from 'react-router-dom'
import { useAsync } from '../hooks/useAsync'
import { getPost } from '../services/posts'

const commentsReducer = (state, action) => {
    switch (action.type) {
        case 'SET_COMMENTS':
            return action.payload
        case 'CREATE_COMMENT':
            return [action.payload, ...state]
        case 'UPDATE_COMMENT':
            return state.map((comment) =>
                comment.id === action.payload.id
                    ? { ...comment, message: action.payload.message }
                    : comment
            )
        case 'DELETE_COMMENT':
            return state.filter((comment) => comment.id !== action.payload)
        case 'TOGGLE_LIKE':
            return state.map((comment) => {
                if (comment.id === action.payload.id) {
                    const updatedLikeCount = action.payload.addLike
                        ? comment.likeCount + 1
                        : comment.likeCount - 1
                    return {
                        ...comment,
                        likeCount: updatedLikeCount,
                        likedByMe: action.payload.addLike,
                    }
                }
                return comment
            })
        default:
            return state
    }
}

const Context = createContext()

function PostProvider({ children }) {
    const { id } = useParams()
    const { loading, error, value: post } = useAsync(() => getPost(id), [id])
    const [comments, dispatch] = useReducer(commentsReducer, [])

    const commentsByParentId = useMemo(() => {
        const group = {}
        comments.forEach((comment) => {
            group[comment.parentId] ||= []
            group[comment.parentId].push(comment)
        })
        return group
    }, [comments])

    useEffect(() => {
        if (post?.comments == null) return
        dispatch({ type: 'SET_COMMENTS', payload: post.comments })
    }, [post])

    const createLocalComment = (comment) => {
        dispatch({ type: 'CREATE_COMMENT', payload: comment })
    }

    const updateLocalComment = (id, message) => {
        dispatch({ type: 'UPDATE_COMMENT', payload: { id, message } })
    }

    const deleteLocalComment = (id) => {
        dispatch({ type: 'DELETE_COMMENT', payload: id })
    }

    const toggleLocalCommentLike = (id, addLike) => {
        dispatch({ type: 'TOGGLE_LIKE', payload: { id, addLike } })
    }

    const getReplies = (parentId) => {
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

export default PostProvider

function usePost() {
    const context = useContext(Context)
    if (!context) return console.log('usePost was called outside the context ')
    return context
}

export { PostProvider, usePost }
