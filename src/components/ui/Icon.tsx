const icons = {
  'admin-panel': <svg viewBox="0 0 24 24"><path fill="currentColor" d="M17 17q.625 0 1.063-.438T18.5 15.5q0-.625-.438-1.063T17 14q-.625 0-1.063.438T15.5 15.5q0 .625.438 1.063T17 17Zm0 3q.775 0 1.425-.363t1.05-.962q-.55-.325-1.175-.5T17 18q-.675 0-1.3.175t-1.175.5q.4.6 1.05.963T17 20Zm-5 2q-3.475-.875-5.738-3.988T4 11.1V6.375q0-.625.363-1.125t.937-.725l6-2.25q.35-.125.7-.125t.7.125l6 2.25q.575.225.938.725T20 6.375v4.3q-.475-.2-.975-.363T18 10.075V6.4l-6-2.25L6 6.4v4.7q0 1.175.313 2.35t.875 2.238Q7.75 16.75 8.55 17.65t1.775 1.5q.275.8.725 1.525t1.025 1.3q-.025 0-.037.013T12 22Zm5 0q-2.075 0-3.538-1.463T12 17q0-2.075 1.463-3.538T17 12q2.075 0 3.538 1.463T22 17q0 2.075-1.463 3.538T17 22Zm-5-10.35Z"></path></svg>,
  'files': <svg viewBox="0 0 512 512"><path d="M48 336v96a48.14 48.14 0 0048 48h320a48.14 48.14 0 0048-48v-96" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="32"/><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M48 336h144M320 336h144M192 336a64 64 0 00128 0"/><path d="M384 32H128c-26 0-43 14-48 40L48 192v96a48.14 48.14 0 0048 48h320a48.14 48.14 0 0048-48v-96L432 72c-5-27-23-40-48-40z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="32"/><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M48 192h144M320 192h144M192 192a64 64 0 00128 0"/></svg>,
  'user': <svg viewBox="0 0 24 24"><path fill="currentColor" d="M9.775 12q-.9 0-1.5-.675T7.8 9.75l.325-2.45q.2-1.425 1.3-2.363T12 4q1.475 0 2.575.938t1.3 2.362l.325 2.45q.125.9-.475 1.575t-1.5.675h-4.45Zm0-2h4.45L13.9 7.6q-.1-.7-.637-1.15T12 6q-.725 0-1.263.45T10.1 7.6L9.775 10ZM6 20q-.825 0-1.413-.588T4 18v-.8q0-.85.438-1.563T5.6 14.55q1.55-.775 3.15-1.163T12 13q1.65 0 3.25.388t3.15 1.162q.725.375 1.163 1.088T20 17.2v.8q0 .825-.588 1.413T18 20H6Zm0-2h12v-.8q0-.275-.138-.5t-.362-.35q-1.35-.675-2.725-1.012T12 15q-1.4 0-2.775.338T6.5 16.35q-.225.125-.363.35T6 17.2v.8Zm6 0Zm0-8Z"></path></svg>,
  'users': <svg viewBox="0 0 24 24"><path fill="currentColor" d="M1 20v-2.8q0-.85.438-1.563T2.6 14.55q1.55-.775 3.15-1.163T9 13q1.65 0 3.25.388t3.15 1.162q.725.375 1.163 1.088T17 17.2V20H1Zm18 0v-3q0-1.1-.613-2.113T16.65 13.15q1.275.15 2.4.513t2.1.887q.9.5 1.375 1.112T23 17v3h-4ZM9 12q-1.65 0-2.825-1.175T5 8q0-1.65 1.175-2.825T9 4q1.65 0 2.825 1.175T13 8q0 1.65-1.175 2.825T9 12Zm10-4q0 1.65-1.175 2.825T15 12q-.275 0-.7-.063t-.7-.137q.675-.8 1.038-1.775T15 8q0-1.05-.362-2.025T13.6 4.2q.35-.125.7-.163T15 4q1.65 0 2.825 1.175T19 8ZM3 18h12v-.8q0-.275-.138-.5t-.362-.35q-1.35-.675-2.725-1.012T9 15q-1.4 0-2.775.338T3.5 16.35q-.225.125-.363.35T3 17.2v.8Zm6-8q.825 0 1.413-.588T11 8q0-.825-.588-1.413T9 6q-.825 0-1.413.588T7 8q0 .825.588 1.413T9 10Zm0 8ZM9 8Z"></path></svg>,
  'fullscreen': <svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 19v-5h2v3h3v2H5Zm0-9V5h5v2H7v3H5Zm9 9v-2h3v-3h2v5h-5Zm3-9V7h-3V5h5v5h-2Z"></path></svg>,
  'play': <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 19V5l11 7l-11 7Z"></path></svg>,
  'pause': <svg viewBox="0 0 24 24"><path fill="currentColor" d="M14 19V5h4v14h-4Zm-8 0V5h4v14H6Z"></path></svg>,
  'warning': <svg viewBox="0 0 512 512"><path d="M85.57 446.25h340.86a32 32 0 0028.17-47.17L284.18 82.58c-12.09-22.44-44.27-22.44-56.36 0L57.4 399.08a32 32 0 0028.17 47.17z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32"/><path d="M250.26 195.39l5.74 122 5.73-121.95a5.74 5.74 0 00-5.79-6h0a5.74 5.74 0 00-5.68 5.95z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32"/><path d="M256 397.25a20 20 0 1120-20 20 20 0 01-20 20z" fill="currentColor"/></svg>,
  'settings': <svg viewBox="0 0 512 512"><path d="M262.29 192.31a64 64 0 1057.4 57.4 64.13 64.13 0 00-57.4-57.4zM416.39 256a154.34 154.34 0 01-1.53 20.79l45.21 35.46a10.81 10.81 0 012.45 13.75l-42.77 74a10.81 10.81 0 01-13.14 4.59l-44.9-18.08a16.11 16.11 0 00-15.17 1.75A164.48 164.48 0 01325 400.8a15.94 15.94 0 00-8.82 12.14l-6.73 47.89a11.08 11.08 0 01-10.68 9.17h-85.54a11.11 11.11 0 01-10.69-8.87l-6.72-47.82a16.07 16.07 0 00-9-12.22 155.3 155.3 0 01-21.46-12.57 16 16 0 00-15.11-1.71l-44.89 18.07a10.81 10.81 0 01-13.14-4.58l-42.77-74a10.8 10.8 0 012.45-13.75l38.21-30a16.05 16.05 0 006-14.08c-.36-4.17-.58-8.33-.58-12.5s.21-8.27.58-12.35a16 16 0 00-6.07-13.94l-38.19-30A10.81 10.81 0 0149.48 186l42.77-74a10.81 10.81 0 0113.14-4.59l44.9 18.08a16.11 16.11 0 0015.17-1.75A164.48 164.48 0 01187 111.2a15.94 15.94 0 008.82-12.14l6.73-47.89A11.08 11.08 0 01213.23 42h85.54a11.11 11.11 0 0110.69 8.87l6.72 47.82a16.07 16.07 0 009 12.22 155.3 155.3 0 0121.46 12.57 16 16 0 0015.11 1.71l44.89-18.07a10.81 10.81 0 0113.14 4.58l42.77 74a10.8 10.8 0 01-2.45 13.75l-38.21 30a16.05 16.05 0 00-6.05 14.08c.33 4.14.55 8.3.55 12.47z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32"/></svg>,
  'menu': <svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 18q-.425 0-.713-.288T3 17q0-.425.288-.713T4 16h16q.425 0 .713.288T21 17q0 .425-.288.713T20 18H4Zm0-5q-.425 0-.713-.288T3 12q0-.425.288-.713T4 11h16q.425 0 .713.288T21 12q0 .425-.288.713T20 13H4Zm0-5q-.425 0-.713-.288T3 7q0-.425.288-.713T4 6h16q.425 0 .713.288T21 7q0 .425-.288.713T20 8H4Z"></path></svg>,
  'add': <svg viewBox="0 0 512 512"><path d="M448 256c0-106-86-192-192-192S64 150 64 256s86 192 192 192 192-86 192-192z" fill="none" stroke="currentColor" stroke-miterlimit="10" strokeWidth="32"/><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M256 176v160M336 256H176"/></svg>,
  'edit': <svg viewBox="0 0 512 512"><path d="M384 224v184a40 40 0 01-40 40H104a40 40 0 01-40-40V168a40 40 0 0140-40h167.48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32"/><path d="M459.94 53.25a16.06 16.06 0 00-23.22-.56L424.35 65a8 8 0 000 11.31l11.34 11.32a8 8 0 0011.34 0l12.06-12c6.1-6.09 6.67-16.01.85-22.38zM399.34 90L218.82 270.2a9 9 0 00-2.31 3.93L208.16 299a3.91 3.91 0 004.86 4.86l24.85-8.35a9 9 0 003.93-2.31L422 112.66a9 9 0 000-12.66l-9.95-10a9 9 0 00-12.71 0z" fill="currentColor"/></svg>,
  'delete': <svg viewBox="0 0 512 512"><path d="M112 112l20 320c.95 18.49 14.4 32 32 32h184c17.67 0 30.87-13.51 32-32l20-320" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32"/><path stroke="currentColor" strokeLinecap="round" stroke-miterlimit="10" strokeWidth="32" d="M80 112h352"/><path d="M192 112V72h0a23.93 23.93 0 0124-24h80a23.93 23.93 0 0124 24h0v40M256 176v224M184 176l8 224M328 176l-8 224" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32"/></svg>,
  'close': <svg viewBox="0 0 512 512"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M368 368L144 144M368 144L144 368"/></svg>,
  'check': <svg viewBox="0 0 512 512"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M416 128L192 384l-96-96"/></svg>,
  'send': <svg viewBox="0 0 24 24"><path fill="currentColor" d="m19.8 12.925l-15.4 6.5q-.5.2-.95-.088T3 18.5v-13q0-.55.45-.838t.95-.087l15.4 6.5q.625.275.625.925t-.625.925ZM5 17l11.85-5L5 7v3.5l6 1.5l-6 1.5V17Zm0 0V7v10Z"></path></svg>,
  'folder': <svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 20q-.825 0-1.413-.588T2 18V6q0-.825.588-1.413T4 4h6l2 2h8q.825 0 1.413.588T22 8v10q0 .825-.588 1.413T20 20H4Z"></path></svg>,
  'folder-open': <svg viewBox="0 0 24 24"><path fill="currentColor" d="M22 8H7.85q-1.55 0-2.7.975T4 11.45V18l1.975-6.575q.2-.65.738-1.038T7.9 10h12.9q1.025 0 1.613.813t.312 1.762l-1.8 6q-.2.65-.738 1.038T19 20H4q-.825 0-1.413-.588T2 18V6q0-.825.588-1.413T4 4h5.175q.4 0 .763.15t.637.425L12 6h8q.825 0 1.413.588T22 8Z"></path></svg>,
  'video-file': <svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 18h4q.425 0 .713-.288T14 17v-1l1.275.675q.25.125.488-.025t.237-.425v-2.45q0-.275-.238-.425t-.487-.025L14 14v-1q0-.425-.288-.712T13 12H9q-.425 0-.713.288T8 13v4q0 .425.288.713T9 18Zm-3 4q-.825 0-1.413-.588T4 20V4q0-.825.588-1.413T6 2h7.175q.4 0 .763.15t.637.425l4.85 4.85q.275.275.425.638t.15.762V20q0 .825-.588 1.413T18 22H6Zm7-14V4H6v16h12V9h-4q-.425 0-.713-.288T13 8ZM6 4v5v-5v16V4Z"></path></svg>,
  'playlist': <svg viewBox="0 0 24 24"><path fill="currentColor" d="M3.5 8q-.425 0-.713-.288T2.5 7q0-.425.288-.713T3.5 6h10q.425 0 .713.288T14.5 7q0 .425-.288.713T13.5 8h-10Zm0 4q-.425 0-.713-.288T2.5 11q0-.425.288-.713T3.5 10h10q.425 0 .713.288T14.5 11q0 .425-.288.713T13.5 12h-10Zm0 4q-.425 0-.713-.288T2.5 15q0-.425.288-.713T3.5 14h6q.425 0 .713.288T10.5 15q0 .425-.288.713T9.5 16h-6Zm13.55 3.975q-.5.35-1.025.05t-.525-.9v-4.25q0-.6.525-.9t1.025.05l3.2 2.15q.45.3.45.825t-.45.825l-3.2 2.15Z"></path></svg>,
  'playlist-add': <svg viewBox="0 0 24 24"><path fill="currentColor" d="M17 20q-.425 0-.713-.288T16 19v-3h-3q-.425 0-.713-.288T12 15q0-.425.288-.713T13 14h3v-3q0-.425.288-.713T17 10q.425 0 .713.288T18 11v3h3q.425 0 .713.288T22 15q0 .425-.288.713T21 16h-3v3q0 .425-.288.713T17 20ZM4 16q-.425 0-.713-.288T3 15q0-.425.288-.713T4 14h5q.425 0 .713.288T10 15q0 .425-.288.713T9 16H4Zm0-4q-.425 0-.713-.288T3 11q0-.425.288-.713T4 10h9q.425 0 .713.288T14 11q0 .425-.288.713T13 12H4Zm0-4q-.425 0-.713-.288T3 7q0-.425.288-.713T4 6h9q.425 0 .713.288T14 7q0 .425-.288.713T13 8H4Z"></path></svg>,
  'chat': <svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m0 14H6l-2 2V4h16z"></path></svg>,
  'loading': <svg data-loading-icon viewBox="0 0 24 24"><path fill="currentColor" d="M12 22q-2.05 0-3.875-.788t-3.188-2.15q-1.362-1.362-2.15-3.187T2 12q0-2.075.788-3.888t2.15-3.174Q6.3 3.575 8.124 2.788T12 2q.425 0 .713.288T13 3q0 .425-.288.713T12 4Q8.675 4 6.337 6.337T4 12q0 3.325 2.337 5.663T12 20q3.325 0 5.663-2.337T20 12q0-.425.288-.713T21 11q.425 0 .713.288T22 12q0 2.05-.788 3.875t-2.15 3.188q-1.362 1.362-3.175 2.15T12 22Z"></path></svg>
} as const

export type IconNames = keyof typeof icons

type Props = {
  name: IconNames
} & React.SVGProps<SVGSVGElement>

// Common SVG icons component
export default function Icon({ name, ...props }: Props) {
  const icon = icons[name]
  if (!icon) return null
  return <svg {...props} {...icon.props} width="1em" height="1em"></svg>
}