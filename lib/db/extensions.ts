import { customType } from 'drizzle-orm/pg-core'

export const pgvector = customType<{
  data: number[]
  driverData: number[]
}>({
  dataType() {
    return 'vector'
  },
  toDriver(value: number[]): number[] {
    return value
  },
  fromDriver(value: number[]): number[] {
    return value
  },
}) 