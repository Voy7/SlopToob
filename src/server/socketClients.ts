import type { SocketClient } from '@/typings/socket'

// Because of the order of how things are imported, this was moved
// to it's own file to avoid 'using before initialization' errors

export const socketClients: SocketClient[] = []