import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../../shared/constants/http.constants';
import { ApiResponse } from '../../shared/types/api.types';
import { UUID } from '../../shared/schemas/common.schema';
import { UsersService } from './users.service';
import { UserCreateDTO, UserFilterDTO, UserUpdateDTO, UserUpdateMeDTO } from './users.schema';
import { SafeUser } from './users.repository';

export class UsersController {
  constructor(private usersService: UsersService) {}

  // Admin endpoints
  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, pageSize, orderBy, orderDirection, ...filters } = (req.validatedQuery ??
        {}) as Partial<UserFilterDTO>;
      const result = await this.usersService.findAll(filters, {
        page,
        pageSize,
        orderBy,
        orderDirection,
      });
      res.status(HTTP_STATUS.OK).json({ data: result.data, meta: result.meta });
    } catch (err) {
      next(err);
    }
  };

  findById = async (
    req: Request<UUID>,
    res: Response<ApiResponse<SafeUser>>,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await this.usersService.findById(req.params.id);
      res.status(HTTP_STATUS.OK).json(ApiResponse.success(user));
    } catch (err) {
      next(err);
    }
  };

  create = async (
    req: Request,
    res: Response<ApiResponse<SafeUser>>,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = req.validatedBody as UserCreateDTO;
      const user = await this.usersService.create(dto, req.context);
      res.status(HTTP_STATUS.CREATED).json(ApiResponse.success(user));
    } catch (err) {
      next(err);
    }
  };

  update = async (
    req: Request<UUID>,
    res: Response<ApiResponse<SafeUser>>,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = req.validatedBody as UserUpdateDTO;
      const user = await this.usersService.update(req.params.id, dto, req.context);
      res.status(HTTP_STATUS.OK).json(ApiResponse.success(user));
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request<UUID>, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.usersService.delete(req.params.id, req.context);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  };

  // Perfil propio
  getMe = async (
    req: Request,
    res: Response<ApiResponse<SafeUser>>,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await this.usersService.findMe(req.context);
      res.status(HTTP_STATUS.OK).json(ApiResponse.success(user));
    } catch (err) {
      next(err);
    }
  };

  updateMe = async (
    req: Request,
    res: Response<ApiResponse<SafeUser>>,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = req.validatedBody as UserUpdateMeDTO;
      const user = await this.usersService.updateMe(req.context, dto);
      res.status(HTTP_STATUS.OK).json(ApiResponse.success(user));
    } catch (err) {
      next(err);
    }
  };
}
