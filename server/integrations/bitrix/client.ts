import { StubBitrixClient } from './stub-client'

export interface BitrixClient {
  upsertParentContact(payload: { email: string; name: string; localUserId: string }): Promise<{ b24Id: string }>
  createLead(payload: Record<string, unknown>): Promise<{ b24Id: string }>
  createDeal(payload: Record<string, unknown>): Promise<{ b24Id: string }>
  createTask(payload: Record<string, unknown>): Promise<{ b24Id: string }>
}

export function createBitrixClient(mode: string): BitrixClient {
  if (mode === 'live') {
    throw new Error('Live Bitrix client is not implemented')
  }
  return new StubBitrixClient()
}
