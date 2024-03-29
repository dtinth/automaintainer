import {
  statSync,
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { dirname, resolve } from "path";

export function isExecutable(fullPath: string) {
  return !!(statSync(fullPath).mode & 0o111);
}

/**
 * A Vfs is a layer on top of the filesystem that allows for
 * staging changes to the filesystem and then flushing them
 * at the end.
 */
export class Vfs {
  private vfs = new Map<string, FileSystemEntryState>();
  version = 0;
  constructor(public readonly basePath: string) {}

  private getEntry(path: string) {
    const fullPath = resolve(this.basePath, path);
    if (!this.vfs.has(path)) {
      this.vfs.set(path, {
        contents: existsSync(fullPath) ? readFileSync(fullPath) : null,
        executable: existsSync(fullPath) && isExecutable(fullPath),
      });
    }
    return this.vfs.get(path)!;
  }
  exists(path: string) {
    return !!this.getEntry(path).contents;
  }
  read(path: string) {
    return this.getEntry(path).contents;
  }
  write(path: string, buf: Buffer | null) {
    const entry = this.getEntry(path);
    const oldBuf = entry.contents;
    if (
      buf !== oldBuf &&
      (buf === null || oldBuf === null || !buf.equals(oldBuf))
    ) {
      entry.contents = buf;
      this.version++;
    }
  }
  setExecutableFlag(path: string, executable: boolean) {
    const entry = this.getEntry(path);
    if (entry.executable !== executable) {
      entry.executable = executable;
      this.version++;
    }
  }
  delete(path: string) {
    this.write(path, null);
  }
  flush() {
    for (const [path, entry] of this.vfs.entries()) {
      const fullPath = resolve(this.basePath, path);
      if (!entry.contents) {
        if (existsSync(fullPath)) {
          unlinkSync(fullPath);
          console.log(`[${chalk.cyan("delete")}] ${path}`);
        }
      } else {
        if (existsSync(fullPath)) {
          const oldBuf = readFileSync(fullPath);
          if (!entry.contents.equals(oldBuf)) {
            writeFileSync(fullPath, entry.contents);
            console.log(`[${chalk.cyan("update")}] ${path}`);
          }
        } else {
          mkdirSync(dirname(fullPath), { recursive: true });
          writeFileSync(fullPath, entry.contents);
          console.log(`[${chalk.cyan("add")}] ${path}`);
        }
        const oldMode = statSync(fullPath).mode;
        const oldExecutable = isExecutable(fullPath);
        if (oldExecutable !== entry.executable) {
          if (entry.executable) {
            console.log(`[${chalk.cyan("chmod +x")}] ${path}`);
            chmodSync(fullPath, oldMode | 0o111);
          } else {
            console.log(`[${chalk.cyan("chmod -x")}] ${path}`);
            chmodSync(fullPath, oldMode & ~0o111);
          }
        }
      }
    }
  }
}

export interface FileSystemEntryState {
  contents: Buffer | null;
  executable: boolean;
}
