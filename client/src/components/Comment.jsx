import { IconBtn } from './IconBtn'
import { FaEdit, FaHeart, FaRegHeart, FaReply, FaTrash } from 'react-icons/fa'
import { usePost } from '../contexts/PostContext'
import { CommentList } from './CommentList'
import { useState, useCallback, useEffect, useRef } from 'react'

import { CommentForm } from './CommentForm'
import { useUser } from '../hooks/useUser'

// eslint-disable-next-line no-undef
const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
})

export function Comment({
    id, // this comment id
    message,
    user,
    createdAt,
    likeCount,
    likedByMe,
}) {
    const [areChildrenHidden, setAreChildrenHidden] = useState(false)

    const [isReplying, setIsReplying] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    const [isCreating, setIsCreating] = useState(false)
    const [errorCreating, setErrorCreating] = useState(null)

    const [isUpdating, setIsUpdating] = useState(false)
    const [errorUpdating, setErrorUpdating] = useState(null)

    const [isDeleting, setIsDeleting] = useState(false)
    const [errorDeleting, setErrorDeleting] = useState(null)

    const [isLiking, setIsLiking] = useState(false)

    const {
        post: { id: postId },
        getReplies,
        onToggleCommentLike,
        onCommentDelete,
        onCommentUpdate,
        onCommentCreate,
    } = usePost()

    const childComments = getReplies(id)
    const currentUser = useUser()

    const handleReply = useCallback(
        (message) => {
            return onCommentCreate(
                { id, postId, message },
                setIsCreating,
                setErrorCreating
            ).then(() => setIsReplying(false))
        },
        [id, postId, setIsCreating, setErrorCreating]
    )

    const handleEdit = useCallback(
        (message) => {
            return onCommentUpdate(
                { id, postId, message },
                setIsUpdating,
                setErrorUpdating
            ).then(() => setIsEditing(false))
        },
        [id, postId, setIsUpdating, setErrorUpdating]
    )

    const handleDelete = useCallback(() => {
        return onCommentDelete({ id, postId }, setIsDeleting, setErrorDeleting)
    }, [id, postId, setIsDeleting, setErrorDeleting])

    const handleLike = useCallback(() => {
        return onToggleCommentLike({ id, postId }, setIsLiking)
    }, [id, postId, setIsLiking])

    return (
        <>
            <div className="comment">
                <div className="header">
                    <span className="name">{user.name}</span>
                    <span className="date">
                        {dateFormatter.format(Date.parse(createdAt))}
                    </span>
                </div>
                {isEditing ? (
                    <CommentForm
                        autoFocus
                        initialValue={message}
                        onSubmit={handleEdit}
                        loading={isUpdating}
                        error={errorUpdating}
                    />
                ) : (
                    <div className="message">{message}</div>
                )}
                <div className="footer">
                    <IconBtn
                        onClick={handleLike}
                        disabled={isLiking}
                        Icon={likedByMe ? FaHeart : FaRegHeart}
                        aria-label={likedByMe ? 'Unlike' : 'Like'}
                    >
                        {likeCount}
                    </IconBtn>
                    <IconBtn
                        onClick={() => setIsReplying((prev) => !prev)}
                        isActive={isReplying}
                        Icon={FaReply}
                        aria-label={isReplying ? 'Cancel Reply' : 'Reply'}
                    />
                    {user.id === currentUser.id && (
                        <>
                            <IconBtn
                                onClick={() => setIsEditing((prev) => !prev)}
                                isActive={isEditing}
                                Icon={FaEdit}
                                aria-label={isEditing ? 'Cancel Edit' : 'Edit'}
                            />
                            <IconBtn
                                disabled={isDeleting}
                                onClick={handleDelete}
                                Icon={FaTrash}
                                aria-label="Delete"
                                color="danger"
                            />
                        </>
                    )}
                </div>
                {errorDeleting && (
                    <div className="error-msg mt-1">{errorDeleting}</div>
                )}
            </div>
            {isReplying && (
                <div className="mt-1 ml-3">
                    <CommentForm
                        autoFocus
                        onSubmit={handleReply}
                        loading={isCreating}
                        error={errorCreating}
                    />
                </div>
            )}
            {childComments?.length > 0 && (
                <>
                    <div
                        className={`nested-comments-stack ${
                            areChildrenHidden ? 'hide' : ''
                        }`}
                    >
                        <button
                            className="collapse-line"
                            aria-label="Hide Replies"
                            onClick={() => setAreChildrenHidden(true)}
                        />
                        <div className="nested-comments">
                            <CommentList comments={childComments} />
                        </div>
                    </div>
                    <button
                        className={`btn mt-1 ${!areChildrenHidden ? 'hide' : ''}`}
                        onClick={() => setAreChildrenHidden(false)}
                    >
                        Show Replies
                    </button>
                </>
            )}
        </>
    )
}
