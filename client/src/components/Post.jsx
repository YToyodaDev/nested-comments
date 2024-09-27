import { usePost } from '../contexts/PostContext'
import { CommentList } from './CommentList'
import { CommentForm } from './CommentForm'
import { useCallback, useState } from 'react'

export function Post() {
    const { post, rootComments, onCommentReply } = usePost()

    const [isCreating, setIsCreating] = useState(false)
    const [errorCreating, setErrorCreating] = useState(null)

    const handleReply = useCallback(
        (message) => {
            return onCommentReply(
                { id: null, postId: post.id, message },
                setIsCreating,
                setErrorCreating
            )
        },
        [post.Id, setIsCreating, setErrorCreating]
    )

    return (
        <>
            <h1>{post.title}</h1>
            <article>{post.body}</article>
            <h3 className="comments-title">Comments</h3>
            <section>
                <CommentForm
                    loading={isCreating}
                    error={errorCreating}
                    onSubmit={handleReply}
                />
                {rootComments != null && rootComments.length > 0 && (
                    <div className="mt-4">
                        <CommentList comments={rootComments} />
                    </div>
                )}
            </section>
        </>
    )
}
