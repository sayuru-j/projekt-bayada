import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useLocale } from '@/contexts/locale-context'
import { BrandMark } from '@/components/layout/brand'

export function AuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setSessionToken } = useAuth()
  const { tr } = useLocale()

  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      navigate('/', { replace: true })
      return
    }
    void setSessionToken(token).then(() => navigate('/', { replace: true }))
  }, [params, navigate, setSessionToken])

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-canvas">
      <BrandMark size={48} />
      <p className="flex items-center gap-2 text-sm text-muted">
        <Loader2 size={14} className="animate-spin text-accent" />
        {tr('loading')}
      </p>
    </div>
  )
}
