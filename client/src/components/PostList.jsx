import { getPosts } from '../services/posts'
import { useAsync } from '../hooks/useAsync'

export function PostList() {
    const { isLoading, error, value: posts } = useAsync(getPosts)

    if (isLoading) return <h1>loading...</h1>
    if (error) return <h1 className="error-msg">{error}</h1>

    return (
        <>
            {posts.map((post) => (
                <h1 key={post.id}>
                    <a href={`/posts/${post.id}`}>{post.title}</a>
                </h1>
            ))}
        </>
    )
}
