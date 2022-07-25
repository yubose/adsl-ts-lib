import type fs from 'fs'

export type Encoding = 'buffer' | 'utf8'
export type FileStats = fs.StatsBase<any>
export type Dirent = fs.Dirent

export abstract class AFileSystem {
  abstract copyFile: (src: string, target: string) => Promise<void>
  abstract ensureDir: (dir: string) => Promise<void>
  abstract exists: (p: string) => Promise<boolean>
  abstract isFile: (p: string) => Promise<boolean>
  abstract isDir: (dir: string) => Promise<boolean>
  abstract moveFile: (src: string, target: string) => Promise<void>
  abstract readFile: <R = string>(p: string) => Promise<R>
  abstract readdir: (dir: string) => Promise<string[]>
  abstract removeFile: (p: string) => Promise<void>
  abstract writeFile: (p: string, data: any) => Promise<void>
}

export abstract class APath {
  abstract dirname(p: string): string
  abstract extname(p: string): string
  abstract isAbsolute(p: string): boolean
  abstract parse(p: string): {
    /**
     * The root of the path such as '/' or 'c:\'
     */
    root: string
    /**
     * The full directory path such as '/home/user/dir' or 'c:\path\dir'
     */
    dir: string
    /**
     * The file name including extension (if any) such as 'index.html'
     */
    base: string
    /**
     * The file extension (if any) such as '.html'
     */
    ext: string
    /**
     * The file name without extension (if any) such as 'index'
     */
    name: string
  }
  abstract join(...p: string[]): string
  abstract normalize(p: string): string
  abstract relative(p1: string, p2: string): string
  abstract resolve(...p: string[]): string
  abstract resolve(p: string): string
}

export abstract class AStructure<Struct extends IStructure = IStructure> {
  abstract name: string
  abstract is(node: any): boolean
  abstract createStructure(node: any): Struct
}

export interface IStructure<S extends string = string> {
  raw: any
  group: S
}

export namespace Ext {
  export type Image = 'bmp' | 'gif' | 'jpeg' | 'jpg' | 'png' | 'webp'
  export type Script = 'js'
  export type Text = 'css' | 'html' | 'txt'
  export type Video = 'avi' | 'flac' | 'mkv' | 'mp4' | 'mpeg' | 'mpg'
}
