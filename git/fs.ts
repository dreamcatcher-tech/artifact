import http from 'npm:isomorphic-git/http/web/index.js'
import { assert, Debug, equal, posix, sha1 } from '@utils'
import { Change, ENTRY_BRANCH, JsonValue, PID } from '@/constants.ts'
import git from '$git'
import type DB from '@/db.ts'
import { GitKV } from './gitkv.ts'
const log = Debug('AI:git:fs')
const dir = '/'

export default class FS {
  // pass this object around, and set it to be a particular PID
  readonly #pid: PID
  readonly #oid: string
  readonly #gitkv: GitKV
  readonly #db: DB
  readonly #upserts = new Map<string, string | Uint8Array>()
  readonly #deletes = new Set<string>()
  static #caches = new Map<string, object>()
  static #getGitCache(pid: PID) {
    const key = getCacheKey(pid)
    if (!FS.#caches.has(key)) {
      FS.#caches.set(key, {})
    }
    const cache = FS.#caches.get(key)
    assert(cache)
    return cache
  }
  static clearCache(pid: PID) {
    const key = getCacheKey(pid)
    FS.#caches.delete(key)
  }
  get pid() {
    return this.#pid
  }
  get oid() {
    return this.#oid
  }
  get fs() {
    return { promises: this.#gitkv }
  }
  get isChanged() {
    return this.#upserts.size > 0 || this.#deletes.size > 0
  }
  get upserts() {
    return [...this.#upserts.keys()]
  }
  get deletes() {
    return [...this.#deletes]
  }
  private constructor(pid: PID, oid: string, db: DB) {
    assert(sha1.test(oid), 'Commit not SHA-1: ' + oid)
    this.#pid = pid
    this.#oid = oid
    this.#db = db
    this.#gitkv = GitKV.recreate(db, pid)
  }
  static open(pid: PID, commit: string, db: DB) {
    return new FS(pid, commit, db)
  }
  static async openHead(pid: PID, db: DB) {
    const head = await db.readHead(pid)
    if (!head) {
      throw new Error('HEAD not found: ' + pid.branches.join('/'))
    }
    return new FS(pid, head, db)
  }
  static async init(pid: PID, db: DB) {
    const fs = { promises: GitKV.createBlank(db, pid) }
    await git.init({ fs, dir, defaultBranch: ENTRY_BRANCH })
    log('init complete')
    const author = { name: 'git/init' }
    const cache = FS.#getGitCache(pid)
    const commit = await git.commit({
      noUpdateBranch: true,
      fs,
      dir,
      message: 'initial commit',
      author,
      cache,
    })
    await db.atomic().createBranch(pid, commit).commit()
    const init = new FS(pid, commit, db)
    return init
  }
  static async clone(pid: PID, db: DB) {
    // TODO detect the mainbranch somehow
    const url = `https://github.com/${pid.account}/${pid.repository}.git`
    const fs = { promises: GitKV.createBlank(db, pid) }
    fs.promises.oneAtomicWrite = db.atomic()
    const cache = FS.#getGitCache(pid)
    await git.clone({ fs, dir, url, http, noCheckout: true, cache })
    const commit = await db.readHead(pid)
    assert(commit, 'HEAD not found: ' + pid.branches.join('/'))
    const clone = new FS(pid, commit, db)
    return clone
  }
  /** @param the new PID to branch into */
  branch(pid: PID) {
    assert(pid.account === this.#pid.account, 'account mismatch')
    assert(pid.repository === this.#pid.repository, 'repository mismatch')
    const branches = [...pid.branches]
    branches.pop()
    assert(equal(this.#pid.branches, branches), 'branch mismatch')
    return new FS(pid, this.#oid, this.#db)
  }
  logs(filepath?: string, depth?: number) {
    if (filepath) {
      assertPath(filepath)
    }
    const { fs } = this
    const cache = FS.#getGitCache(this.#pid)
    return git.log({ fs, dir, filepath, depth, ref: this.#oid, cache })
  }

  async writeCommitObject(message = '', parents: string[] = []) {
    assert(this.#upserts.size > 0 || this.#deletes.size > 0, 'empty commit')
    assert(parents.every((oid) => sha1.test(oid)), 'Merge not SHA-1')
    const { oid, changes } = await this.#flush()
    this.#upserts.clear()
    this.#deletes.clear()

    const { fs } = this
    const author = { name: 'git/commit' }
    const cache = FS.#getGitCache(this.#pid)
    const nextCommit = await git.commit({
      noUpdateBranch: true,
      fs,
      dir,
      message,
      author,
      tree: oid,
      parent: [this.#oid, ...parents],
      cache,
    })
    const { commit } = await git.readCommit({ fs, dir, oid: nextCommit, cache })

    const next = new FS(this.#pid, nextCommit, this.#db)
    return { next, changes, commit }
  }
  async #flush() {
    const changes: { [key: string]: Change } = {}
    const oid = await this.#rootOid()
    const { fs } = this
    const cache = FS.#getGitCache(this.#pid)
    const { tree: root } = await git.readTree({ fs, dir, oid, cache })
    log('flush tree', root)
    const tree: Tree = {
      oid,
      tree: root,
      upserts: new Map(),
      deletes: new Set(),
      children: new Map(),
    }
    for (let [path, blob] of this.#upserts) {
      let patch: string | undefined
      if (typeof blob === 'string') {
        patch = blob
        blob = new TextEncoder().encode(blob)
      }
      // TODO parallelize
      const oid = await git.writeBlob({ fs, dir, blob })
      log('hash', oid)
      const parent = ensurePath(tree, path)
      const filename = path.split('/').pop()
      assert(filename, 'filename not found: ' + path)
      parent.upserts.set(filename, {
        // https://isomorphic-git.org/docs/en/walk#walkerentry-mode
        mode: '100644',
        path: filename,
        oid,
        type: 'blob',
      })
      changes[path] = { oid, patch }
    }

    for (const path of this.#deletes) {
      log('delete', path)
      const parent = ensurePath(tree, path)
      const filename = path.split('/').pop()
      assert(filename, 'filename not found: ' + path)
      parent.deletes.add(filename)
      changes[path] = {}
      // TODO should be able to wipe a whole dir with no effort here
    }

    await retrieveAffectedTrees(tree, fs, cache)

    await bubbleChanges(tree, fs)

    return { oid: tree.oid, changes }
  }
  async exists(path: string) {
    assertPath(path)
    if (this.#deletes.has(path)) {
      return false
    }
    if (this.#upserts.has(path)) {
      return true
    }
    if (path === '.') {
      return true
    }

    const dirname = posix.dirname(path)
    const filepath = dirname === '.' ? undefined : dirname
    const oid = await this.#rootOid()
    const { fs } = this
    try {
      const cache = FS.#getGitCache(this.#pid)
      const { tree } = await git.readTree({ fs, dir, oid, filepath, cache })
      const basename = posix.basename(path)
      return tree.some((entry) => entry.path === basename)
    } catch (err) {
      if (err.code === 'NotFoundError') {
        return false
      }
      throw err
    }
  }
  delete(path: string) {
    assertPath(path)
    // TODO delete a whole directory
    log('delete', path)
    this.#deletes.add(path)
    this.#upserts.delete(path)
  }
  writeJSON(path: string, json: unknown) {
    // TODO store json objects specially, only strinify on commit
    // then broadcast changes as json object purely
    assertPath(path)
    assert(posix.extname(path) === '.json', `path must be *.json: ${path}`)
    const string = JSON.stringify(json, null, 2)
    assert(typeof string === 'string', 'stringify failed')
    return this.write(path, string)
  }
  write(path: string, data: string | Uint8Array) {
    assertPath(path)
    log('write', path, data)
    this.#upserts.set(path, data)
    this.#deletes.delete(path)
  }
  async readJSON<T>(path: string): Promise<T> {
    assertPath(path)
    assert(posix.extname(path) === '.json', `path must be *.json: ${path}`)
    const data = await this.read(path)
    return JSON.parse(data)
  }
  async read(path: string) {
    assertPath(path)
    if (this.#upserts.has(path)) {
      const data = this.#upserts.get(path)
      if (typeof data === 'string') {
        return data
      }
    }
    const blob = await this.readBinary(path)
    return new TextDecoder().decode(blob)
  }
  async readBinary(path: string): Promise<Uint8Array> {
    assertPath(path)
    log('read', path)
    if (this.#deletes.has(path)) {
      throw new Error('Could not find file or directory: ' + path)
    }
    if (this.#upserts.has(path)) {
      const data = this.#upserts.get(path)
      if (typeof data === 'string') {
        return new TextEncoder().encode(data)
      }
    }
    const { blob } = await this.readBlob(path)
    return blob
  }
  async readBlob(path: string) {
    const oid = await this.#rootOid()
    log('tree', oid)
    const { fs } = this
    const cache = FS.#getGitCache(this.#pid)
    const { blob, oid: blobOid } = await git.readBlob({
      dir,
      fs,
      oid,
      filepath: path,
      cache,
    })
    assert(blob instanceof Uint8Array, 'blob not Uint8Array: ' + typeof blob)
    return { blob, oid: blobOid }
  }
  async ls(path: string) {
    assertPath(path)
    // TODO make a streaming version of this for very large dirs
    // TODO handle changes in the directory
    log('ls', path)
    const oid = await this.#rootOid()
    const { fs } = this
    const cache = FS.#getGitCache(this.#pid)
    const { tree } = await git.readTree({ fs, dir, oid, filepath: path, cache })
    return tree.map((entry) => entry.path)
  }
  async #rootOid() {
    const commit = await this.getCommit()
    return commit.tree
  }
  async getCommit() {
    const { fs } = this
    const cache = FS.#getGitCache(this.#pid)
    const result = await git.readCommit({ fs, dir, oid: this.#oid, cache })
    return result.commit
  }
  copyChanges(from: FS) {
    assert(!this.isChanged, 'cannot copy changes to a changed FS')
    assert(this.#pid === from.#pid, 'cannot copy changes from different repo')
    for (const path of from.#deletes) {
      this.delete(path)
    }
    for (const [path, data] of from.#upserts) {
      this.write(path, data)
    }
  }
}
type Tree = {
  oid?: string
  tree?: TreeObject
  upserts: Map<string, TreeEntry>
  deletes: Set<string>
  children: Map<string, Tree>
}
type TreeObject = TreeEntry[]
type TreeEntry = {
  /**
   * - the 6 digit hexadecimal mode
   */
  mode: string
  /**
   * - the name of the file or directory
   */
  path: string
  /**
   * - the SHA-1 object id of the blob or tree
   */
  oid: string
  /**
   * - the type of object
   */
  type: 'blob' | 'tree' | 'commit'
}
const ensurePath = (tree: Tree, path: string) => {
  const parts = path.split('/')
  parts.pop()
  let parent = tree
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    let child = parent.children.get(part)
    if (!child) {
      child = {
        upserts: new Map(),
        deletes: new Set(),
        children: new Map(),
      }
      parent.children.set(part, child)
    }
    parent = child
  }
  return parent
}
const retrieveAffectedTrees = async (
  tree: Tree,
  fs: { promises: GitKV },
  cache: object,
) => {
  const promises = []
  if (!tree.tree) {
    assert(tree.oid, 'tree oid not found')
    const result = await git.readTree({ fs, dir, oid: tree.oid, cache })
    tree.tree = result.tree
  }
  for (const entry of tree.tree) {
    if (entry.type === 'tree') {
      if (tree.children.has(entry.path)) {
        const child = tree.children.get(entry.path)
        assert(child, 'child not found: ' + entry.path)
        child.oid = entry.oid
        promises.push(retrieveAffectedTrees(child, fs, cache))
      }
    }
  }
  await Promise.all(promises)
}
const bubbleChanges = async (tree: Tree, fs: { promises: GitKV }) => {
  const layers = treeToLayers(tree)
  log('layers', layers)
  while (layers.length) {
    const layer = layers.pop()
    for (const item of layer!) {
      let tree = item.tree || []
      tree = tree.filter((entry) => {
        if (item.upserts.has(entry.path)) {
          return false
        }
        if (item.deletes.has(entry.path)) {
          return false
        }
        if (item.children.has(entry.path)) {
          return false
        }
        return true
      })
      for (const [, entry] of item.upserts) {
        tree.push(entry)
      }
      for (const [path, child] of item.children) {
        assert(child.oid, 'child oid not found: ' + path)
        const entry: TreeEntry = {
          mode: '040000',
          path,
          oid: child.oid,
          type: 'tree',
        }
        tree.push(entry)
      }
      item.oid = await git.writeTree({ fs, dir, tree })
      log('write tree', item.oid)
    }
  }
}

const treeToLayers = (tree: Tree, layers: Tree[][] = [], level: number = 0) => {
  if (!layers[level]) {
    layers[level] = []
  }
  layers[level].push(tree)
  for (const child of tree.children.values()) {
    treeToLayers(child, layers, level + 1)
  }
  return layers
}
const assertPath = (path: string) => {
  assert(path, `path must be relative: ${path}`)
  assert(!posix.isAbsolute(path), `path must be relative: ${path}`)
  assert(path !== '.git', '.git paths are forbidden: ' + path)
  assert(!path.startsWith('.git/'), '.git paths are forbidden: ' + path)
  assert(!path.endsWith('/'), 'path must not end with /: ' + path)
}
const getCacheKey = (pid: PID) =>
  pid.id + '/' + pid.repository + '/' + pid.account
