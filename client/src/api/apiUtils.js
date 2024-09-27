export const executeApiCall = async (
    apiFunction,
    setIsLoading,
    setError = () => {}
) => {
    setIsLoading(true)
    setError(null)
    try {
        const data = await apiFunction()
        return data
    } catch (error) {
        setError(error)
        return Promise.reject(error)
    } finally {
        setIsLoading(false)
    }
}
