// import { identicon } from 'minidenticons'
// import WebUtils from '#src/classes/WebUtils'

// function handler(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   const { id } = params

//   const identiconSVG = identicon(id)

//   const headers = new Headers()
//   headers.set('Content-Type', 'image/svg+xml')

//   return new Response(identiconSVG, {
//     headers: WebUtils.addCORS(headers)
//   })
// }

// export { handler as GET, handler as POST }

// // Allow CORS preflight requests
// export function OPTIONS() {
//   return WebUtils.sendCORS()
// }