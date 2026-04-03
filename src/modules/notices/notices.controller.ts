import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../../shared/constants/http.constants';
import { ApiResponse } from '../../shared/types/api.types';
import { CreateNoticeDTO, NoticeFilterDTO } from './notices.schema';
import { Notice } from './notices.table';

import { NoticesService } from './notices.service';
import { UUID } from '../../shared/schemas/common.schema';

export class NoticesController {
  constructor(private noticesService: NoticesService) {}

  findNotice = async (req: Request<UUID>, res: Response<ApiResponse<Notice>>): Promise<void> => {
    const notice = await this.noticesService.findNoticeById(req.params.id);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(notice));
  };

  findAllNotices = async (
    req: Request,
    res: Response<ApiResponse<Notice[]>>,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { page, pageSize, orderBy, orderDirection, ...businessFilters } =
        req.validatedQuery ?? {};
      const result = await this.noticesService.findAll(businessFilters, {
        page,
        pageSize,
        orderBy,
        orderDirection,
      } as Partial<NoticeFilterDTO>);
      res.status(HTTP_STATUS.OK).json({ data: result.data, meta: result.meta });
    } catch (err) {
      next(err);
    }
  };

  createNotice = async (req: Request, res: Response<ApiResponse<Notice>>, next: NextFunction) => {
    try {
      const dto = req.validatedBody as CreateNoticeDTO;
      const notice = await this.noticesService.createNotice(dto);
      res.status(HTTP_STATUS.CREATED).json(ApiResponse.success(notice));
    } catch (err) {
      next(err);
    }
  };
}
