import { atom } from 'jotai'

const isAuthenticatedAtom = atom<boolean>(false)

export { isAuthenticatedAtom }