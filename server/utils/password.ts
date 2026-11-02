import Scrypt from 'scrypt-kdf'

type ScryptApi = {
  kdf: (
    passphrase: string | Uint8Array,
    params: { logN: number; r?: number; p?: number },
  ) => Promise<Uint8Array>
  verify: (key: string | Uint8Array, passphrase: string | Uint8Array) => Promise<boolean>
}

const scrypt = Scrypt as unknown as ScryptApi

export async function hashPassword(plain: string): Promise<string> {
  const key = await scrypt.kdf(plain, { logN: 15 })
  return Buffer.from(key).toString('base64')
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await scrypt.verify(hash, plain)
  } catch {
    return false
  }
}
