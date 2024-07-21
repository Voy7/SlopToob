import { minidenticon } from 'minidenticons'

function handler(request: Request, { params }: { params: { id: string } }) {
  const identiconSVG = minidenticon(params.id)

  const headers = new Headers()
  headers.set('Content-Type', 'image/svg+xml')

  return new Response(identiconSVG, { headers })
}

export { handler as GET, handler as POST }
