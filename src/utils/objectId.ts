/** MongoDB ObjectId：24 位 hex（與後端 ObjectId.isValid 對齊用途） */
const OBJECT_ID_RE = /^[a-fA-F0-9]{24}$/

export function isMongoObjectId(id: string): boolean {
  return OBJECT_ID_RE.test(id)
}
