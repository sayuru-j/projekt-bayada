import { useCallback, useState } from 'react'

export type UserLocation = {
  latitude: number
  longitude: number
  accuracy: number
}

type Status = 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [status, setStatus] = useState<Status>('idle')

  const request = useCallback(() => {
    return new Promise<UserLocation | null>((resolve) => {
      if (!navigator.geolocation) {
        setStatus('unsupported')
        resolve(null)
        return
      }
      setStatus('loading')
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }
          setLocation(next)
          setStatus('granted')
          resolve(next)
        },
        () => {
          setStatus('denied')
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
      )
    })
  }, [])

  return { location, status, request }
}
