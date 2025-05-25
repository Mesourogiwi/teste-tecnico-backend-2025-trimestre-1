import {CACHE_MANAGER} from '@nestjs/cache-manager'
import {Cache} from 'cache-manager'
import {HttpException, HttpStatus, Inject, Injectable, NotFoundException} from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'
import {promisify} from 'util'
import {Readable} from 'stream'
import {bufferToStream} from './utils'

const stat = promisify(fs.stat)

@Injectable()
export class DownloadService {
    constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

    private readonly uploadPath = path.join(__dirname, '../../uploadedvideos')

    async download(
        fileName: string,
        range?: string
    ): Promise<{file: Readable; headers: Record<string, string>; status: number}> {
        const cacheKey = `video:${fileName}`

        const cached = await this.cacheManager.get<Buffer>(cacheKey)
        if (cached) {
            return {
                file: bufferToStream(cached),
                headers: {'Content-Type': 'video/mp4', 'Content-Length': String(cached.length)},
                status: HttpStatus.OK
            }
        }

        const filePath = path.join(this.uploadPath, fileName)
        if (!fs.existsSync(filePath)) {
            throw new NotFoundException('File not found')
        }

        const buffer = await fs.promises.readFile(filePath)
        if (!range) {
            await this.cacheManager.set(cacheKey, buffer, 60_000)
        }

        const fileStat = await stat(filePath)
        const fileSize = fileStat.size

        if (range) {
            const [start, end] = range.replace(/bytes=/, '').split('-')
            if (Number(start) >= fileSize || Number(end) >= fileSize) {
                throw new HttpException('Invalid range', 416)
            }

            const chunkSize = Number(end) - Number(start) + 1
            const headers = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': String(chunkSize),
                'Content-Type': 'video/mp4'
            }

            const cacheKey = `video:${fileName}:${range}`
            let cachedBuffer = await this.cacheManager.get<Buffer>(cacheKey)

            if (cachedBuffer) {
                return {
                    file: bufferToStream(cachedBuffer),
                    headers,
                    status: HttpStatus.PARTIAL_CONTENT
                }
            }

            const buffer: Buffer = await new Promise((resolve, reject) => {
                const chunks: Buffer[] = []
                const fileStream = fs.createReadStream(filePath, {
                    start: Number(start),
                    end: Number(end)
                })

                fileStream.on('data', chunk => {
                    if (typeof chunk === 'string') {
                        chunks.push(Buffer.from(chunk))
                    } else {
                        chunks.push(chunk)
                    }
                })

                fileStream.on('end', () => resolve(Buffer.concat(chunks)))
                fileStream.on('error', reject)
            })

            await this.cacheManager.set(cacheKey, buffer, 60_000)

            return {
                file: bufferToStream(buffer),
                headers,
                status: HttpStatus.PARTIAL_CONTENT
            }
        }

        return {
            file: bufferToStream(buffer),
            headers: {'Content-Type': 'video/mp4', 'Content-Length': String(fileSize)},
            status: HttpStatus.OK
        }
    }
}
