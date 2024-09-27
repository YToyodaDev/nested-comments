import {
    createContext,
    useContext,
    useReducer,
    useEffect,
    useMemo,
} from 'react'
import { useParams } from 'react-router-dom'
import { useAsync } from '../hooks/useAsync'
import { getPost } from '../api/posts'
import {
    createComment,
    deleteComment,
    toggleCommentLike,
    updateComment,
} from '../api/comments'
import { executeApiCall } from '../api/apiUtils'

const Context = createContext()

const actionTypes = {
    SET_COMMENTS: 'SET_COMMENTS',
    ADD_COMMENT: 'ADD_COMMENT',
    UPDATE_COMMENT: 'UPDATE_COMMENT',
    DELETE_COMMENT: 'DELETE_COMMENT',
    TOGGLE_COMMENT_LIKE: 'TOGGLE_COMMENT_LIKE',
}

const initialState = {
    comments: [],
}

function postReducer(state, action) {
    switch (action.type) {
        case actionTypes.SET_COMMENTS:
            return { ...state, comments: action.payload }
        case actionTypes.ADD_COMMENT:
            return { ...state, comments: [action.payload, ...state.comments] }
        case actionTypes.UPDATE_COMMENT:
            return {
                ...state,
                comments: state.comments.map((comment) =>
                    comment.id === action.payload.id
                        ? { ...comment, message: action.payload.message }
                        : comment
                ),
            }
        case actionTypes.DELETE_COMMENT:
            return {
                ...state,
                comments: state.comments.filter(
                    (comment) => comment.id !== action.payload
                ),
            }
        case actionTypes.TOGGLE_COMMENT_LIKE:
            return {
                ...state,
                comments: state.comments.map((comment) =>
                    comment.id === action.payload.id
                        ? {
                              ...comment,
                              likeCount:
                                  comment.likeCount +
                                  (action.payload.addLike ? 1 : -1),
                              likedByMe: action.payload.addLike,
                          }
                        : comment
                ),
            }
        default:
            return state
    }
}

function PostProvider({ children }) {
    const { id } = useParams()
    const { loading, error, value: post } = useAsync(() => getPost(id), [id])
    const [state, dispatch] = useReducer(postReducer, initialState)

    const commentsByParentId = useMemo(() => {
        const group = {}
        state.comments.forEach((comment) => {
            group[comment.parentId] ||= []
            group[comment.parentId].push(comment)
        })
        return group
    }, [state.comments])

    const onCommentCreate = async (args, setIsLoading, setError) => {
        const comment = await executeApiCall(
            () =>
                createComment({
                    postId: args.postId,
                    message: args.message,
                    parentId: args.id,
                }),
            setIsLoading,
            setError
        )
        dispatch({ type: actionTypes.ADD_COMMENT, payload: comment })
    }

    const onCommentUpdate = async (args, setIsLoading, setError) => {
        const comment = await executeApiCall(
            () =>
                updateComment({
                    id: args.id,
                    postId: args.postId,
                    message: args.message,
                }),
            setIsLoading,
            setError
        )
        dispatch({
            type: actionTypes.UPDATE_COMMENT,
            payload: { id: args.id, message: comment.message },
        })
    }

    const onCommentDelete = async (args, setIsLoading, setError) => {
        await executeApiCall(
            () => deleteComment({ id: args.id, postId: args.postId }),
            setIsLoading,
            setError
        )
        dispatch({ type: actionTypes.DELETE_COMMENT, payload: args.id })
    }

    const onToggleCommentLike = async (args, setIsLoading) => {
        const { addLike } = await executeApiCall(
            () => toggleCommentLike({ id: args.id, postId: args.postId }),
            setIsLoading
        )
        dispatch({
            type: actionTypes.TOGGLE_COMMENT_LIKE,
            payload: { id: args.id, addLike },
        })
    }

    const getReplies = (parentId) => commentsByParentId[parentId] || []

    useEffect(() => {
        if (post?.comments) {
            dispatch({ type: actionTypes.SET_COMMENTS, payload: post.comments })
        }
    }, [post])

    return (
        <Context.Provider
            value={{
                post: { id, ...post },
                rootComments: commentsByParentId[null],
                getReplies,
                onCommentCreate,
                onCommentUpdate,
                onCommentDelete,
                onToggleCommentLike,
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
    if (!context) throw new Error('usePost must be used within a PostProvider')
    return context
}

export { PostProvider, usePost }
