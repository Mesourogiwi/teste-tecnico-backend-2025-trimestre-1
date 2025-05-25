import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator
} from '@nestjs/common'
import {UploadService} from './upload.service'
import {FileInterceptor} from '@nestjs/platform-express'

@Controller('upload/video')
export class UploadController {
    constructor(private readonly uploadService: UploadService) {}

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({maxSize: 1024 * 1024 * 10}),
                    new FileTypeValidator({fileType: 'video/mp4'})
                ]
            })
        )
        file: Express.Multer.File
    ) {
        await this.uploadService.upload(file.originalname, file.buffer)
    }
}
