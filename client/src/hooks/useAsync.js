import { useCallback, useEffect, useState } from 'react'

export function useAsync(func, dependencies = []) {
    const { execute, ...state } = useAsyncInternal(func, dependencies, true)

    useEffect(() => {
        execute()
    }, [execute])
    return state
}
export function useAsyncFn(func, dependencies = []) {
    return useAsyncInternal(func, dependencies, false)
}

function useAsyncInternal(func, dependencies, initialLoading = false) {
    const [isLoading, setIsLoading] = useState(initialLoading)
    const [error, setError] = useState()
    const [value, setValue] = useState()

    const execute = useCallback((...params) => {
        setIsLoading(true)
        return func(...params)
            .then((data) => {
                setValue(data)
                setError(null)
                return data
            })
            .catch((error) => {
                setValue(null)
                setError(error)
                return Promise.reject(error)
            })
            .finally(() => {
                setIsLoading(false)
            })
    }, dependencies)

    return { isLoading, error, value, execute }
}
