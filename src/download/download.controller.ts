import {Controller, Get, Param, Headers, Res} from '@nestjs/common'
import {DownloadService} from './download.service'
import {Response} from 'express'

@Controller('static/video')
export class DownloadController {
    constructor(private readonly downloadService: DownloadService) {}

    @Get(':fileName')
    async download(
        @Param('fileName') fileName: string,
        @Res() res: Response,
        @Headers('Range') range?: string
    ) {
        const data = await this.downloadService.download(fileName, range)

        res.writeHead(data.status, data.headers)
        data.file.pipe(res)
    }
}
