import {CACHE_MANAGER} from '@nestjs/cache-manager'
import {Inject, Injectable} from '@nestjs/common'
import {Cache} from 'cache-manager'
import * as fs from 'fs'
import * as path from 'path'

@Injectable()
export class UploadService {
    private readonly uploadPath = path.join(__dirname, '../../uploadedvideos')

    constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

    async upload(fileName: string, file: Buffer) {
        const filePath = path.join(this.uploadPath, fileName)

        await this.cacheManager.set(`video:${fileName}`, file, 60_000)

        await fs.promises.writeFile(filePath, file)
    }
}
